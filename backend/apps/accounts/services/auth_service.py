from apps.accounts.models import UserProfile
from apps.workspaces.models import Workspace


class AuthService:
    """Service handling account provisioning and post-registration lifecycle."""

    @staticmethod
    def provision_user(user):
        """Creates associated UserProfile and a default Workspace for the newly registered user."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        workspace, _ = Workspace.objects.get_or_create(
            owner=user,
            defaults={'name': 'My Workspace'}
        )
        return profile, workspace
