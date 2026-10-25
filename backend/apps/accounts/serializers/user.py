from rest_framework import serializers
from apps.accounts.models import CustomUser, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('id', 'daily_questions_used', 'quota_reset_date')


class UserSerializer(serializers.ModelSerializer):
    """Detailed user serializer for profile endpoint."""

    profile = UserProfileSerializer(read_only=True)
    default_workspace_id = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'is_active', 'date_joined', 'profile', 'default_workspace_id')
        read_only_fields = ('id', 'email', 'is_active', 'date_joined', 'profile', 'default_workspace_id')

    def get_default_workspace_id(self, obj):
        workspace = obj.owned_workspaces.first()
        return str(workspace.id) if workspace else None
