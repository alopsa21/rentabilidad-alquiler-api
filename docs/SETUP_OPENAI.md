# 🔑 Configuración de OpenAI API Key

Guía paso a paso para configurar la API key de OpenAI.

---

## 📋 Requisitos Previos

- Cuenta de OpenAI (https://platform.openai.com)
- Método de pago configurado en OpenAI (tarjeta de crédito)

---

## 🚀 Pasos de Configuración

### 1️⃣ Obtener tu API Key de OpenAI

1. **Ve a OpenAI Platform:**
   - https://platform.openai.com

2. **Inicia sesión** con tu cuenta

3. **Ve a API Keys:**
   - Click en tu perfil (arriba derecha)
   - Selecciona "API keys"
   - O ve directamente a: https://platform.openai.com/api-keys

4. **Crea una nueva API key:**
   - Click en "Create new secret key"
   - Dale un nombre descriptivo: `rentabilidad-alquiler-api`
   - **⚠️ IMPORTANTE:** Copia la key AHORA - solo se muestra una vez
   - Debe verse así: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2️⃣ Configurar en el Proyecto

#### Opción A: Con archivo `.env` (RECOMENDADO)

1. **Copia el archivo de ejemplo:**
   ```bash
   cd rentabilidad-alquiler-api
   cp .env.example .env
   ```

2. **Edita el archivo `.env`:**
   ```bash
   nano .env
   # o usa tu editor favorito
   ```

3. **Añade tu API key:**
   ```env
   # .env
   PORT=3000
   HOST=127.0.0.1
   LOG_LEVEL=info
   
   # Reemplaza con tu API key real
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Guarda el archivo** (Ctrl+O, Enter, Ctrl+X en nano)

#### Opción B: Variable de entorno temporal

Para testing rápido sin archivo `.env`:

```bash
export OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
npm run dev
```

⚠️ Esta configuración se pierde al cerrar la terminal.

---

### 3️⃣ Verificar la Configuración

1. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

2. **Prueba el endpoint:**
   ```bash
   curl -X POST http://localhost:3000/rentabilidad/from-url \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.idealista.com/inmueble/12345678/"}'
   ```

3. **Verifica los logs:**
   - ✅ Si ves `"Iniciando scraping de anuncio"` → Todo bien
   - ❌ Si ves `"OPENAI_API_KEY no está definida"` → Revisa el paso 2

---

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **NUNCA subas `.env` a Git**
   - Ya está en `.gitignore`
   - Verifica con: `git status` (no debe aparecer `.env`)

2. **Usa `.env.example` para documentar**
   - Sube `.env.example` a Git (sin valores reales)
   - Otros desarrolladores pueden copiarlo

3. **Rotar la key si se expone**
   - Si accidentalmente subes la key a Git
   - Ve a OpenAI Platform → API keys → Revoke
   - Crea una nueva

4. **Limita los permisos de la key**
   - En OpenAI Platform, puedes limitar el gasto mensual
   - Settings → Billing → Usage limits

---

## 💰 Control de Gastos

### Ver tu uso actual:

1. **Dashboard de OpenAI:**
   - https://platform.openai.com/usage

2. **Ver costos por día:**
   - Muestra gráficos de uso y costos
   - Puedes filtrar por API key

### Establecer límites:

1. **Ve a Billing:**
   - https://platform.openai.com/settings/organization/billing/overview

2. **Configura límites:**
   - "Usage limits" → Set monthly budget
   - Ejemplo: $10/mes para testing

3. **Alertas por email:**
   - Configura alertas al 75% y 90% del límite
   - Settings → Notifications

---

## 🧪 Testing sin Gastar

### Opción 1: Valores de prueba

El sistema tiene **fallback automático**. Si el LLM falla, usa valores por defecto:

```json
{
  "precioCompra": 150000,
  "comunidadAutonoma": "Comunidad de Madrid",
  "alquilerMensual": 800
}
```

### Opción 2: Límite diario bajo

En `src/config/llm.config.ts`:

```typescript
export const LLM_RATE_LIMIT = {
  maxCallsPerDay: 10,  // Solo 10 llamadas/día para testing
}
```

Costo máximo: ~$0.001/día = $0.03/mes

---

## 🐛 Solución de Problemas

### Error: "OPENAI_API_KEY no está definida"

**Causa:** El archivo `.env` no existe o no tiene la variable.

**Solución:**
1. Verifica que existe `.env` en la raíz del proyecto
2. Verifica que contiene `OPENAI_API_KEY=sk-proj-...`
3. Reinicia el servidor: `npm run dev`

---

### Error: "Incorrect API key provided"

**Causa:** La API key es inválida o fue revocada.

**Solución:**
1. Ve a https://platform.openai.com/api-keys
2. Verifica que la key existe y está activa
3. Si fue revocada, crea una nueva
4. Actualiza `.env` con la nueva key

---

### Error: "You exceeded your current quota"

**Causa:** Te quedaste sin créditos en OpenAI o alcanzaste el límite.

**Solución:**
1. Ve a https://platform.openai.com/settings/organization/billing
2. Añade créditos o aumenta el límite
3. O espera al próximo ciclo de facturación

---

### El endpoint usa fallback en lugar del LLM

**Causa:** Alcanzaste el límite diario configurado.

**Solución:**
1. Verifica los logs: `"Límite diario de llamadas LLM alcanzado"`
2. Aumenta el límite en `src/config/llm.config.ts`:
   ```typescript
   maxCallsPerDay: 1000,  // Aumenta este valor
   ```
3. O espera al día siguiente (se resetea automáticamente)

---

## 📚 Recursos

- **OpenAI Platform:** https://platform.openai.com
- **API Keys:** https://platform.openai.com/api-keys
- **Documentación:** https://platform.openai.com/docs
- **Pricing:** https://openai.com/api/pricing/
- **Status:** https://status.openai.com/

---

## ✅ Checklist Final

Antes de empezar a usar el endpoint, verifica:

- [ ] Tienes cuenta de OpenAI con método de pago
- [ ] Creaste una API key en OpenAI Platform
- [ ] Copiaste `.env.example` a `.env`
- [ ] Añadiste tu API key real en `.env`
- [ ] El archivo `.env` NO está en Git (`git status`)
- [ ] Configuraste límites de gasto en OpenAI (opcional pero recomendado)
- [ ] El servidor inicia sin errores (`npm run dev`)
- [ ] El endpoint `/rentabilidad/from-url` responde correctamente

---

## 💡 Tips

1. **Para desarrollo:** Usa `maxCallsPerDay: 100` (bajo)
2. **Para producción:** Aumenta gradualmente según el uso real
3. **Monitorea costos:** Revisa el dashboard de OpenAI semanalmente
4. **Aprovecha el caché:** Reduce costos en 30-70% automáticamente
