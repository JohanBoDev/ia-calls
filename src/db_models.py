import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger, DateTime, Enum, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class EstadoTicket(str, enum.Enum):
    pendiente          = "pendiente"           # importado de GESI, no se ha llamado
    llamando           = "llamando"            # llamada activa en este momento
    no_contesto        = "no_contesto"         # llamó pero no hubo respuesta / buzón
    reintento_pendiente = "reintento_pendiente" # no contestó, en cola para 2do intento
    completado         = "completado"          # flujo terminado con respuestas
    fallido            = "fallido"             # error técnico en la llamada


class Ticket(Base):
    __tablename__ = "tickets"

    id:              Mapped[int]          = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero_ticket:   Mapped[str]          = mapped_column(String(100), unique=True, nullable=False, index=True)
    telefono:        Mapped[str]          = mapped_column(String(20), nullable=False)
    sector:          Mapped[str]          = mapped_column(String(200), nullable=False)
    municipio:       Mapped[str]          = mapped_column(String(200), nullable=False)
    estado:          Mapped[EstadoTicket] = mapped_column(
        Enum(EstadoTicket, name="estado_ticket"),
        default=EstadoTicket.pendiente,
        nullable=False,
        index=True,
    )
    intentos:        Mapped[int]          = mapped_column(Integer, default=0, nullable=False)
    creado_en:       Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en:  Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    llamadas: Mapped[list["Llamada"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")


class Llamada(Base):
    __tablename__ = "llamadas"

    id:           Mapped[int]       = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id:    Mapped[int]       = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    call_sid:     Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    iniciada_en:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())
    terminada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resultado:    Mapped[str | None] = mapped_column(String(50), nullable=True)  # completado | no_contesto | fallido

    ticket:    Mapped["Ticket"]               = relationship(back_populates="llamadas")
    respuestas: Mapped[list["Respuesta"]]     = relationship(back_populates="llamada", cascade="all, delete-orphan")
    mensajes:   Mapped[list["MensajeLlamada"]] = relationship(back_populates="llamada", cascade="all, delete-orphan", order_by="MensajeLlamada.orden")


class Respuesta(Base):
    __tablename__ = "respuestas"

    id:             Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    llamada_id:     Mapped[int]      = mapped_column(ForeignKey("llamadas.id", ondelete="CASCADE"), nullable=False, index=True)
    pregunta:       Mapped[str]      = mapped_column(Text, nullable=False)
    respuesta:      Mapped[str]      = mapped_column(Text, nullable=False)
    registrado_en:  Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    llamada: Mapped["Llamada"] = relationship(back_populates="respuestas")


class MensajeLlamada(Base):
    """Historial completo de la conversación durante la llamada (roles: user / assistant / system)."""
    __tablename__ = "mensajes_llamada"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    llamada_id:    Mapped[int]      = mapped_column(ForeignKey("llamadas.id", ondelete="CASCADE"), nullable=False, index=True)
    role:          Mapped[str]      = mapped_column(String(20), nullable=False)   # user | assistant | system
    content:       Mapped[str]      = mapped_column(Text, nullable=False)
    orden:         Mapped[int]      = mapped_column(Integer, nullable=False)       # posición en la conversación
    registrado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    llamada: Mapped["Llamada"] = relationship(back_populates="mensajes")
