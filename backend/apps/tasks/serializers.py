from rest_framework import serializers
from .models import Task, TaskVersion, TaskAttachment
from apps.comments.serializers import TaskCommentSerializer

class TaskVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = TaskVersion
        fields = [
            'id',
            'task',
            'description',
            'ops_code',
            'project_code',
            'old_code',
            'new_code',
            'created_by',
            'created_by_name',
            'created_at'
        ]
        read_only_fields = ['created_at', 'created_by']


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'tasktype',
            'status',
            'priority',
            'project',
            'project_name',
            'project_code',
            'created_by',
            'created_by_name',
            'assigned_to',
            'assigned_to_name',
            'started_at',
            'finished_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'created_by',
            'started_at',
            'finished_at',
            'created_at',
            'updated_at',
        ]
class TaskFinishSerializer(serializers.ModelSerializer):
    description = serializers.CharField()
    ops_code = serializers.CharField(required=False, allow_blank=True)
    project_code = serializers.CharField(required=False, allow_blank=True)
    old_code = serializers.FileField(required=False, allow_empty_file=True)
    new_code = serializers.FileField(required=False, allow_empty_file=True)

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.get_full_name',
        read_only=True
    )

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = [
            'id',
            'task',
            'file',
            'file_url',
            'original_name',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
        ]

        read_only_fields = [
            'task',
            'uploaded_by',
            'created_at',
            'original_name',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')

        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)

        if obj.file:
            return obj.file.url

        return None

class TaskDetailSerializer(TaskSerializer):
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    versions = TaskVersionSerializer(many=True, read_only=True)

    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + [
            'comments',
            'attachments',
            'versions',
        ]