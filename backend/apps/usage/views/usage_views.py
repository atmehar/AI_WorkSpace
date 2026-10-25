from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.usage.services import QuotaService
from apps.usage.models import UsageRecord
from apps.usage.serializers import UsageRecordSerializer


class UsageStatusView(APIView):
    """Retrieves current quota allocation, usage count, remaining queries, and reset time."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_data = QuotaService.get_quota_status(request.user)
        return Response(status_data, status=status.HTTP_200_OK)


class UsageHistoryView(APIView):
    """Retrieves history of AI requests made by the user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = UsageRecord.objects.filter(user=request.user).order_by('-created_at')[:50]
        serializer = UsageRecordSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
