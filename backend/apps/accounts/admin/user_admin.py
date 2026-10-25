from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.accounts.models import CustomUser, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin configuration for CustomUser model."""

    list_display = ('email', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('email',)
    ordering = ('-date_joined',)
    inlines = (UserProfileInline,)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'confirm_password'),
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'daily_questions_used', 'quota_reset_date', 'updated_at')
    search_fields = ('user__email',)
