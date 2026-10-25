from apps.workspaces.models import Workspace
from rest_framework.exceptions import PermissionDenied, NotFound


class WorkspaceService:
    """Service encapsulating workspace queries and tenant boundaries."""

    @staticmethod
    def get_user_workspace(user, workspace_id=None):
        """Retrieves and verifies the workspace owned by user. Falls back to default owned workspace."""
        if workspace_id:
            try:
                workspace = Workspace.objects.get(id=workspace_id)
                if workspace.owner != user:
                    raise PermissionDenied("You do not have access to this workspace.")
                return workspace
            except Workspace.DoesNotExist:
                raise NotFound("Workspace not found.")

        # Default fallback: first workspace owned by user
        workspace = Workspace.objects.filter(owner=user).first()
        if not workspace:
            workspace = Workspace.objects.create(owner=user, name="My Workspace")
        return workspace
