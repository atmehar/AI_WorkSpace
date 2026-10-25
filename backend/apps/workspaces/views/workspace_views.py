from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.workspaces.models import Workspace
from apps.workspaces.serializers import WorkspaceSerializer
from apps.workspaces.permissions import IsWorkspaceOwner


class WorkspaceViewSet(viewsets.ModelViewSet):
    """CRUD operations for user workspaces with strict owner filtering."""

    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceOwner]

    def get_queryset(self):
        return Workspace.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
