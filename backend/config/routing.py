"""
Root websocket routing configuration for DigiArchive.
"""

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

import apps.notifications.routing

application = ProtocolTypeRouter({
    # Django's ASGI application for http requests
    # Empty path is handled by Django's default handler
    
    # WebSocket handler
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                apps.notifications.routing.websocket_urlpatterns
            )
        )
    ),
})
