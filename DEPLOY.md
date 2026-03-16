# Despliegue en AWS — ENEL AI Calls

Guía del proceso completo para desplegar el proyecto en AWS Free Tier.

---

## Infraestructura creada

| Componente | Detalle |
|------------|---------|
| EC2 | t3.micro — Amazon Linux 2023 — IP elástica: `3.136.192.46` |
| RDS | PostgreSQL t3.micro — `ai-calls-db.cnkaq4yywv1b.us-east-2.rds.amazonaws.com` |
| Dominio | `enel-calls.lat` (Namecheap, $2/año) |
| SSL | Let's Encrypt (auto-renovación) |
| Proxy | Nginx |

---

## 1 — EC2

### Crear instancia
- AMI: Amazon Linux 2023
- Tipo: t3.micro
- Key pair: `ec2-ia-calls.pem` (guardar en un lugar seguro)
- Security group — puertos abiertos:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 8000 (FastAPI)

### Asignar IP elástica
EC2 → Elastic IPs → Allocate → Associate a la instancia.

### Conectarse por SSH
```bash
ssh -i "ruta/ec2-ia-calls.pem" ec2-user@3.136.192.46
```

> En Windows, antes de conectar ejecutar en PowerShell:
> ```powershell
> icacls "ruta/ec2-ia-calls.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
> ```

---

## 2 — RDS

### Crear instancia
- Engine: PostgreSQL
- Template: Free tier
- Identifier: `ai-calls-db`
- Usuario: `postgres`
- Tipo: db.t3.micro — 20GB gp2
- Conectar a la instancia EC2 al momento de crear

### Conectarse desde DBeaver (SSH tunnel)
| Campo | Valor |
|-------|-------|
| Host | `ai-calls-db.cnkaq4yywv1b.us-east-2.rds.amazonaws.com` |
| Port | `5432` |
| Database | `postgres` |
| Username | `postgres` |
| SSH Host | `3.136.192.46` |
| SSH User | `ec2-user` |
| SSH Key | `ec2-ia-calls.pem` |

---

## 3 — Servidor EC2 — Setup inicial

```bash
# Instalar dependencias del sistema
sudo dnf update -y
sudo dnf install -y python3.11 python3.11-pip git nginx

# Clonar el repositorio (repo privado)
git clone https://TOKEN@github.com/usuario/ia-calls.git

# Instalar dependencias Python
cd ia-calls
pip3.11 install -r requirements.txt

# Crear archivo .env
nano .env
```

### Variables de entorno (.env)
```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

DEEPGRAM_API_KEY=
DEEPSEEK_API_KEY=

AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

BASE_URL=https://enel-calls.lat
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@ai-calls-db.cnkaq4yywv1b.us-east-2.rds.amazonaws.com:5432/postgres
```

### Correr migraciones
```bash
alembic upgrade head
```

---

## 4 — Dominio y SSL

### DNS en Namecheap
Advanced DNS → agregar registros:

| Type | Host | Value |
|------|------|-------|
| A Record | @ | 3.136.192.46 |
| A Record | www | 3.136.192.46 |

### Nginx
```bash
sudo nano /etc/nginx/conf.d/enel-calls.conf
```

```nginx
server {
    listen 80;
    server_name enel-calls.lat www.enel-calls.lat;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Certificado SSL
```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d enel-calls.lat -d www.enel-calls.lat
```

---

## 5 — Servicio systemd (arranque automático)

```bash
sudo nano /etc/systemd/system/enel-calls.service
```

```ini
[Unit]
Description=Enel Calls FastAPI
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/ia-calls/src
ExecStart=/home/ec2-user/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable enel-calls
sudo systemctl start enel-calls
```

---

## 6 — CloudFront (Frontend HTTPS)

1. Ir a CloudFront → **Create distribution**
2. **Distribution name**: `enel-calls-frontend`
3. **Origin type**: Amazon S3
4. **S3 origin**: `calls-frontend-enel.s3-website.us-east-2.amazonaws.com`
5. **Protocol**: HTTP only (S3 website hosting no soporta HTTPS)
6. **WAF**: Do not enable security protections (cuesta $14/mes)
7. Click **Create distribution**
8. Esperar ~5 min a que el status pase a **Enabled**
9. El dominio asignado es: `dnkwb11cb5641.cloudfront.net`

> Si CloudFront queda con Protocol HTTPS only, editar el origen y cambiarlo a HTTP only.

---

## 7 — Twilio — Webhooks

En Twilio → Phone Numbers → tu número → Configure:

| Campo | URL |
|-------|-----|
| A call comes in | `https://enel-calls.lat/twiml` |
| Call status changes | `https://enel-calls.lat/call-status` |

---

## Comandos útiles

```bash
# Ver logs del servidor
sudo journalctl -u enel-calls -f

# Reiniciar backend
sudo systemctl restart enel-calls

# Estado del backend
sudo systemctl status enel-calls

# Reiniciar nginx
sudo systemctl restart nginx
```

---

## Actualizar el código

```bash
cd ~/ia-calls
git pull
sudo systemctl restart enel-calls
```
