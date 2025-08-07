"""WebSocket consumers for notifications."""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""
    
    async def connect(self):
        """Connect to the WebSocket."""
        self.user = None
        
        # Get token from query parameters
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = dict(x.split('=') for x in query_string.split('&') if '=' in x)
        
        token_key = query_params.get('token')
        if not token_key:
            await self.close()
            return
        
        # Authenticate using JWT token
        try:
            self.user = await self.get_user_from_token(token_key)
        except (TokenError, InvalidToken):
            await self.close()
            return
        
        if not self.user:
            await self.close()
            return
        
        # Join user-specific notification group
        self.notification_group_name = f"notifications_{self.user.id}"
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnect."""
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'notification_read':
                # Handle mark as read
                notification_id = data.get('data', {}).get('id')
                if notification_id:
                    await self.mark_notification_as_read(notification_id)
                    
            elif message_type == 'notification_read_all':
                # Handle mark all as read
                await self.mark_all_notifications_as_read()
        
        except json.JSONDecodeError:
            pass
    
    async def notification_new(self, event):
        """Send new notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification_new',
            'data': event['notification']
        }))
    
    async def notification_read(self, event):
        """Send notification read status update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification_read',
            'data': {'id': event['notification_id']}
        }))
    
    async def notification_read_all(self, event):
        """Send all notifications read status update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification_read_all',
            'data': None
        }))
    
    async def document_processed(self, event):
        """Send document processed notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'document_processed',
            'data': {'document_id': event['document_id']}
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token_key):
        """Get user from token."""
        try:
            token = AccessToken(token_key)
            user_id = token.get('user_id')
            return User.objects.get(id=user_id)
        except (TokenError, InvalidToken, User.DoesNotExist):
            return None
    
    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark a notification as read."""
        from apps.notifications.models import Notification
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.is_read = True
            notification.save()
            
            # Broadcast to this user's group that the notification has been read
            # This allows multiple browser tabs to stay in sync
            return notification_id
        except Notification.DoesNotExist:
            return None
    
    @database_sync_to_async
    def mark_all_notifications_as_read(self):
        """Mark all notifications as read for the user."""
        from apps.notifications.models import Notification
        Notification.objects.filter(user=self.user, is_read=False).update(is_read=True)
        return True
