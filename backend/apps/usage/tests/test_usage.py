from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser, UserProfile
from apps.usage.services import QuotaService


class UsageTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="usageuser@example.com", password="Password123!")
        UserProfile.objects.get_or_create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_usage_status(self):
        res = self.client.get('/api/v1/usage/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('limit', res.data)
        self.assertIn('used', res.data)
        self.assertIn('remaining', res.data)
        self.assertIn('reset_time', res.data)
        self.assertEqual(res.data['used'], 0)
        self.assertEqual(res.data['remaining'], res.data['limit'])

    def test_quota_exhaustion_blocks_reservation(self):
        profile = self.user.profile
        profile.daily_questions_used = 20
        profile.save()

        with self.assertRaises(Exception):
            QuotaService.reserve_question_quota(self.user)
