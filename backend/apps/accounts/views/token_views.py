from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken


class LoginView(TokenObtainPairView):
    """Custom TokenObtainPairView for email/password authentication."""
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """Handles logout by blacklisting or invalidating the provided refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": {"code": "INVALID_REQUEST", "message": "Refresh token is required."}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            # If token blacklisting is active in settings: token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"error": {"code": "INVALID_TOKEN", "message": "Token is invalid or expired."}},
                status=status.HTTP_400_BAD_REQUEST
            )
