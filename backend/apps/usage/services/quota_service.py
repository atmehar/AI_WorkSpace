from datetime import datetime, time, timezone as dt_timezone
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import UserProfile
from apps.usage.models import UsageRecord


class QuotaService:
    """Manages atomic, concurrency-safe quota reservation, tracking, and compensation."""

    @staticmethod
    def get_daily_limit() -> int:
        return getattr(settings, 'DAILY_QUESTION_LIMIT', 20)

    @classmethod
    def get_quota_status(cls, user) -> dict:
        """Retrieves user quota status, refreshing counter if past midnight UTC."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        today = timezone.localdate()
        reset_date = profile.quota_reset_date.date() if isinstance(profile.quota_reset_date, datetime) else profile.quota_reset_date

        if reset_date is None or reset_date < today:
            profile.daily_questions_used = 0
            profile.quota_reset_date = today
            profile.save(update_fields=['daily_questions_used', 'quota_reset_date'])

        limit = cls.get_daily_limit()
        used = profile.daily_questions_used
        remaining = max(0, limit - used)

        # Compute next midnight UTC reset time
        reset_time = datetime.combine(today + timezone.timedelta(days=1), time.min, tzinfo=dt_timezone.utc)

        return {
            "limit": limit,
            "used": used,
            "remaining": remaining,
            "reset_time": reset_time.isoformat()
        }

    @classmethod
    def reserve_question_quota(cls, user) -> dict:
        """
        Atomically inspects and increments user question quota within a database transaction
        using row-level locking (select_for_update) to guarantee zero concurrency race leaks.
        """
        with transaction.atomic():
            profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
            today = timezone.localdate()
            reset_date = profile.quota_reset_date.date() if isinstance(profile.quota_reset_date, datetime) else profile.quota_reset_date

            # Handle daily midnight reset
            if reset_date is None or reset_date < today:
                profile.daily_questions_used = 0
                profile.quota_reset_date = today

            limit = cls.get_daily_limit()
            if profile.daily_questions_used >= limit:
                raise PermissionDenied(f"You have reached your daily quota limit of {limit} questions.")

            profile.daily_questions_used += 1
            profile.save(update_fields=['daily_questions_used', 'quota_reset_date'])

            remaining = max(0, limit - profile.daily_questions_used)
            now = timezone.now()
            reset_time = datetime.combine(today + timezone.timedelta(days=1), time.min, tzinfo=dt_timezone.utc)

            return {
                "limit": limit,
                "used": profile.daily_questions_used,
                "remaining": remaining,
                "reset_time": reset_time.isoformat()
            }

    @classmethod
    def refund_question_quota(cls, user) -> None:
        """Refunds quota reservation if external AI call failed."""
        with transaction.atomic():
            try:
                profile = UserProfile.objects.select_for_update().get(user=user)
                if profile.daily_questions_used > 0:
                    profile.daily_questions_used -= 1
                    profile.save(update_fields=['daily_questions_used'])
            except UserProfile.DoesNotExist:
                pass

    @classmethod
    def log_usage_record(cls, user, message=None, usage_type='AI_QUESTION', quantity=1, status='SUCCESS') -> UsageRecord:
        """Creates an audit record logging the AI operation."""
        return UsageRecord.objects.create(
            user=user,
            message=message,
            usage_type=usage_type,
            quantity=quantity,
            status=status
        )
