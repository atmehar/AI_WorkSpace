import io
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.workspaces.models import Workspace
from apps.documents.models import Document


class DocumentTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="docuser@example.com", password="Password123!")
        self.workspace = Workspace.objects.create(owner=self.user, name="Doc Workspace")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_upload_text_file(self):
        content = b"This is a company refund policy text document. Customers can return items within 30 days."
        uploaded_file = SimpleUploadedFile("policy.txt", content, content_type="text/plain")

        res = self.client.post('/api/v1/documents/', {'file': uploaded_file, 'workspace_id': str(self.workspace.id)}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['original_name'], "policy.txt")
        self.assertEqual(res.data['file_type'], "TXT")
        self.assertIn(res.data['status'], ['UPLOADED', 'PROCESSING', 'READY'])

    def test_reject_oversized_file(self):
        large_content = b"a" * (6 * 1024 * 1024)  # 6 MB (limit is 5 MB)
        uploaded_file = SimpleUploadedFile("big.txt", large_content, content_type="text/plain")

        res = self.client.post('/api/v1/documents/', {'file': uploaded_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
