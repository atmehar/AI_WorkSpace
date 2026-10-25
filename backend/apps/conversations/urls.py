from django.urls import path
from apps.conversations.views import (
    ConversationListCreateView,
    ConversationDetailView,
    ConversationMessagesView,
    AskQuestionView
)

app_name = 'conversations'

urlpatterns = [
    path('', ConversationListCreateView.as_view(), name='conversation_list_create'),
    path('<uuid:id>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('<uuid:id>/messages/', ConversationMessagesView.as_view(), name='conversation_messages'),
    path('<uuid:id>/ask/', AskQuestionView.as_view(), name='conversation_ask'),
]
