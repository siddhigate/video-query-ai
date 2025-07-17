from backend.config.config import config
import redis
from typing import Any, List

class RedisManagerBase:
    def __init__(self, redis_url: str = None):
        self._redis_url = redis_url or config.redis.url

    def get(self, key: str) -> Any:
        r = redis.Redis.from_url(self._redis_url)
        value = r.get(key)
        r.close()
        return value

    def set(self, key: str, value: Any):
        r = redis.Redis.from_url(self._redis_url)
        r.set(key, value)
        r.close()

    def sadd(self, key: str, value: Any):
        r = redis.Redis.from_url(self._redis_url)
        r.sadd(key, value)
        r.close()

    def srem(self, key: str, value: Any):
        r = redis.Redis.from_url(self._redis_url)
        r.srem(key, value)
        r.close()

    def smembers(self, key: str) -> List[Any]:
        r = redis.Redis.from_url(self._redis_url)
        members = list(r.smembers(key))
        r.close()
        return members 