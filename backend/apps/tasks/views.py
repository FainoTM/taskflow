from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Task, TaskVersion, TaskAttachment
from .serializers import (
    TaskSerializer,
    TaskDetailSerializer,
    TaskVersionSerializer,
    TaskFinishSerializer,
    TaskAttachmentSerializer,
)


# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer

        return TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.select_related(
            'project',
            'created_by',
            'assigned_to'
        ).prefetch_related(
            'comments',
            'attachments',
            'versions'
        )

        user = self.request.user

        if not user.is_staff:
            queryset = queryset.filter(
                Q(assignment_type=Task.AssignmentType.ALL)
                |
                Q(
                    assignment_type=Task.AssignmentType.USER,
                    assigned_to=user
                )
            )

        status_param = self.request.query_params.get('status')
        project_param = self.request.query_params.get('project')

        if status_param:
            queryset = queryset.filter(status=status_param)

        if project_param:
            queryset = queryset.filter(project_id=project_param)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        task = self.get_object()

        serializer = TaskFinishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        TaskVersion.objects.create(
            task=task,
            description=serializer.validated_data['description'],
            ops_code=serializer.validated_data.get('ops_code', ''),
            project_code=serializer.validated_data.get('project_code', ''),
            old_version=serializer.validated_data.get('old_version', ''),
            new_version=serializer.validated_data.get('new_version', ''),
            created_by=request.user,
        )

        task.status = Task.Status.FINISHED
        task.finished_at = timezone.now()
        task.save(update_fields=['status', 'finished_at', 'updated_at'])

        return Response(
            {'message': 'Task finalizada com sucesso!'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        task = self.get_object()
        versions = task.versions.select_related('created_at')
        serializer = TaskVersionSerializer(versions, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        tasks = self.get_queryset()

        data = {
            'OPEN': [],
            'ANALYSIS': [],
            'DEVELOPMENT': [],
            'VALIDATION': [],
            'FINISHED': [],
            'CANCELLED': [],
        }

        for task in tasks:
            serialized = TaskSerializer(task).data
            data[task.status].append(serialized)

        return Response(data)

    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')

        valid_statuses = [choice[0] for choice in Task.Status.choices]

        if new_status not in valid_statuses:
            return Response(
                {'detail': 'Status inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status

        if new_status == Task.Status.DEVELOPMENT and not task.started_at:
            task.started_at = timezone.now()

        if new_status == Task.Status.FINISHED:
            task.finished_at = timezone.now()

        task.save()

        serializer = TaskSerializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        task = self.get_object()
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response(
                {'detail': 'Nenhum arquivo enviado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachment = TaskAttachment.objects.create(
            task=task,
            file=uploaded_file,
            original_name=uploaded_file.name,
            uploaded_by=request.user,
        )

        serializer = TaskAttachmentSerializer(
            attachment,
            context={'request': request}
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
