"""Cliente HTTP para el portal GESI de ENEL Colombia."""
import re

import requests
from requests_ntlm import HttpNtlmAuth

from config import settings
from logger import get_logger

log = get_logger("gesi_client")

# Regex para números colombianos: móviles (3xxxxxxxxx) y fijos (6xxxxxxxxx)
PHONE_RE = re.compile(r'\b(?:3\d{9}|6\d{2}\d{7})\b')


def _build_session() -> requests.Session:
    session = requests.Session()
    session.auth = HttpNtlmAuth(settings.GESI_USER, settings.GESI_PASSWORD)
    session.headers.update({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "TokenSecurity": settings.GESI_TOKEN_SECURITY,
        "Cookie": f"{settings.GESI_COOKIE}; dtpc={settings.GESI_DTPC}",
    })
    return session


def _build_payload(
    departamentos: list[str],
    estados: list[str],
    origenes: list[str],
    tipos: list[str],
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
) -> dict:
    payload: dict = {}
    if departamentos:
        payload["departamentos"] = departamentos
    if estados:
        payload["estados"] = estados
    if origenes:
        payload["origenes"] = origenes
    if tipos:
        payload["tipos"] = tipos
    if fecha_desde:
        payload["fechaDesde"] = fecha_desde
    if fecha_hasta:
        payload["fechaHasta"] = fecha_hasta
    return payload


def _get_notification_data(session: requests.Session, ticket_id: str) -> tuple[str, str]:
    """Retorna (telefono, nombre) desde el endpoint de notificaciones."""
    url = f"{settings.GESI_URL}/notification/findByIncident/{ticket_id}"
    try:
        resp = session.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data if isinstance(data, list) else [data]
        phone = ""
        nombre = ""
        for item in items:
            if not phone:
                for field in ("phoneNumber", "phone", "value", "telefono"):
                    val = str(item.get(field) or "")
                    m = PHONE_RE.search(val)
                    if m:
                        phone = m.group()
                        break
            if not nombre:
                nombre = str(item.get("name") or item.get("nombre") or "")
        return phone, nombre
    except Exception as e:
        log.warning("Error en notificación ticket %s: %s", ticket_id, e)
        return "", ""


def get_tickets(
    departamentos: list[str],
    estados: list[str],
    origenes: list[str],
    tipos: list[str],
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
) -> list[dict]:
    """Obtiene tickets de GESI y los enriquece con teléfono y nombre."""
    session = _build_session()
    url = f"{settings.GESI_URL}/incident/list"
    payload = _build_payload(departamentos, estados, origenes, tipos, fecha_desde, fecha_hasta)

    resp = session.put(url, json=payload, timeout=30)
    resp.raise_for_status()
    raw = resp.json()

    items = raw if isinstance(raw, list) else raw.get("items", raw.get("data", []))
    log.info("GESI: %d tickets recibidos", len(items))

    result = []
    for item in items:
        ticket_id = str(item.get("id") or item.get("ticketId") or "")
        numero    = str(item.get("ticketNumber") or item.get("numero") or ticket_id)
        sector    = str(item.get("localAddress") or item.get("sector") or "")
        municipio = str(item.get("municipality") or item.get("municipio") or "")
        estado_gesi = ""
        status = item.get("status") or {}
        if isinstance(status, dict):
            estado_gesi = str(status.get("shortDescription") or "")
        elif isinstance(status, str):
            estado_gesi = status

        phone, nombre = _get_notification_data(session, ticket_id)

        result.append({
            "numero_ticket": numero,
            "telefono":      phone,
            "sector":        sector,
            "municipio":     municipio,
            "nombre":        nombre,
            "estado_gesi":   estado_gesi,
        })
    return result
