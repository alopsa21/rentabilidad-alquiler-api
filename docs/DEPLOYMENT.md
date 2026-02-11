# 🚀 Deployment en VPS

Guía para desplegar `rentabilidad-alquiler-api` en un VPS (Ubuntu/Debian).

---

## 🔑 Configuración de Variables de Entorno en VPS

Tienes **3 opciones** principales:

---

### Opción 1: Archivo `.env` en el VPS (MÁS SIMPLE) ⭐

**Recomendado para empezar.**

#### Pasos:

1. **Sube tu código al VPS** (sin el archivo `.env`):
   ```bash
   # En tu máquina local
   git push origin main
   
   # En el VPS
   ssh usuario@tu-vps.com
   cd /var/www
   git clone https://github.com/tu-usuario/rentabilidad-alquiler.git
   cd rentabilidad-alquiler/rentabilidad-alquiler-api
   ```

2. **Crea el archivo `.env` en el VPS:**
   ```bash
   # En el VPS
   nano .env
   ```

3. **Añade tus variables:**
   ```env
   PORT=3000
   HOST=0.0.0.0
   LOG_LEVEL=info
   OPENAI_API_KEY=sk-proj-tu-api-key-de-produccion
   ```

4. **Protege el archivo:**
   ```bash
   # Solo el propietario puede leer/escribir
   chmod 600 .env
   
   # Verifica los permisos
   ls -la .env
   # Output: -rw------- 1 usuario usuario 123 ... .env
   ```

✅ **Pros:**
- Simple y directo
- Fácil de actualizar
- Similar al desarrollo local

❌ **Contras:**
- El archivo queda en el servidor
- Si alguien accede al servidor, puede verlo

---

### Opción 2: Variables de Entorno del Sistema

**Recomendado para producción seria.**

#### Con Systemd Service

1. **Crea un servicio systemd:**
   ```bash
   sudo nano /etc/systemd/system/rentabilidad-api.service
   ```

2. **Configura el servicio:**
   ```ini
   [Unit]
   Description=Rentabilidad Alquiler API
   After=network.target

   [Service]
   Type=simple
   User=usuario
   WorkingDirectory=/var/www/rentabilidad-alquiler/rentabilidad-alquiler-api
   
   # Variables de entorno aquí
   Environment="NODE_ENV=production"
   Environment="PORT=3000"
   Environment="HOST=0.0.0.0"
   Environment="LOG_LEVEL=info"
   Environment="OPENAI_API_KEY=sk-proj-tu-api-key-aqui"
   
   ExecStart=/usr/bin/node dist/index.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Activa el servicio:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable rentabilidad-api
   sudo systemctl start rentabilidad-api
   
   # Ver logs
   sudo journalctl -u rentabilidad-api -f
   ```

✅ **Pros:**
- Más seguro (permisos de root)
- Auto-reinicio en fallos
- Logs centralizados

❌ **Contras:**
- Más complejo de configurar
- Requiere reiniciar el servicio para cambiar variables

---

### Opción 3: PM2 con archivo de configuración

**Recomendado si ya usas PM2.**

1. **Crea archivo de configuración PM2:**
   ```bash
   nano ecosystem.config.js
   ```

2. **Configura PM2:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'rentabilidad-api',
       script: './dist/index.js',
       instances: 1,
       exec_mode: 'cluster',
       env_production: {
         NODE_ENV: 'production',
         PORT: 3000,
         HOST: '0.0.0.0',
         LOG_LEVEL: 'info',
         OPENAI_API_KEY: 'sk-proj-tu-api-key-aqui'
       }
     }]
   };
   ```

3. **Protege el archivo:**
   ```bash
   chmod 600 ecosystem.config.js
   
   # NO subas este archivo a Git
   echo "ecosystem.config.js" >> .gitignore
   ```

4. **Inicia con PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

✅ **Pros:**
- Gestor de procesos robusto
- Fácil de reiniciar/monitorear
- Balance de carga automático

❌ **Contras:**
- Dependencia adicional
- El archivo de config tiene la key

---

## 🔐 Mejores Prácticas de Seguridad

### 1. Usa una API Key diferente para producción

```bash
# Desarrollo (tu máquina)
OPENAI_API_KEY=sk-proj-dev-xxxxx

