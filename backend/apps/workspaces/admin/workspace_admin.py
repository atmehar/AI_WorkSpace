from django.contrib import admin
from apps.workspaces.models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'created_at', 'updated_at')
    search_fields = ('name', 'owner__email')
    list_filter = ('created_at',)
