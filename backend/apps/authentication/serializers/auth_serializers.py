"""Authentication serializers."""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'department', 'position']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer with password validation."""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'department', 'position']
        extra_kwargs = {
            'username': {'error_messages': {'unique': 'A user with that username already exists.'}},
            'email': {'error_messages': {'unique': 'A user with that email already exists.'}}
        }

    def validate(self, attrs):
        """Validate that passwords match and perform other validations."""
        # Check if passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
            
        # Check if username already exists (additional explicit check)
        username = attrs.get('username')
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})
            
        # Check if email already exists (additional explicit check)
        email = attrs.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
            
        return attrs

    def create(self, validated_data):
        """Create a new user with encrypted password."""
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user
