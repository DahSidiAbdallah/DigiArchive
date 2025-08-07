"""Custom middleware for JWT authentication in WebSockets."""

from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from channels.auth import AuthMiddlewareStack

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_key):
    try:
        # Validate the token
        UntypedToken(token_key)
        
        # Get the user from the token
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token_key)
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError) as e:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for JWT authentication in WebSockets.
    """
    async def __call__(self, scope, receive, send):
        # Get the token from query string
        query_params = parse_qs(scope["query_string"].decode())
        token = query_params.get("token", [None])[0]
        
        if token:
            # Get the user from the token
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """Helper function to wrap with JWT auth middleware."""
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
