from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.workspaces.models import Workspace


class WorkspaceTests(TestCase):
    def setUp(self):
        self.user1 = CustomUser.objects.create_user(email="user1@example.com", password="Password123!")
        self.user2 = CustomUser.objects.create_user(email="user2@example.com", password="Password123!")
        self.workspace1 = Workspace.objects.create(owner=self.user1, name="User1 Workspace")
        self.workspace2 = Workspace.objects.create(owner=self.user2, name="User2 Workspace")

        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)

    def test_tenant_isolation(self):
        # User 1 should only list their own workspace
        res = self.client1.get('/api/v1/workspaces/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Handle paginated or unpaginated response
        results = res.data['results'] if 'results' in res.data else res.data
        workspace_ids = [w['id'] for w in results]
        self.assertIn(str(self.workspace1.id), workspace_ids)
        self.assertNotIn(str(self.workspace2.id), workspace_ids)

        # Attempting to access User 2's workspace returns 404 or 403
        tamper_res = self.client1.get(f'/api/v1/workspaces/{self.workspace2.id}/')
        self.assertIn(tamper_res.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])
