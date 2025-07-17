import asyncio
import json
from typing import Dict, Any, Optional, Callable
from fastapi import WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

class WebSocketManagerBase:
    """
    Base class for managing websocket connections and Redis PubSub for streaming use cases.
    """
    def __init__(self, redis_url: str):
        self._active_connections: Dict[str, WebSocket] = {}
        self._redis_url = redis_url
        self._pubsubs: Dict[str, aioredis.client.PubSub] = {}

    async def connect(self, key: str, websocket: WebSocket):
        await websocket.accept()
        old_ws = self._active_connections.get(key)
        if old_ws is not None:
            try:
                # await old_ws.close()
                pass
            except Exception as e:
                print(f"[WebSocketManagerBase] Error closing old WebSocket for key {key}: {e}")
        self._active_connections[key] = websocket

    def disconnect(self, key: str):
        if key in self._active_connections:
            del self._active_connections[key]
        if key in self._pubsubs:
            del self._pubsubs[key]

    async def send_json(self, key: str, data: Any):
        ws = self._active_connections.get(key)
        if ws:
            await ws.send_text(json.dumps(data))

    async def broadcast_json(self, data: Any):
        for ws in self._active_connections.values():
            await ws.send_text(json.dumps(data))

    async def subscribe(self, channel: str) -> aioredis.client.PubSub:
        redis = aioredis.from_url(self._redis_url)
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel)
        self._pubsubs[channel] = pubsub
        return pubsub

    async def unsubscribe(self, channel: str):
        pubsub = self._pubsubs.get(channel)
        if pubsub:
            # await pubsub.unsubscribe(channel)
            # await pubsub.close()
            del self._pubsubs[channel]

    async def publish(self, channel: str, message: str):
        redis = aioredis.from_url(self._redis_url)
        await redis.publish(channel, message)
        # await redis.close()

    async def handle_websocket_with_pubsub(
        self,
        key: str,
        websocket: WebSocket,
        channel: str,
        on_message: Optional[Callable[[str], Any]] = None,
        on_receive: Optional[Callable[[str], Any]] = None,
        poll_interval: float = 0.1,
    ):
        await self.connect(key, websocket)
        pubsub = await self.subscribe(channel)
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=10.0)
                if message and message["type"] == "message":
                    if on_message:
                        await on_message(message["data"].decode())
                    else:
                        await websocket.send_text(message["data"].decode())
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=poll_interval)
                    if on_receive:
                        await on_receive(data)
                except asyncio.TimeoutError:
                    pass
                await asyncio.sleep(poll_interval)
        except WebSocketDisconnect:
            self.disconnect(key)
        finally:
            await self.unsubscribe(channel) 