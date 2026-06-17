from rest_framework import serializers
from .models import TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source='user.get_full_name',
        read_only=True
    )

    class Meta:
        model = TaskComment
        fields = [
            'id',
            'task',
            'user',
            'user_name',
            'comment',
            'created_at',
        ]

        read_only_fields = ['user', 'created_at']