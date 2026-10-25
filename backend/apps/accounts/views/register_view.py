from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.serializers import RegisterSerializer, UserSerializer
from apps.accounts.services import AuthService


class RegisterView(APIView):
    """Handles new user registration, workspace creation, and returns JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            AuthService.provision_user(user)

            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                "user": user_data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
