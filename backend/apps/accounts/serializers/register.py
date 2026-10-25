from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.accounts.models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration with password confirmation and validation."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'password', 'confirm_password')
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
