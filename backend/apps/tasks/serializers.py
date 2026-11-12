from pathlib import Path

from rest_framework import serializers
from .models import Task, TaskVersion, TaskAttachment, TaskStatusHistory
from apps.comments.serializers import TaskCommentSerializer


MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
ALLOWED_ATTACHMENT_TYPES = {
    '.png': {'image/png'},
    '.jpg': {'image/jpeg'},
    '.jpeg': {'image/jpeg'},
    '.gif': {'image/gif'},
    '.webp': {'image/webp'},
    '.pdf': {'application/pdf'},
    '.xls': {'application/vnd.ms-excel'},
    '.xlsx': {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    '.doc': {'application/msword'},
    '.docx': {
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    },
}


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
    task_type = serializers.ChoiceField(
        source='tasktype',
        choices=Task.Type.choices,
    )
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'task_type',
            'status',
            'priority',
            'project',
            'project_name',
            'project_code',
            'created_by',
            'created_by_name',
            'assigned_to',
            'assigned_to_name',
            'assignment_type',
            'started_at',
            'finished_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_by',
            'status',
            'started_at',
            'finished_at',
            'created_at',
            'updated_at',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assignment_type == Task.AssignmentType.ALL:
            return 'Todos os usuários'

        if not obj.assigned_to:
            return None

        return obj.assigned_to.get_full_name() or obj.assigned_to.username

    def validate(self, attrs):
        assignment_type = attrs.get(
            'assignment_type',
            getattr(
                self.instance,
                'assignment_type',
                Task.AssignmentType.ALL
            )
        )

        assigned_to = attrs.get(
            'assigned_to',
            getattr(self.instance, 'assigned_to', None)
        )

        if (
                assignment_type == Task.AssignmentType.USER
                and assigned_to is None
        ):
            raise serializers.ValidationError({
                'assigned_to':
                    'Selecione um usuário para esta task.'
            })

        if assignment_type == Task.AssignmentType.ALL:
            attrs['assigned_to'] = None

        return attrs

    def validate_project(self, project):
        if not project.is_active:
            raise serializers.ValidationError(
                'Não é possível vincular uma task a um projeto inativo.'
            )
        return project


class TaskFinishSerializer(serializers.Serializer):
    description = serializers.CharField()
    ops_code = serializers.CharField(required=False, allow_blank=True)
    project_code = serializers.CharField(required=False, allow_blank=True)
    old_code = serializers.FileField(required=False, allow_empty_file=True)
    new_code = serializers.FileField(required=False, allow_empty_file=True)


class TaskStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskStatusHistory
        fields = [
            'id',
            'old_status',
            'new_status',
            'action',
            'message',
            'changed_by',
            'changed_by_name',
            'created_at',
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        return obj.changed_by.get_full_name() or obj.changed_by.username

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


class TaskAttachmentUploadSerializer(serializers.Serializer):
    file = serializers.FileField(allow_empty_file=False)

    def validate_file(self, uploaded_file):
        extension = Path(uploaded_file.name).suffix.lower()

        if len(uploaded_file.name) > 255:
            raise serializers.ValidationError(
                'O nome do arquivo deve ter no máximo 255 caracteres.'
            )

        if extension not in ALLOWED_ATTACHMENT_TYPES:
            raise serializers.ValidationError(
                'Formato não permitido. Envie uma imagem, PDF, Excel ou Word.'
            )

        if uploaded_file.size > MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError(
                'O arquivo deve ter no máximo 10 MB.'
            )

        content_type = getattr(uploaded_file, 'content_type', '').lower()
        allowed_content_types = ALLOWED_ATTACHMENT_TYPES[extension]

        if (
            content_type
            and content_type != 'application/octet-stream'
            and content_type not in allowed_content_types
        ):
            raise serializers.ValidationError(
                'O conteúdo do arquivo não corresponde ao formato informado.'
            )

        return uploaded_file

class TaskDetailSerializer(TaskSerializer):
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    versions = TaskVersionSerializer(many=True, read_only=True)
    status_history = TaskStatusHistorySerializer(many=True, read_only=True)

    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + [
            'comments',
            'attachments',
            'versions',
            'status_history',
        ]


class ProgressStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['ANALYSIS', 'DEVELOPMENT']
    )


class ValidationDecisionSerializer(serializers.Serializer):
    message = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_message(self, value):
        return value.strip()


class RejectTaskSerializer(serializers.Serializer):
    message = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True
    )
