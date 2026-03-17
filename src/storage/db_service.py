"""Capa de acceso a datos — todas las operaciones sobre PostgreSQL."""
from datetime import datetime, timezone

from sqlalchemy import func, select

from database import AsyncSessionLocal
from db_models import (
    EstadoTicket, GesiDepartamento, GesiEstadoTicket, GesiMunicipio,
    GesiOrigen, GesiTipoTicket, Llamada, MensajeLlamada, Respuesta, Ticket,
)


# ── tickets ────────────────────────────────────────────────────────────────────

async def get_tickets_by_ids(ticket_ids: list[int]) -> list[Ticket]:
    """Retorna tickets por IDs sin importar su estado — para llamadas manuales."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Ticket).where(Ticket.id.in_(ticket_ids))
        )
        return list(result.scalars().all())


async def get_tickets_pendientes() -> list[Ticket]:
    """Retorna tickets listos para llamar (pendiente o reintento_pendiente)."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Ticket).where(
                Ticket.estado.in_([EstadoTicket.pendiente, EstadoTicket.reintento_pendiente])
            )
        )
        return list(result.scalars().all())


async def actualizar_estado_ticket(ticket_id: int, estado: EstadoTicket, reintento_en: datetime | None = None) -> None:
    async with AsyncSessionLocal() as session:
        ticket = await session.get(Ticket, ticket_id)
        if ticket:
            ticket.estado = estado
            if reintento_en is not None:
                ticket.reintento_en = reintento_en
            await session.commit()


async def eliminar_tickets(ticket_ids: list[int]) -> dict:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Ticket).where(Ticket.id.in_(ticket_ids))
        )
        tickets = result.scalars().all()
        for t in tickets:
            await session.delete(t)
        await session.commit()
    return {"eliminados": len(tickets)}


