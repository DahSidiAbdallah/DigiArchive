"""Utility functions for sending WebSocket notifications."""

import json
import asyncio
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.serializers.json import DjangoJSONEncoder


def send_notification_to_user(user_id, notification_data):
    """
    Send notification to a specific user via WebSocket.
    
    Args:
        user_id (int): The ID of the user to send the notification to.
        notification_data (dict): The notification data to send.
    """
    channel_layer = get_channel_layer()
    notification_group_name = f"user_{user_id}_notifications"
    
    # Convert any non-JSON serializable objects
    notification_json = json.loads(json.dumps(notification_data, cls=DjangoJSONEncoder))
    
    async_to_sync(channel_layer.group_send)(
        notification_group_name,
        {
            "type": "notification_message",
            "content": notification_json
        }
    )
