import tempfile

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.projects.models import Project
from apps.tasks.models import Task, TaskAttachment, TaskStatusHistory, TaskVersion
from apps.tasks.serializers import MAX_ATTACHMENT_SIZE


class TaskAttachmentUploadTests(APITestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        self.settings_override = override_settings(
            MEDIA_ROOT=self.media_directory.name
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)

        self.user = get_user_model().objects.create_user(
            username='attachment-user',
            password='test-password',
        )
        self.user.groups.add(Group.objects.create(name='Programador'))
        self.project = Project.objects.create(
            name='TaskFlow',
            code='TF',
        )
        self.task = Task.objects.create(
            title='Task com anexo',
            description='Validar upload',
            project=self.project,
            created_by=self.user,
        )
        self.url = f'/api/tasks/{self.task.id}/upload_attachment/'
        self.client.force_authenticate(self.user)

    def test_uploads_allowed_attachment(self):
        uploaded_file = SimpleUploadedFile(
            'evidencia.png',
            b'fake-png-content',
            content_type='image/png',
        )

        response = self.client.post(
            self.url,
            {'file': uploaded_file},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TaskAttachment.objects.count(), 1)
        self.assertEqual(response.data['original_name'], 'evidencia.png')

    def test_rejects_unsupported_extension(self):
        uploaded_file = SimpleUploadedFile(
            'script.exe',
            b'not-allowed',
            content_type='application/octet-stream',
        )

        response = self.client.post(
            self.url,
            {'file': uploaded_file},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
        self.assertEqual(TaskAttachment.objects.count(), 0)

    def test_rejects_oversized_attachment(self):
        uploaded_file = SimpleUploadedFile(
            'grande.pdf',
            b'x' * (MAX_ATTACHMENT_SIZE + 1),
            content_type='application/pdf',
        )

        response = self.client.post(
            self.url,
            {'file': uploaded_file},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
        self.assertEqual(TaskAttachment.objects.count(), 0)

    def test_rejects_mime_type_that_does_not_match_extension(self):
        uploaded_file = SimpleUploadedFile(
            'documento.pdf',
            b'not-a-pdf',
            content_type='image/png',
        )

        response = self.client.post(
            self.url,
            {'file': uploaded_file},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
        self.assertEqual(TaskAttachment.objects.count(), 0)


class TaskAccessControlTests(APITestCase):
    def setUp(self):
        admin_group = Group.objects.create(name='Administrador')
        support_group = Group.objects.create(name='Suporte')
        developer_group = Group.objects.create(name='Programador')

        user_model = get_user_model()
        self.admin = user_model.objects.create_user('admin-user', password='test')
        self.support = user_model.objects.create_user('support-user', password='test')
        self.developer = user_model.objects.create_user('developer-user', password='test')
        self.outsider = user_model.objects.create_user('no-role-user', password='test')
        self.admin.groups.add(admin_group)
        self.support.groups.add(support_group)
        self.developer.groups.add(developer_group)

        self.project = Project.objects.create(name='TaskFlow', code='TF')
        self.task = Task.objects.create(
            title='Controle de acesso',
            description='Validar fluxo',
            project=self.project,
            created_by=self.support,
            assigned_to=self.developer,
            assignment_type=Task.AssignmentType.USER,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user)

    def test_me_requires_an_app_role(self):
        self.authenticate(self.outsider)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_me_returns_scalar_admin_role(self):
        self.authenticate(self.admin)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'ADMIN')

    def test_support_cannot_change_progress(self):
        self.authenticate(self.support)
        response = self.client.patch(
            f'/api/tasks/{self.task.id}/change_status/',
            {'status': Task.Status.ANALYSIS},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_only_use_valid_progress_transitions(self):
        self.authenticate(self.developer)
        url = f'/api/tasks/{self.task.id}/change_status/'

        response = self.client.patch(url, {'status': Task.Status.DEVELOPMENT}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.patch(url, {'status': Task.Status.ANALYSIS}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.patch(url, {'status': Task.Status.DEVELOPMENT}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(TaskStatusHistory.objects.filter(action='PROGRESS').count(), 2)

    def test_developer_submits_version_for_validation(self):
        self.task.status = Task.Status.DEVELOPMENT
        self.task.save(update_fields=['status'])
        self.authenticate(self.developer)

        response = self.client.post(
            f'/api/tasks/{self.task.id}/submit_validation/',
            {'description': 'Correção aplicada', 'ops_code': 'OPS-1'},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.VALIDATION)
        self.assertTrue(TaskVersion.objects.filter(task=self.task, ops_code='OPS-1').exists())

    def test_support_rejection_requires_message_and_returns_to_development(self):
        self.task.status = Task.Status.VALIDATION
        self.task.save(update_fields=['status'])
        self.authenticate(self.support)
        url = f'/api/tasks/{self.task.id}/reject/'

        response = self.client.post(url, {'message': '   '}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(url, {'message': 'Corrigir o cenário X.'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.DEVELOPMENT)
        self.assertTrue(
            TaskStatusHistory.objects.filter(
                task=self.task,
                action='REJECTED',
                message='Corrigir o cenário X.',
            ).exists()
        )

    def test_developer_cannot_approve_and_support_can(self):
        self.task.status = Task.Status.VALIDATION
        self.task.save(update_fields=['status'])
        url = f'/api/tasks/{self.task.id}/approve/'

        self.authenticate(self.developer)
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.authenticate(self.support)
        response = self.client.post(url, {'message': 'Validado.'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.FINISHED)
        self.assertIsNotNone(self.task.finished_at)

    def test_old_finish_endpoint_is_not_available(self):
        self.authenticate(self.admin)
        response = self.client.post(
            f'/api/tasks/{self.task.id}/finish/',
            {'description': 'Tentativa de bypass'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
