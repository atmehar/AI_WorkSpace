from django.contrib import admin
from apps.usage.models import UsageRecord


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'usage_type', 'quantity', 'status', 'created_at')
    list_filter = ('usage_type', 'status', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('id', 'user', 'message', 'usage_type', 'quantity', 'status', 'created_at')
