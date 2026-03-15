# ENEL AI Calls

Bot de llamadas automatizadas para gestión de fallas eléctricas. Integra Twilio, Deepgram, Azure TTS y DeepSeek.

---

## Requisitos previos

- Python 3.14 + virtualenv activado
- Node.js 18+
- PostgreSQL corriendo en `localhost:5432`
- ngrok instalado y autenticado
- Variables de entorno en `.env` (raíz del proyecto)

---

## 1 — Base de datos

Solo la primera vez:

```bash
# Crear la BD (desde psql)
psql -U postgres -c "CREATE DATABASE ai_calls;"

# Correr migraciones
venv\Scripts\alembic upgrade head

# Cargar datos de prueba
venv\Scripts\python src/seeds.py
```

---

## 2 — Backend

```bash
venv\Scripts\python src/main.py
```

Corre en → `http://localhost:8000`

---

## 3 — Frontend

```bash
cd client
npm run dev
```

Corre en → `http://localhost:5173`

---

## 4 — ngrok

Abre una terminal aparte:

```bash
ngrok http 8000

# Si ngrok no está en el PATH, usar la ruta completa:
# C:\Users\johan.bohorquez-rami\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe http 8000
```

Copia la URL `https://xxxx.ngrok-free.app` y configúrala en Twilio:

| Campo | Valor |
|---|---|
| Voice webhook | `https://xxxx.ngrok-free.app/twiml` |
| AMD callback | `https://xxxx.ngrok-free.app/amd-status` |
| Status callback | `https://xxxx.ngrok-free.app/call-status` |

Actualiza también `BASE_URL` en el `.env`:

```env
BASE_URL=https://xxxx.ngrok-free.app
```

---

## Orden de arranque

```
1. PostgreSQL     ← debe estar corriendo
2. backend        ← venv\Scripts\python src/main.py
3. ngrok          ← ngrok http 8000
4. frontend       ← cd client && npm run dev
```

---

## Variables de entorno (.env)

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

DEEPGRAM_API_KEY=
DEEPSEEK_API_KEY=

AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

BASE_URL=https://xxxx.ngrok-free.app
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/ai_calls
```
