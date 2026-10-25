from rest_framework.permissions import BasePermission


class IsActiveUser(BasePermission):
    """Allows access only to authenticated and active users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)
