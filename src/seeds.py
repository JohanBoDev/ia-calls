"""
Seeds de prueba — simula tickets importados desde GESI (Enel Colombia).
Ejecutar: python src/seeds.py
"""
import asyncio
from sqlalchemy import select

from database import AsyncSessionLocal
from db_models import EstadoTicket, Llamada, MensajeLlamada, Respuesta, Ticket


TICKETS_GESI = [
    {"numero_ticket": "GESI-2026-00101", "telefono": "+573001234567", "sector": "Barrio El Centro",        "municipio": "Medellín"},
    {"numero_ticket": "GESI-2026-00102", "telefono": "+573112345678", "sector": "Vereda La Esperanza",     "municipio": "Bello"},
    {"numero_ticket": "GESI-2026-00103", "telefono": "+573209876543", "sector": "Barrio San Javier",       "municipio": "Medellín"},
    {"numero_ticket": "GESI-2026-00104", "telefono": "+573154321098", "sector": "Urbanización Los Pinos",  "municipio": "Itagüí"},
    {"numero_ticket": "GESI-2026-00105", "telefono": "+573006543210", "sector": "Barrio La Floresta",      "municipio": "Envigado"},
    {"numero_ticket": "GESI-2026-00106", "telefono": "+573187654321", "sector": "Vereda El Raizal",        "municipio": "Sabaneta"},
    {"numero_ticket": "GESI-2026-00107", "telefono": "+573301234987", "sector": "Barrio Manrique",         "municipio": "Medellín"},
    {"numero_ticket": "GESI-2026-00108", "telefono": "+573045678901", "sector": "Sector Industrial Norte", "municipio": "Bello"},
    {"numero_ticket": "GESI-2026-00109", "telefono": "+573218765432", "sector": "Barrio El Poblado",       "municipio": "Medellín"},
    {"numero_ticket": "GESI-2026-00110", "telefono": "+573129876541", "sector": "Vereda Granizal",         "municipio": "Copacabana"},
]

# Ticket de ejemplo con llamada completa y chat para probar el frontend
TICKET_CON_LLAMADA = "GESI-2026-00101"

HISTORIAL_EJEMPLO = [
    {"role": "assistant", "content": "¿Cuenta con servicio de energía en este momento? Marque uno para Sí o dos para No."},
    {"role": "user",      "content": "2"},
    {"role": "assistant", "content": "¿Cuál es el sector de la falla? Díganos el barrio o vereda, hablando con calma."},
    {"role": "user",      "content": "Barrio El Centro, cerca al parque principal."},
    {"role": "assistant", "content": "¿Qué tipo de afectación presenta? Marque uno para falla total, dos para luz bajita, o tres para microcortes."},
    {"role": "user",      "content": "1"},
    {"role": "assistant", "content": "Perfecto, gracias por su colaboración. Hoy un técnico de ENEL Colombia se comunicará con usted. Que tenga buen día."},
]

RESPUESTAS_EJEMPLO = [
    {"pregunta": "¿Cuenta con servicio de energía?",  "respuesta": "No"},
    {"pregunta": "¿Cuál es el sector de la falla?",   "respuesta": "Barrio El Centro, cerca al parque principal."},
    {"pregunta": "¿Qué tipo de afectación presenta?", "respuesta": "Falla total"},
]


async def run():
    async with AsyncSessionLocal() as session:
        insertados = 0
        omitidos = 0

        for t in TICKETS_GESI:
            result = await session.execute(
                select(Ticket).where(Ticket.numero_ticket == t["numero_ticket"])
            )
            existente = result.scalar_one_or_none()

            if existente:
                omitidos += 1
                continue

            estado = EstadoTicket.completado if t["numero_ticket"] == TICKET_CON_LLAMADA else EstadoTicket.pendiente
            ticket = Ticket(
                numero_ticket=t["numero_ticket"],
                telefono=t["telefono"],
                sector=t["sector"],
                municipio=t["municipio"],
                estado=estado,
                intentos=1 if t["numero_ticket"] == TICKET_CON_LLAMADA else 0,
            )
            session.add(ticket)
            await session.flush()  # obtiene ticket.id

            if t["numero_ticket"] == TICKET_CON_LLAMADA:
                llamada = Llamada(
                    ticket_id=ticket.id,
                    call_sid="CA_seed_ejemplo_00101",
                    resultado="completado",
                )
                session.add(llamada)
                await session.flush()  # obtiene llamada.id

                for i, msg in enumerate(HISTORIAL_EJEMPLO):
                    session.add(MensajeLlamada(
                        llamada_id=llamada.id,
                        role=msg["role"],
                        content=msg["content"],
                        orden=i,
                    ))

                for r in RESPUESTAS_EJEMPLO:
                    session.add(Respuesta(
                        llamada_id=llamada.id,
                        pregunta=r["pregunta"],
                        respuesta=r["respuesta"],
                    ))

            insertados += 1

        await session.commit()
        print(f"Seeds completados: {insertados} insertados, {omitidos} omitidos (ya existían).")


if __name__ == "__main__":
    asyncio.run(run())
