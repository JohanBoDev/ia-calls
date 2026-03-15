import logging
import sys
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

_fmt = logging.Formatter(
    fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_file_handler = logging.FileHandler(LOG_DIR / "app.log", encoding="utf-8")
_file_handler.setFormatter(_fmt)

_console_handler = logging.StreamHandler(sys.stdout)
_console_handler.setFormatter(_fmt)


def get_logger(name: str) -> logging.Logger:
    from services.log_broadcaster import broadcast_handler  # import tardío para evitar circular
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        logger.addHandler(_file_handler)
        logger.addHandler(_console_handler)
        logger.addHandler(broadcast_handler)
        logger.propagate = False
    return logger
