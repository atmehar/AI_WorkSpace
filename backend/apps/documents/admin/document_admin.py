from django.contrib import admin
from apps.documents.models import Document, DocumentChunk


class DocumentChunkInline(admin.TabularInline):
    model = DocumentChunk
    extra = 0
    fields = ('chunk_index', 'page_number', 'content')
    readonly_fields = ('chunk_index', 'page_number', 'content')
    can_delete = False


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'workspace', 'uploaded_by', 'file_type', 'file_size', 'status', 'created_at')
    list_filter = ('status', 'file_type', 'created_at')
    search_fields = ('original_name', 'storage_key', 'uploaded_by__email')
    readonly_fields = ('id', 'storage_key', 'checksum', 'created_at', 'processed_at')
    inlines = [DocumentChunkInline]


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ('document', 'chunk_index', 'page_number', 'created_at')
    list_filter = ('document__file_type', 'created_at')
    search_fields = ('content', 'document__original_name')
