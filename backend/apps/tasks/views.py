from rest_framework.parsers import MultiPartParser, FormParser
from .models import  TaskAttachment, Task, TaskVersion, TaskStatusHistory
from .serializers import (
    TaskVersionSerializer,
    TaskAttachmentSerializer,
    TaskAttachmentUploadSerializer,
    TaskSerializer,
    TaskDetailSerializer,
    TaskFinishSerializer,
    ProgressStatusSerializer,
    ValidationDecisionSerializer,
    RejectTaskSerializer,
)
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.roles import Roles, get_user_role
from apps.accounts.permissions import (
    IsAppAdmin,
    IsAppMember,
    CanDevelop,
    CanValidate,
)
from apps.comments.models import TaskComment



# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
    )
    def submit_validation(self, request, pk=None):
        serializer = TaskFinishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            visible_task = self.get_object()

            task = Task.objects.select_for_update().get(
                pk=visible_task.pk
            )

            if not self.can_work_on_task(task):
                raise PermissionDenied(
                    'Você não pode desenvolver esta task.'
                )

            if task.status != Task.Status.DEVELOPMENT:
                raise ValidationError({
                    'status': 'A task precisa estar em desenvolvimento.'
                })

            data = serializer.validated_data

            TaskVersion.objects.create(
                task=task,
                description=data['description'],
                ops_code=data.get('ops_code', ''),
                project_code=data.get('project_code', ''),
                old_code=data.get('old_code', ''),
                new_code=data.get('new_code', ''),
                created_by=request.user,
            )

            old_status = task.status
            task.status = Task.Status.VALIDATION
            task.save(update_fields=['status', 'updated_at'])

            TaskStatusHistory.objects.create(
                task=task,
                old_status=old_status,
                new_status=Task.Status.VALIDATION,
                action='SUBMIT_VALIDATION',
                changed_by=request.user,
            )

        return Response({
            'message': 'Task enviada para validação.',
            'status': task.status,
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        serializer = ValidationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            visible_task = self.get_object()

            task = Task.objects.select_for_update().get(
                pk=visible_task.pk
            )

            if task.status != Task.Status.VALIDATION:
                raise ValidationError({
                    'status': 'A task não está aguardando validação.'
                })

            message = serializer.validated_data.get('message', '')

            task.status = Task.Status.FINISHED
            task.finished_at = timezone.now()
            task.save(update_fields=['status', 'finished_at', 'updated_at'])

            TaskStatusHistory.objects.create(
                task=task,
                old_status=Task.Status.VALIDATION,
                new_status=Task.Status.FINISHED,
                action='APPROVED',
                message=message,
                changed_by=request.user,
            )

            if message:
                TaskComment.objects.create(
                    task=task,
                    user=request.user,
                    comment=f'Validação aprovada: {message}',
                )

        return Response({
            'message': 'Task aprovada e finalizada.',
            'status': task.status,
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        serializer = RejectTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']

        with transaction.atomic():
            visible_task = self.get_object()

            task = Task.objects.select_for_update().get(
                pk=visible_task.pk
            )

            if task.status != Task.Status.VALIDATION:
                raise ValidationError({
                    'status': 'A task não está aguardando validação.'
                })

            task.status = Task.Status.DEVELOPMENT
            task.finished_at = None
            task.save(update_fields=['status', 'finished_at', 'updated_at'])

            TaskStatusHistory.objects.create(
                task=task,
                old_status=Task.Status.VALIDATION,
                new_status=Task.Status.DEVELOPMENT,
                action='REJECTED',
                message=message,
                changed_by=request.user,
            )

            TaskComment.objects.create(
                task=task,
                user=request.user,
                comment=f'Validação recusada: {message}',
            )

        return Response({
            'message': 'Task recusada e devolvida ao desenvolvimento.',
            'status': task.status,
        })

    def can_work_on_task(self, task):
        user = self.request.user

        if get_user_role(user) == Roles.ADMIN:
            return True

        return (
                task.assigned_to_id == user.id
                or task.assignment_type == Task.AssignmentType.ALL
        )

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
            'versions',
            'status_history'
        )

        user = self.request.user
        role = get_user_role(user)

        if role is None:
            return queryset.none()

        if role != Roles.ADMIN:
            visibility = (
                    Q(assignment_type=Task.AssignmentType.ALL)
                    | Q(assigned_to=user)
                    | Q(created_by=user)
            )

            # O suporte também vê as tasks aguardando validação.
            if role == Roles.SUPPORT:
                visibility |= Q(status=Task.Status.VALIDATION)

            queryset = queryset.filter(visibility)

        status_param = self.request.query_params.get('status')
        project_param = self.request.query_params.get('project')

        if status_param:
            queryset = queryset.filter(status=status_param)

        if project_param:
            queryset = queryset.filter(project_id=project_param)

        return queryset.distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        task = self.get_object()
        versions = task.versions.select_related('created_by')
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
        serializer = ProgressStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']

        allowed_transitions = {
            Task.Status.OPEN: [Task.Status.ANALYSIS],
            Task.Status.ANALYSIS: [Task.Status.DEVELOPMENT],
            Task.Status.DEVELOPMENT: [Task.Status.ANALYSIS],
        }

        with transaction.atomic():
            visible_task = self.get_object()

            task = Task.objects.select_for_update().get(
                pk=visible_task.pk
            )

            if not self.can_work_on_task(task):
                raise PermissionDenied(
                    'Esta task não está atribuída a você.'
                )

            if new_status not in allowed_transitions.get(task.status, []):
                raise ValidationError({
                    'status': 'Transição de status não permitida.'
                })

            old_status = task.status

            task.status = new_status

            if new_status == Task.Status.DEVELOPMENT and not task.started_at:
                task.started_at = timezone.now()

            update_fields = ['status', 'updated_at']
            if new_status == Task.Status.DEVELOPMENT and not task.started_at:
                update_fields.append('started_at')
            task.save(update_fields=update_fields)

            TaskStatusHistory.objects.create(
                task=task,
                old_status=old_status,
                new_status=new_status,
                action='PROGRESS',
                changed_by=request.user,
            )

        return Response(TaskSerializer(task).data)

    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_attachment(self, request, pk=None):
        task = self.get_object()
        upload_serializer = TaskAttachmentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        uploaded_file = upload_serializer.validated_data['file']

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

    def get_permissions(self):
        if self.action in ['change_status', 'submit_validation']:
            return [IsAuthenticated(), CanDevelop()]

        if self.action in ['approve', 'reject']:
            return [IsAuthenticated(), CanValidate()]

        if self.action in [
            'update',
            'partial_update',
            'destroy',
        ]:
            return [IsAuthenticated(), IsAppAdmin()]

        return [IsAuthenticated(), IsAppMember()]
