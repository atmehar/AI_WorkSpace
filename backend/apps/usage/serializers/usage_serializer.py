from rest_framework import serializers
from apps.usage.models import UsageRecord


class UsageStatusSerializer(serializers.Serializer):
    limit = serializers.IntegerField()
    used = serializers.IntegerField()
    remaining = serializers.IntegerField()
    reset_time = serializers.CharField()


class UsageRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageRecord
        fields = ('id', 'usage_type', 'quantity', 'status', 'created_at')
        read_only_fields = fields
