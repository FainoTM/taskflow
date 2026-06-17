from django.db.models import Count
from django.shortcuts import render
from rest_framework import viewsets

from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer


# Create your views here.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.annotate(
            task_count=Count('task')
        )