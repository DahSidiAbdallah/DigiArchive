"""Admin configuration for authentication app."""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'department', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'department')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('department', 'position')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('department', 'position')}),
    )
