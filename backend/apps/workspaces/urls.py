from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.workspaces.views import WorkspaceViewSet

app_name = 'workspaces'

router = DefaultRouter()
router.register(r'', WorkspaceViewSet, basename='workspace')

urlpatterns = [
    path('', include(router.urls)),
]
