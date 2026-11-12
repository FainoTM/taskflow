from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APITestCase


class ProjectAccessControlTests(APITestCase):
    def setUp(self):
        admin_group = Group.objects.create(name='Administrador')
        support_group = Group.objects.create(name='Suporte')
        user_model = get_user_model()
        self.admin = user_model.objects.create_user('project-admin')
        self.support = user_model.objects.create_user('project-support')
        self.admin.groups.add(admin_group)
        self.support.groups.add(support_group)

    def test_support_can_list_but_cannot_create_projects(self):
        self.client.force_authenticate(self.support)
        self.assertEqual(self.client.get('/api/projects/').status_code, status.HTTP_200_OK)
        response = self.client.post(
            '/api/projects/',
            {'name': 'Novo', 'code': 'NEW', 'description': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_projects(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            '/api/projects/',
            {'name': 'Novo', 'code': 'new', 'description': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'NEW')
