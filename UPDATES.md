# Cómo subir cambios a producción

## Backend

1. Haz los cambios en local
2. Sube a GitHub:
```bash
git add .
git commit -m "descripción del cambio"
git push
```

3. Conéctate al servidor:
```bash
ssh -i "C:/Users/johan.bohorquez-rami/Desktop/ai-calls/ec2-ia-calls.pem" ec2-user@3.136.192.46
```

4. Actualiza y reinicia:
```bash
cd ~/ia-calls && git pull && sudo systemctl restart enel-calls
```

5. Verifica que esté corriendo:
```bash
sudo systemctl status enel-calls
```

---

## Frontend

1. Haz los cambios en local
2. Genera el build:
```bash
cd C:\Users\johan.bohorquez-rami\Desktop\ai-calls\client
npm run build
```

3. Sube a S3:
```bash
aws s3 sync dist s3://calls-frontend-enel --delete
```

4. Abre el frontend y verifica:
```
http://calls-frontend-enel.s3-website.us-east-2.amazonaws.com
```

---

## Ver logs del backend en tiempo real

```bash
sudo journalctl -u enel-calls -f
```
