from django.db import models
from django.conf import settings

from backend.apps.projects.models import Project


# Create your models here.
class Task(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Aberto'
        ANALYSIS = 'ANALYSIS', 'Em análise'
        DEVELOPMENT = 'DEVELOPMENT', 'Em desenvolvimento'
        VALIDATION = 'VALIDATION', 'Aguardando validação'
        FINISHED = 'FINISHED', 'Finalizado'
        CANCELLED = 'CANCELLED', 'Cancelado'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Baixa'
        MEDIUM = 'MEDIUM', 'Média'
        HIGH = 'HIGH', 'Alta'
        URGENT = 'URGENT', 'Urgente'

    class Type(models.TextChoices):
        BUG = 'BUG', 'Bug'
        FEATURE = 'FEATURE', 'Melhoria'
        SUPPORT = 'SUPPORT', 'Suporte'
        DATABASE = 'DATABASE', 'Banco de Dados'
        OTHER = 'OTHER', 'Outro'

    title = models.CharField(max_length=180)
    description = models.TextField()

    tasktype = models.CharField(max_length=20, choices=Type, default=Type.BUG)
    priority = models.CharField(max_length=20, choices=Priority, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status, default=Status.OPEN)

    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name='tasks')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_tasks')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='assigned_tasks', blank=True, null=True)

    started_at = models.DateTimeField(blank=True, null=True)
    finished_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'#{self.id} - {self.title}'

class TaskVersion(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='versions')
    description = models.TextField()
    ops_code = models.CharField(max_length=80, blank=True, null=True)
    project_code = models.CharField(max_length=80, blank=True, null=True)

    old_code = models.TextField(blank=True, null=True)
    new_code = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='tasks_versions')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
