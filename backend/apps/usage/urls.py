from django.urls import path
from apps.usage.views import UsageStatusView, UsageHistoryView

app_name = 'usage'

urlpatterns = [
    path('', UsageStatusView.as_view(), name='usage_status'),
    path('records/', UsageHistoryView.as_view(), name='usage_records'),
]
