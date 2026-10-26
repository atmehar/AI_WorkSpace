from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.workspaces.models import Workspace
from apps.conversations.models import Conversation


class ConversationTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="chatuser@example.com", password="Password123!")
        self.workspace = Workspace.objects.create(owner=self.user, name="Chat Workspace")
        self.conversation = Conversation.objects.create(
            workspace=self.workspace,
            created_by=self.user,
            title="Policy Thread"
        )
        from apps.accounts.models import UserProfile
        UserProfile.objects.get_or_create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_ask_question_abstains_when_no_documents(self):
        # When no documents are uploaded, RAG must safely abstain
        url = f'/api/v1/conversations/{self.conversation.id}/ask/'
        payload = {"question": "What is the return period?"}

        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("I couldn't find this information", res.data['answer'])
        self.assertTrue(res.data['is_abstention'])
        self.assertEqual(len(res.data['sources']), 0)
        self.assertIn('usage', res.data)

    def test_get_request_detail(self):
        from apps.conversations.models import Message
        msg = Message.objects.create(
            conversation=self.conversation,
            role=Message.Role.ASSISTANT,
            content="Answer content",
            sources=[{"chunk_id": "test", "excerpt": "snippet"}],
            status=Message.Status.COMPLETED
        )
        url = f'/api/v1/requests/{msg.id}/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['request_id'], str(msg.id))
        self.assertEqual(res.data['status'], 'completed')
        self.assertEqual(res.data['content'], "Answer content")
