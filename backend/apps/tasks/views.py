from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tasks.serializers import TaskSerializer, TaskFinishSerializer, TaskVersionSerializer
from .models import Task, TaskVersion

# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.select_related(
            'project',
            'created_by',
            'assigned_to',
        )

        status_param = self.request.query_params.get('status')
        project_param = self.request.query_params.get('project')
        assigned_to_param = self.request.query_params.get('assigned_to')

        if status_param:
            queryset = queryset.filter(status=status_param)

        if project_param:
            queryset = queryset.filter(project_id=project_param)

        if assigned_to_param:
            queryset = queryset.filter(assigned_to_id=assigned_to_param)

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
    def kanban(self,request):
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