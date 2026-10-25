from rest_framework import serializers
from apps.documents.models import Document, DocumentChunk


class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = ('id', 'chunk_index', 'content', 'page_number', 'section_title', 'created_at')


class DocumentDetailSerializer(serializers.ModelSerializer):
    chunks_count = serializers.SerializerMethodField()
    workspace_name = serializers.ReadOnlyField(source='workspace.name')

    class Meta:
        model = Document
        fields = (
            'id', 'workspace', 'workspace_name', 'original_name', 'file_type',
            'file_size', 'status', 'error_code', 'error_message', 'chunks_count',
            'created_at', 'processed_at'
        )
        read_only_fields = fields

    def get_chunks_count(self, obj):
        return obj.chunks.count()


class DocumentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'status', 'error_code', 'error_message', 'processed_at')
        read_only_fields = fields
