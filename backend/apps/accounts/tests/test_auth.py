from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('accounts:register')
        self.login_url = reverse('accounts:login')
        self.me_url = reverse('accounts:me')

    def test_registration_and_workspace_provisioning(self):
        payload = {
            "email": "test@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', res.data)
        self.assertIn('access', res.data['tokens'])

        user = CustomUser.objects.get(email="test@example.com")
        self.assertTrue(user.is_active)
        self.assertEqual(user.owned_workspaces.count(), 1)
        self.assertIsNotNone(user.profile)
