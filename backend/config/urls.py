"""
URL configuration for AI Document Intelligence Workspace.
All REST API endpoints are mounted under /api/v1/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Version 1 Routes
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/workspaces/', include('apps.workspaces.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/conversations/', include('apps.conversations.urls')),
    path('api/v1/usage/', include('apps.usage.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
