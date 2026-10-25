from rest_framework.permissions import BasePermission


class IsWorkspaceOwner(BasePermission):
    """Verifies that the requesting user is the owner of the workspace."""

    def has_object_permission(self, request, view, obj):
        # obj can be a Workspace or a model related to Workspace
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'workspace'):
            return obj.workspace.owner == request.user
        return False