async def crear_tickets(tickets: list) -> dict:
    """Inserta o actualiza tickets por numero_ticket (upsert)."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy import text as sa_text
    creados = 0
    actualizados = 0
    async with AsyncSessionLocal() as session:
        for t in tickets:
            values: dict = dict(
                numero_ticket=t.numero_ticket,
                telefono=t.telefono,
                sector=t.sector,
                municipio=t.municipio,
                estado=EstadoTicket.pendiente,
            )
            # Campos opcionales presentes solo en importación GESI
            if hasattr(t, "nombre") and t.nombre is not None:
                values["nombre"] = t.nombre
            if hasattr(t, "estado_gesi") and t.estado_gesi is not None:
                values["estado_gesi"] = t.estado_gesi

            set_values = {k: v for k, v in values.items() if k != "numero_ticket"}

            stmt = (
                pg_insert(Ticket)
                .values(**values)
                .on_conflict_do_update(
                    index_elements=["numero_ticket"],
                    set_=set_values,
                )
                .returning(sa_text("(xmax = 0) AS is_insert"))
            )
            result = await session.execute(stmt)
            row = result.fetchone()
            if row and row[0]:
                creados += 1
            else:
                actualizados += 1
        await session.commit()
    return {"creados": creados, "actualizados": actualizados}


# ── llamadas ───────────────────────────────────────────────────────────────────

async def crear_llamada(ticket_id: int, call_sid: str) -> int:
    """Marca el ticket como 'llamando', crea el registro de llamada y retorna su id."""
    async with AsyncSessionLocal() as session:
        ticket = await session.get(Ticket, ticket_id)
        if ticket:
            ticket.estado = EstadoTicket.llamando
            ticket.intentos += 1
        llamada = Llamada(ticket_id=ticket_id, call_sid=call_sid)
        session.add(llamada)
        await session.flush()
        llamada_id = llamada.id
        await session.commit()
        return llamada_id


async def finalizar_llamada(
    *,
    llamada_id: int,
    ticket_id: int,
    resultado: str,
    estado_ticket: EstadoTicket,
    sector: str,
    tipo_afectacion: str,
    historial: list[dict],
    respuestas: list[dict],
) -> None:
    """Cierra la llamada: guarda mensajes, respuestas y actualiza estados."""
    async with AsyncSessionLocal() as session:
        llamada = await session.get(Llamada, llamada_id)
        if llamada:
            llamada.resultado = resultado
            llamada.terminada_en = datetime.now(timezone.utc)

        ticket = await session.get(Ticket, ticket_id)
        if ticket:
            ticket.estado = estado_ticket
            if sector:
                ticket.sector = sector

        for i, msg in enumerate(historial):
            if msg["role"] != "system":
                session.add(MensajeLlamada(
                    llamada_id=llamada_id,
                    role=msg["role"],
                    content=msg["content"],
                    orden=i,
                ))

        for r in respuestas:
            session.add(Respuesta(
                llamada_id=llamada_id,
                pregunta=r["pregunta"],
                respuesta=r["respuesta"],
            ))

        await session.commit()


# ── consultas para routers ─────────────────────────────────────────────────────

async def get_tickets_con_ultima_llamada() -> list[dict]:
    """Para el router /api/clientes — lista todos los tickets con su última llamada."""
    async with AsyncSessionLocal() as session:
        # Subconsulta: última llamada por ticket
        sub = (
            select(Llamada.ticket_id, func.max(Llamada.id).label("ultima_llamada_id"))
            .group_by(Llamada.ticket_id)
            .subquery()
        )
        result = await session.execute(
            select(Ticket, Llamada)
            .outerjoin(sub, Ticket.id == sub.c.ticket_id)
            .outerjoin(Llamada, Llamada.id == sub.c.ultima_llamada_id)
            .order_by(Ticket.creado_en.desc())
        )
        rows = result.all()

    items = []
    for ticket, llamada in rows:
        items.append({
            "ticket_id":      ticket.id,
            "numero_ticket":  ticket.numero_ticket,
            "telefono":       ticket.telefono,
            "sector":         ticket.sector,
            "municipio":      ticket.municipio,
            "nombre":         ticket.nombre,
            "estado_gesi":    ticket.estado_gesi,
            "estado":         ticket.estado.value,
            "intentos":       ticket.intentos,
            "creado_en":      ticket.creado_en.isoformat() if ticket.creado_en else None,
            "ultima_llamada":   llamada.iniciada_en.isoformat() if llamada and llamada.iniciada_en else None,
            "ultimo_resultado": llamada.resultado if llamada else None,
            "reintento_en":     ticket.reintento_en.isoformat() if ticket.reintento_en else None,
        })
    return items


async def get_chat_ticket(numero_ticket: str) -> dict | None:
    """Para el router /api/chat/{numero_ticket} — devuelve todas las llamadas con sus mensajes."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Ticket).where(Ticket.numero_ticket == numero_ticket)
        )
        ticket = result.scalar_one_or_none()
        if not ticket:
            return None

        result_llamadas = await session.execute(
            select(Llamada).where(Llamada.ticket_id == ticket.id).order_by(Llamada.iniciada_en)
        )
        llamadas = result_llamadas.scalars().all()

        llamadas_data = []
        for llamada in llamadas:
            msgs_result = await session.execute(
                select(MensajeLlamada)
                .where(MensajeLlamada.llamada_id == llamada.id)
                .order_by(MensajeLlamada.orden)
            )
            mensajes = [
                {"role": m.role, "content": m.content}
                for m in msgs_result.scalars().all()
            ]
            resp_result = await session.execute(
                select(Respuesta).where(Respuesta.llamada_id == llamada.id)
            )
            respuestas = [
                {"pregunta": r.pregunta, "respuesta": r.respuesta}
                for r in resp_result.scalars().all()
            ]
            llamadas_data.append({
                "llamada_id":   llamada.id,
                "call_sid":     llamada.call_sid,
                "iniciada_en":  llamada.iniciada_en.isoformat() if llamada.iniciada_en else None,
                "terminada_en": llamada.terminada_en.isoformat() if llamada.terminada_en else None,
                "resultado":    llamada.resultado,
                "mensajes":     mensajes,
                "respuestas":   respuestas,
            })

        return {
            "numero_ticket": ticket.numero_ticket,
            "telefono":      ticket.telefono,
            "sector":        ticket.sector,
            "municipio":     ticket.municipio,
            "estado":        ticket.estado.value,
            "llamadas":      llamadas_data,
        }


async def get_stats() -> dict:
    """Para el router /api/stats — agrega datos desde la BD."""
    async with AsyncSessionLocal() as session:
        total_tickets = (await session.execute(select(func.count(Ticket.id)))).scalar_one()
        total_llamadas = (await session.execute(select(func.count(Llamada.id)))).scalar_one()

        completadas = (await session.execute(
            select(func.count(Ticket.id)).where(Ticket.estado == EstadoTicket.completado)
        )).scalar_one()

        no_contesto = (await session.execute(
            select(func.count(Ticket.id)).where(Ticket.estado == EstadoTicket.no_contesto)
        )).scalar_one()

        # Distribución tipo afectación desde respuestas
        resp_result = await session.execute(
            select(Respuesta.respuesta, func.count(Respuesta.id).label("cantidad"))
            .where(Respuesta.pregunta.ilike("%tipo%afectaci%"))
            .group_by(Respuesta.respuesta)
            .order_by(func.count(Respuesta.id).desc())
        )
        distribucion_tipo = [
            {"tipo": row.respuesta, "cantidad": row.cantidad}
            for row in resp_result.all()
        ]

    return {
        "total_tickets":      total_tickets,
        "total_llamadas":     total_llamadas,
        "completadas":        completadas,
        "no_contesto":        no_contesto,
        "pct_completada":     round(completadas / total_llamadas * 100, 1) if total_llamadas else 0,
        "distribucion_tipo":  distribucion_tipo,
    }


