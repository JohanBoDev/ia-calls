import json
from openai import OpenAI
from config import settings

_client = OpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
)


def chat(messages: list[dict]) -> str:
    response = _client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        max_tokens=200,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def generar_resumen(historial: list[dict]) -> dict:
    mensajes = [m for m in historial if m["role"] != "system"]
    conversacion = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in mensajes)

    respuesta = _client.chat.completions.create(
        model="deepseek-chat",
        messages=[{
            "role": "user",
            "content": (
                "Basándote en esta conversación de una llamada de ENEL Colombia, "
                "extrae la siguiente información en formato JSON estricto:\n\n"
                f"{conversacion}\n\n"
                "Devuelve SOLO el JSON sin explicaciones:\n"
                '{"tiene_servicio": "si/no/no_verificado", '
                '"sector": "sector o vereda mencionado o null", '
                '"tipo_afectacion": "falla_total/luz_bajita/microcortes/null", '
                '"resultado": "ticket_cerrado/tecnico_asignado/numero_equivocado/no_en_casa/no_contesto"}'
            ),
        }],
        max_tokens=150,
        temperature=0,
    )

    try:
        texto = respuesta.choices[0].message.content.strip()
        texto = texto.replace("```json", "").replace("```", "").strip()
        return json.loads(texto)
    except Exception:
        return {
            "tiene_servicio": "no_verificado",
            "sector": None,
            "tipo_afectacion": None,
            "resultado": "no_verificado",
        }
