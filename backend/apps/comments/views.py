from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import TaskComment
from .serializers import TaskCommentSerializer


class TaskCommentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskCommentSerializer

    def get_queryset(self):
        task_id = self.request.query_params.get('task')
        queryset = TaskComment.objects.select_related('task', 'user')

        if task_id:
            queryset = queryset.filter(task_id=task_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)