# ── GESI catálogos ─────────────────────────────────────────────────────────────

def _catalog_to_dict(row) -> dict:
    return {"id": row.id, "nombre": row.nombre, "activo": row.activo}

def _municipio_to_dict(row) -> dict:
    return {"id": row.id, "nombre": row.nombre, "activo": row.activo}


def _make_catalog_crud(Model, order_col):
    """Genera las 4 operaciones CRUD para un catálogo simple (nombre, activo)."""
    async def _get():
        async with AsyncSessionLocal() as session:
            r = await session.execute(select(Model).order_by(order_col))
            return [_catalog_to_dict(x) for x in r.scalars().all()]

    async def _create(nombre: str):
        async with AsyncSessionLocal() as session:
            row = Model(nombre=nombre, activo=True)
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _catalog_to_dict(row)

    async def _toggle(id: int, activo: bool):
        async with AsyncSessionLocal() as session:
            row = await session.get(Model, id)
            if not row:
                return None
            row.activo = activo
            await session.commit()
            return _catalog_to_dict(row)

    async def _delete(id: int):
        async with AsyncSessionLocal() as session:
            row = await session.get(Model, id)
            if not row:
                return False
            await session.delete(row)
            await session.commit()
            return True

    return _get, _create, _toggle, _delete


get_gesi_departamentos, crear_gesi_departamento, toggle_gesi_departamento, eliminar_gesi_departamento = \
    _make_catalog_crud(GesiDepartamento, GesiDepartamento.nombre)

get_gesi_estados, crear_gesi_estado, toggle_gesi_estado, eliminar_gesi_estado = \
    _make_catalog_crud(GesiEstadoTicket, GesiEstadoTicket.nombre)

get_gesi_origenes, crear_gesi_origen, toggle_gesi_origen, eliminar_gesi_origen = \
    _make_catalog_crud(GesiOrigen, GesiOrigen.nombre)

get_gesi_tipos, crear_gesi_tipo, toggle_gesi_tipo, eliminar_gesi_tipo = \
    _make_catalog_crud(GesiTipoTicket, GesiTipoTicket.nombre)


async def get_gesi_municipios() -> list[dict]:
    async with AsyncSessionLocal() as session:
        r = await session.execute(select(GesiMunicipio).order_by(GesiMunicipio.nombre))
        return [_municipio_to_dict(x) for x in r.scalars().all()]

async def crear_gesi_municipio(nombre: str) -> dict:
    async with AsyncSessionLocal() as session:
        row = GesiMunicipio(nombre=nombre, activo=True)
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return _municipio_to_dict(row)

async def toggle_gesi_municipio(id: int, activo: bool) -> dict | None:
    async with AsyncSessionLocal() as session:
        row = await session.get(GesiMunicipio, id)
        if not row:
            return None
        row.activo = activo
        await session.commit()
        return _municipio_to_dict(row)

async def eliminar_gesi_municipio(id: int) -> bool:
    async with AsyncSessionLocal() as session:
        row = await session.get(GesiMunicipio, id)
        if not row:
            return False
        await session.delete(row)
        await session.commit()
        return True


async def get_filtros_activos() -> dict:
    """Retorna los filtros activos para usar en la llamada a GESI."""
    async with AsyncSessionLocal() as session:
        deps = (await session.execute(
            select(GesiDepartamento).where(GesiDepartamento.activo == True)
        )).scalars().all()
        estados = (await session.execute(
            select(GesiEstadoTicket).where(GesiEstadoTicket.activo == True)
        )).scalars().all()
        origenes = (await session.execute(
            select(GesiOrigen).where(GesiOrigen.activo == True)
        )).scalars().all()
        tipos = (await session.execute(
            select(GesiTipoTicket).where(GesiTipoTicket.activo == True)
        )).scalars().all()
        municipios = (await session.execute(
            select(GesiMunicipio).where(GesiMunicipio.activo == True)
        )).scalars().all()
    return {
        "departamentos": [d.nombre for d in deps],
        "estados":       [e.nombre for e in estados],
        "origenes":      [o.nombre for o in origenes],
        "tipos":         [t.nombre for t in tipos],
        "municipios":    [m.nombre for m in municipios],
    }
