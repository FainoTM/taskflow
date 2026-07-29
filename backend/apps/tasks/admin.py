from django.contrib import admin
from .models import Task, TaskVersion


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'title',
        'project',
        'status',
        'priority',
        'tasktype',
        'created_by',
        'assigned_to',
        'created_at',
    ]
    list_filter = ['status', 'priority', 'tasktype', 'project']
    search_fields = ['title', 'description']


@admin.register(TaskVersion)
class TaskVersionAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'task',
        'ops_code',
        'project_code',
        'created_by',
        'created_at',
    ]
    search_fields = ['description', 'ops_code', 'project_code']