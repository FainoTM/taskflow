from django.db.models import Q

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsAppMember
from apps.accounts.roles import Roles, get_user_role
from apps.tasks.models import Task

from .models import TaskComment
from .serializers import TaskCommentSerializer


class TaskCommentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAppMember]
    serializer_class = TaskCommentSerializer

    def get_queryset(self):
        task_id = self.request.query_params.get('task')
        queryset = TaskComment.objects.select_related('task', 'user')

        role = get_user_role(self.request.user)
        if role != Roles.ADMIN:
            visibility = (
                Q(assignment_type=Task.AssignmentType.ALL)
                | Q(assigned_to=self.request.user)
                | Q(created_by=self.request.user)
            )

            if role == Roles.SUPPORT:
                visibility |= Q(status=Task.Status.VALIDATION)

            visible_tasks = Task.objects.filter(visibility)
            queryset = queryset.filter(task__in=visible_tasks)

        if task_id:
            queryset = queryset.filter(task_id=task_id)

        return queryset

    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        role = get_user_role(self.request.user)
        can_access_task = role == Roles.ADMIN or (
            task.assignment_type == Task.AssignmentType.ALL
            or task.assigned_to_id == self.request.user.id
            or task.created_by_id == self.request.user.id
            or (role == Roles.SUPPORT and task.status == Task.Status.VALIDATION)
        )

        if not can_access_task:
            raise PermissionDenied('Você não pode comentar nesta task.')

        serializer.save(user=self.request.user)
