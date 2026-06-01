from .sub.deep import deep_helper
from .utils import PREFIX


def greet(name: str) -> str:
    return PREFIX + name + deep_helper()


def _internal():
    pass


VERSION = "0.1.0"
