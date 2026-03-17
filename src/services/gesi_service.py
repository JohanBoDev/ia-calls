"""Servicio de carga de tickets desde GESI."""
import re
from dataclasses import dataclass

from logger import get_logger
from storage.db_service import crear_tickets, get_filtros_activos

log = get_logger("gesi_service")

_MUN_PREFIX = re.compile(r'^[A-Z]{1,3}\.\s*', re.IGNORECASE)


def _normalizar_telefono(raw: str) -> str:
    digits = re.sub(r'\D', '', raw)
    if len(digits) == 10 and digits.startswith(('3', '6')):
        return f"+57{digits}"
    if len(digits) == 12 and digits.startswith('57'):
        return f"+{digits}"
    return raw


def _limpiar_municipio(raw: str) -> str:
    # "C V.NOCAIMA/M.NOCAIMA" → tomar última parte, quitar prefijo
    parte = raw.split('/')[-1].strip()
    parte = _MUN_PREFIX.sub('', parte).strip()
    return parte.title()


@dataclass
class _GesiTicketInput:
    numero_ticket: str
    telefono: str
    sector: str
    municipio: str
    nombre: str | None
    estado_gesi: str | None


async def cargar_tickets_gesi(
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
) -> dict:
    import asyncio

    filtros = await get_filtros_activos()

    def _fetch():
        from gesi_client import get_tickets
        return get_tickets(
            departamentos=filtros["departamentos"],
            estados=filtros["estados"],
            origenes=filtros["origenes"],
            tipos=filtros["tipos"],
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
        )

    loop = asyncio.get_event_loop()
    raw_tickets = await loop.run_in_executor(None, _fetch)
    log.info("GESI: %d tickets a procesar", len(raw_tickets))

    inputs = []
    for t in raw_tickets:
        telefono = _normalizar_telefono(t.get("telefono") or "")
        municipio = _limpiar_municipio(t.get("municipio") or "")
        nombre = (t.get("nombre") or "").strip() or None
        estado_gesi = (t.get("estado_gesi") or "").strip() or None
        inputs.append(_GesiTicketInput(
            numero_ticket=t["numero_ticket"],
            telefono=telefono,
            sector=t.get("sector") or "",
            municipio=municipio,
            nombre=nombre,
            estado_gesi=estado_gesi,
        ))

    result = await crear_tickets(inputs)
    return {"total_gesi": len(inputs), **result}
