from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.gesi_service import cargar_tickets_gesi
from storage.db_service import (
    get_gesi_departamentos, crear_gesi_departamento,
    toggle_gesi_departamento, eliminar_gesi_departamento,
    get_gesi_estados, crear_gesi_estado,
    toggle_gesi_estado, eliminar_gesi_estado,
    get_gesi_origenes, crear_gesi_origen,
    toggle_gesi_origen, eliminar_gesi_origen,
    get_gesi_tipos, crear_gesi_tipo,
    toggle_gesi_tipo, eliminar_gesi_tipo,
    get_gesi_municipios, crear_gesi_municipio,
    toggle_gesi_municipio, eliminar_gesi_municipio,
)

router = APIRouter(prefix="/api/gesi", tags=["gesi"])


class CargarParams(BaseModel):
    fecha_desde: str | None = None
    fecha_hasta: str | None = None


class ToggleBody(BaseModel):
    activo: bool


class NombreBody(BaseModel):
    nombre: str


# ── Cargar desde GESI ──────────────────────────────────────────────────────────

@router.post("/cargar")
async def cargar(params: CargarParams = CargarParams()):
    try:
        return await cargar_tickets_gesi(
            fecha_desde=params.fecha_desde,
            fecha_hasta=params.fecha_hasta,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Helper para generar rutas de catálogo ──────────────────────────────────────

def _catalog_routes(prefix: str, get_fn, create_fn, toggle_fn, delete_fn):
    @router.get(f"/{prefix}")
    async def _list():
        return await get_fn()

    @router.post(f"/{prefix}")
    async def _create(body: NombreBody):
        return await create_fn(body.nombre.strip())

    @router.patch(f"/{prefix}/{{id}}")
    async def _toggle(id: int, body: ToggleBody):
        row = await toggle_fn(id, body.activo)
        if not row:
            raise HTTPException(status_code=404)
        return row

    @router.delete(f"/{prefix}/{{id}}")
    async def _delete(id: int):
        ok = await delete_fn(id)
        if not ok:
            raise HTTPException(status_code=404)
        return {"ok": True}


_catalog_routes("departamentos",
    get_gesi_departamentos, crear_gesi_departamento,
    toggle_gesi_departamento, eliminar_gesi_departamento)

_catalog_routes("estados",
    get_gesi_estados, crear_gesi_estado,
    toggle_gesi_estado, eliminar_gesi_estado)

_catalog_routes("origenes",
    get_gesi_origenes, crear_gesi_origen,
    toggle_gesi_origen, eliminar_gesi_origen)

_catalog_routes("tipos",
    get_gesi_tipos, crear_gesi_tipo,
    toggle_gesi_tipo, eliminar_gesi_tipo)

_catalog_routes("municipios",
    get_gesi_municipios, crear_gesi_municipio,
    toggle_gesi_municipio, eliminar_gesi_municipio)