# Producción (VPS)
OPENAI_API_KEY=sk-proj-prod-yyyyy
```

**Por qué:**
- Si desarrollo se compromete, producción está segura
- Puedes revocar una sin afectar la otra
- Límites de gasto separados

---

### 2. Configura límites en OpenAI

Para la key de producción:

1. Ve a: https://platform.openai.com/api-keys
2. Crea una key separada: `rentabilidad-prod`
3. En Settings → Billing → Usage limits:
   - Establece un límite mensual (ej: $20/mes)
   - Alertas al 75% y 90%

---

### 3. Permisos de archivos

```bash
# Si usas .env en el VPS
chmod 600 .env
chown usuario:usuario .env

# Si usas ecosystem.config.js
chmod 600 ecosystem.config.js
chown usuario:usuario ecosystem.config.js
```

---

### 4. Firewall y acceso

```bash
# Solo permite acceso SSH desde tu IP
sudo ufw allow from TU_IP to any port 22

# Permite HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activa firewall
sudo ufw enable
```

---

## 📦 Script de Deployment Completo

Crea un script para automatizar:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying rentabilidad-alquiler-api..."

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
cd rentabilidad-alquiler-api
npm ci --production

# 3. Build
npm run build

# 4. Verificar que .env existe
if [ ! -f .env ]; then
    echo "❌ Error: .env no encontrado"
    echo "Crea .env con tus variables de producción"
    exit 1
fi

# 5. Restart service (elige uno)
# Opción A: Systemd
# sudo systemctl restart rentabilidad-api

# Opción B: PM2
pm2 restart rentabilidad-api

echo "✅ Deployment completado"
```

Uso:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🧪 Verificar Variables en el VPS

```bash
# Ver todas las variables de entorno
printenv | grep OPENAI

# O desde Node.js
node -e "console.log(process.env.OPENAI_API_KEY)"
```

---

## 🔄 Actualizar la API Key en Producción

### Con .env:
```bash
nano .env
# Cambia OPENAI_API_KEY
# Guarda y sal

# Reinicia
pm2 restart rentabilidad-api
# o
sudo systemctl restart rentabilidad-api
```

### Con Systemd:
```bash
sudo nano /etc/systemd/system/rentabilidad-api.service
# Cambia la variable Environment

sudo systemctl daemon-reload
sudo systemctl restart rentabilidad-api
```

### Con PM2:
```bash
nano ecosystem.config.js
# Cambia OPENAI_API_KEY

pm2 restart rentabilidad-api
```

---

## 📊 Monitoreo en Producción

### Logs del servidor

```bash
# Systemd
sudo journalctl -u rentabilidad-api -f

# PM2
pm2 logs rentabilidad-api

# Directo
tail -f /var/log/rentabilidad-api.log
```

### Ver uso de LLM

Los logs mostrarán:
```json
{
  "callCount": 42,
  "limit": 1000,
  "remaining": 958,
  "msg": "Llamada LLM registrada"
}
```

### Alertas de límite

```bash
# Buscar advertencias
sudo journalctl -u rentabilidad-api | grep "límite"
```

---

## 🎯 Recomendación por Tipo de VPS

### VPS Pequeño (1 core, 1GB RAM)
- **Opción 1:** Archivo `.env` + PM2
- Simple y efectivo
- Bajo overhead

### VPS Mediano (2+ cores, 2GB+ RAM)
- **Opción 2:** Systemd service
- Más robusto
- Auto-reinicio automático

### VPS con múltiples servicios
- **Opción 3:** PM2 con configuración
- Gestión centralizada
- Balance de carga

---

## ✅ Checklist de Deployment

- [ ] Código subido a Git (sin `.env`)
- [ ] VPS configurado con Node.js
- [ ] API key de OpenAI de producción creada
- [ ] Variables de entorno configuradas en el VPS
- [ ] Permisos de archivos correctos (`chmod 600`)
- [ ] Servicio/proceso configurado (systemd/PM2)
- [ ] Firewall configurado
- [ ] Nginx/Apache configurado (si aplica)
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Límites de gasto en OpenAI configurados
- [ ] Monitoreo y logs funcionando
- [ ] Backup de configuración

---

## 🆘 Troubleshooting en VPS

### "OPENAI_API_KEY no está definida"

```bash
# Verifica que existe
cat .env | grep OPENAI

# Verifica permisos
ls -la .env

# Verifica que el proceso puede leer
sudo -u usuario cat .env
```

### "Module not found"

```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Puerto ocupado

```bash
# Ver qué usa el puerto 3000
sudo lsof -i :3000

# Mata el proceso
kill -9 PID
```

---

## 📚 Recursos

- **PM2 Docs:** https://pm2.keymetrics.io/
- **Systemd Guide:** https://www.digitalocean.com/community/tutorials/how-to-use-systemctl-to-manage-systemd-services-and-units
- **Nginx + Node.js:** https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu
