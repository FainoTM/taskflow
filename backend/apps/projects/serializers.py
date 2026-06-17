from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'code',
            'description',
            'is_active',
            'tasks_count',
            'created_at'
        ]
