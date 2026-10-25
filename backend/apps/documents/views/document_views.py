import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from apps.documents.models import Document, DocumentChunk
from apps.documents.serializers import (
    DocumentUploadSerializer,
    DocumentDetailSerializer,
    DocumentStatusSerializer,
    DocumentChunkSerializer
)
from apps.documents.services import DocumentStorageService, DocumentDeletionService, DocumentIngestionService
from apps.workspaces.services import WorkspaceService


class DocumentListCreateView(APIView):
    """Lists user documents and handles multipart document uploads."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        queryset = Document.objects.filter(workspace__owner=request.user)
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        serializer = DocumentDetailSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check maximum documents per user limit
        max_docs = getattr(settings, 'MAX_DOCUMENTS_PER_USER', 10)
        user_doc_count = Document.objects.filter(workspace__owner=request.user).count()
        if user_doc_count >= max_docs:
            return Response(
                {"error": {"code": "DOCUMENT_LIMIT_REACHED", "message": f"Maximum document limit of {max_docs} reached."}},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = serializer.validated_data['file']
        workspace_id = serializer.validated_data.get('workspace_id')
        workspace = WorkspaceService.get_user_workspace(request.user, workspace_id)

        ext = os.path.splitext(uploaded_file.name)[1].lower()
        file_type = DocumentUploadSerializer.ALLOWED_EXTENSIONS[ext]

        storage_key, checksum, file_size = DocumentStorageService.save_file(uploaded_file)

        document = Document.objects.create(
            workspace=workspace,
            uploaded_by=request.user,
            original_name=uploaded_file.name,
            storage_key=storage_key,
            file_type=file_type,
            file_size=file_size,
            checksum=checksum,
            status=Document.Status.UPLOADED
        )

        # Trigger ingestion in background thread
        DocumentIngestionService.trigger_async_processing(str(document.id))

        response_serializer = DocumentDetailSerializer(document)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """Retrieves or deletes a document with full cascade cleanup."""
    permission_classes = [IsAuthenticated]

    def get_document(self, request, doc_id):
        try:
            return Document.objects.get(id=doc_id, workspace__owner=request.user)
        except Document.DoesNotExist:
            return None

    def get(self, request, id):
        document = self.get_document(request, id)
        if not document:
            return Response({"error": {"code": "NOT_FOUND", "message": "Document not found."}}, status=status.HTTP_404_NOT_FOUND)
        serializer = DocumentDetailSerializer(document)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, id):
        document = self.get_document(request, id)
        if not document:
            return Response({"error": {"code": "NOT_FOUND", "message": "Document not found."}}, status=status.HTTP_404_NOT_FOUND)

        DocumentDeletionService.delete_document(document)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentStatusView(APIView):
    """Endpoint for polling document processing lifecycle status."""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            document = Document.objects.get(id=id, workspace__owner=request.user)
        except Document.DoesNotExist:
            return Response({"error": {"code": "NOT_FOUND", "message": "Document not found."}}, status=status.HTTP_404_NOT_FOUND)

        serializer = DocumentStatusSerializer(document)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DocumentChunksListView(APIView):
    """Lists extracted chunks and page references for a ready document."""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            document = Document.objects.get(id=id, workspace__owner=request.user)
        except Document.DoesNotExist:
            return Response({"error": {"code": "NOT_FOUND", "message": "Document not found."}}, status=status.HTTP_404_NOT_FOUND)

        chunks = document.chunks.all().order_by('chunk_index')
        serializer = DocumentChunkSerializer(chunks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
