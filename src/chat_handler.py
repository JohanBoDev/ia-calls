import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent.parent
CHATS_DIR = BASE_DIR / "data" / "chats"


def _chat_path(telefono: str) -> Path:
    CHATS_DIR.mkdir(parents=True, exist_ok=True)
    key = str(telefono).strip().replace("+", "").replace(" ", "")
    return CHATS_DIR / f"{key}.json"


def guardar_chat(cliente: dict, historial: list[dict], resumen: dict = None):
    telefono = str(cliente.get("telefono", ""))
    path = _chat_path(telefono)

    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
    else:
        data = {
            "nombre": cliente.get("nombre", ""),
            "telefono": telefono,
            "ubicacion": cliente.get("ubicacion", ""),
            "llamadas": [],
        }

    mensajes = [m for m in historial if m["role"] != "system"]
    llamada = {
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mensajes": mensajes,
    }
    if resumen:
        llamada["resumen"] = resumen
    data["llamadas"].append(llamada)

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_all_clients() -> list[dict]:
    if not CHATS_DIR.exists():
        return []
    clients = []
    for f in sorted(CHATS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, ValueError):
            continue
        ultima_llamada = data["llamadas"][-1] if data["llamadas"] else None
        ultimo_mensaje = ""
        if ultima_llamada and ultima_llamada["mensajes"]:
            ultimo_mensaje = ultima_llamada["mensajes"][-1].get("content", "")[:60]
        clients.append({
            "nombre": data["nombre"],
            "telefono": data["telefono"],
            "ubicacion": data.get("ubicacion", ""),
            "ultima_llamada": ultima_llamada["fecha"] if ultima_llamada else "",
            "ultimo_mensaje": ultimo_mensaje,
            "total_llamadas": len(data["llamadas"]),
        })
    return clients


def get_client_chat(telefono: str) -> dict | None:
    path = _chat_path(telefono)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))
