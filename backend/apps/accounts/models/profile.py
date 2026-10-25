import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class UserProfile(models.Model):
    """Auxiliary profile entity managing per-user quota and workspace preferences."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    daily_questions_used = models.PositiveIntegerField(default=0)
    quota_reset_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_profile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"Profile of {self.user.email} (Used: {self.daily_questions_used})"
