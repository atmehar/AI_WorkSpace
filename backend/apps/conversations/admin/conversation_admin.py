from django.contrib import admin
from apps.conversations.models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ('role', 'content', 'status', 'created_at')
    readonly_fields = ('role', 'content', 'status', 'created_at')
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'workspace', 'created_by', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title', 'created_by__email')
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'status', 'model_name', 'created_at')
    list_filter = ('role', 'status', 'created_at')
    search_fields = ('content', 'conversation__title')
