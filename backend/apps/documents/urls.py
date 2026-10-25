from django.urls import path
from apps.documents.views import (
    DocumentListCreateView,
    DocumentDetailView,
    DocumentStatusView,
    DocumentChunksListView
)

app_name = 'documents'

urlpatterns = [
    path('', DocumentListCreateView.as_view(), name='document_list_create'),
    path('<uuid:id>/', DocumentDetailView.as_view(), name='document_detail'),
    path('<uuid:id>/status/', DocumentStatusView.as_view(), name='document_status'),
    path('<uuid:id>/chunks/', DocumentChunksListView.as_view(), name='document_chunks'),
]
