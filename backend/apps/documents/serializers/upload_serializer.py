import os
from rest_framework import serializers
from django.conf import settings
from apps.documents.models import Document
from apps.workspaces.models import Workspace


class DocumentUploadSerializer(serializers.Serializer):
    """Validates file upload including format, MIME header, and size limits."""

    file = serializers.FileField(required=True)
    workspace_id = serializers.UUIDField(required=False, allow_null=True)

    ALLOWED_EXTENSIONS = {
        '.pdf': Document.FileType.PDF,
        '.docx': Document.FileType.DOCX,
        '.txt': Document.FileType.TXT,
    }

    def validate_file(self, file_obj):
        max_mb = getattr(settings, 'MAX_UPLOAD_SIZE_MB', 5)
        max_bytes = max_mb * 1024 * 1024
        if file_obj.size > max_bytes:
            raise serializers.ValidationError(f"File size exceeds the {max_mb} MB limit.")

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError("Unsupported file extension. Only PDF, DOCX, and TXT are supported.")

        # Read first 2048 bytes for magic-byte signature check
        header = file_obj.read(2048)
        file_obj.seek(0)

        if ext == '.pdf' and not header.startswith(b'%PDF-'):
            raise serializers.ValidationError("Invalid PDF file structure.")
        elif ext == '.docx' and not (header.startswith(b'PK\x03\x04') or b'word/' in header):
            raise serializers.ValidationError("Invalid DOCX file structure.")

        return file_obj

    def validate_workspace_id(self, value):
        if value:
            request = self.context.get('request')
            if not Workspace.objects.filter(id=value, owner=request.user).exists():
                raise serializers.ValidationError("Workspace not found or unauthorized.")
        return value
