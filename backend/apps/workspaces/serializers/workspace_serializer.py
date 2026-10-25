from rest_framework import serializers
from apps.workspaces.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for Workspace listing and details."""

    documents_count = serializers.SerializerMethodField()
    owner_email = serializers.ReadOnlyField(source='owner.email')

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'owner_email', 'documents_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'owner_email', 'documents_count')

    def get_documents_count(self, obj):
        return obj.documents.count()
