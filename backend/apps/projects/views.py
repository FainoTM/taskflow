
from django.db.models import Count
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import (
    IsAppAdmin,
    IsAppMember,
)

from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsAppMember()]

        return [IsAuthenticated(), IsAppAdmin()]

    def get_queryset(self):
        return Project.objects.annotate(
            tasks_count=Count('tasks')
        ).order_by('name')
