# 📊 Configuración del LLM y Control de Costos

Este documento explica cómo controlar los costos de OpenAI ajustando la configuración del servicio LLM.

## 📍 Ubicación de la Configuración

**TODO se configura en un solo archivo:**

```
src/config/llm.config.ts
```

## 💡 Input vs Output Tokens

Es crucial entender la diferencia:

### Input (Prompt) - LO QUE ENVIAMOS
- El texto del anuncio scrapeado
- En nuestro caso: ~500 tokens por llamada
- **Costo:** ~$0.15 por 1M tokens (más barato)
- **NO se controla con `maxTokens`**

### Output (Respuesta) - LO QUE RECIBIMOS
- El JSON con los datos extraídos
- En nuestro caso: ~80-120 tokens por llamada
- **Costo:** ~$0.60 por 1M tokens (4x más caro)
- **SÍ se controla con `maxTokens`** ⭐

**Conclusión:** Aunque el output es menor en tokens, es 4x más caro por token. Por eso `maxTokens` es importante para controlar costos.

---

## 🎛️ Configuraciones Disponibles

### 1️⃣ Configuración del Modelo (`LLM_CONFIG`)

```typescript
export const LLM_CONFIG = {
  model: 'gpt-4o-mini',    // Modelo a usar
  maxTokens: 150,          // Tokens máximos de respuesta
  temperature: 0.1,        // Determinismo (0-2)
  timeout: 10000,          // Timeout en ms
}
```

#### `model` - Modelo de OpenAI

**Opciones (de más barato a más caro):**
- `'gpt-4o-mini'` ⭐ **RECOMENDADO** - ~$0.15 por 1M tokens
- `'gpt-3.5-turbo'` - ~$0.50 por 1M tokens  
- `'gpt-4o'` - ~$5 por 1M tokens

**Para ahorrar:** Usa `gpt-4o-mini` (actual).

---

#### `maxTokens` - Límite de respuesta (OUTPUT)

⚠️ **IMPORTANTE:** Este límite es para la **respuesta del LLM (output)**, NO para el prompt (input).

**Contexto:**
- **Prompt (input):** ~500 tokens (texto del anuncio) - NO se limita aquí
- **Respuesta (output):** ~80-120 tokens (nuestro JSON) - SÍ se limita aquí

**¿Qué son tokens?**
- 1 token ≈ 0.75 palabras en español
- 100 tokens ≈ 75 palabras
- 150 tokens ≈ 112 palabras ⭐ **ACTUAL** (suficiente para nuestro JSON)
- 200 tokens ≈ 150 palabras

**Costos:**
- Input (prompt): ~$0.15 por 1M tokens
- Output (respuesta): ~$0.60 por 1M tokens (4x más caro)

**Para ahorrar:** Reduce a `100` si el JSON actual es demasiado. La respuesta se cortará si excede el límite.

---

#### `temperature` - Creatividad

- `0.0` - Muy determinista
- `0.1` ⭐ **ACTUAL** - Casi determinista (ideal para datos)
- `0.7` - Equilibrado
- `2.0` - Muy creativo

**Para ahorrar:** Mantén en `0.1` (más consistente = menos tokens desperdiciados).

---

#### `timeout` - Tiempo máximo

- `10000` ⭐ **ACTUAL** = 10 segundos
- Reduce a `5000` (5s) si quieres respuestas más rápidas
- Aumenta a `15000` (15s) si tienes timeouts frecuentes

---

### 2️⃣ Rate Limiting (`LLM_RATE_LIMIT`)

```typescript
export const LLM_RATE_LIMIT = {
  maxRequestsPerMinute: 10,    // Requests por minuto
  maxCallsPerDay: 1000,        // Llamadas LLM por día
}
```

#### `maxRequestsPerMinute` - Límite por minuto

Controla cuántas requests puede hacer un usuario por minuto.

**Valores recomendados:**
- `5` - Muy restrictivo
- `10` ⭐ **ACTUAL** - Para desarrollo/testing
- `20-50` - Producción pequeña
- `100+` - Producción grande

---

#### `maxCallsPerDay` - Límite diario 🔥 **IMPORTANTE**

**Esta es tu protección principal contra gastos excesivos.**

Cuando se alcanza el límite, el sistema usa valores fallback (no llama al LLM).

**Cálculo de costos con `gpt-4o-mini`:**

Por llamada:
- Input (~500 tokens): ~$0.000075
- Output (~100 tokens con maxTokens=150): ~$0.00006
- **Total por llamada: ~$0.000135**

| Llamadas/día | Costo/día | Costo/mes |
|-------------|-----------|-----------|
| 100 | $0.01 | $0.30 |
| 500 | $0.07 | $2.00 |
| 1000 ⭐ | $0.14 | $4.00 |
| 5000 | $0.68 | $20.00 |
| 10000 | $1.35 | $40.00 |

💡 **Nota:** Los tokens de output son 4x más caros que los de input, por eso `maxTokens` es importante para controlar costos.

**Para ahorrar:**
- Testing: `100`
- MVP: `500`
- Producción pequeña: `1000` ⭐ **ACTUAL**
- Producción media: `5000`

**Para deshabilitar:** Establece en `0`.

---

### 3️⃣ Caché (`LLM_CACHE_CONFIG`)

```typescript
export const LLM_CACHE_CONFIG = {
  enabled: true,              // Habilitar caché
  ttl: 60 * 60 * 1000,       // 1 hora
  maxEntries: 1000,           // Máximo de URLs en caché
}
```

#### `enabled` - Activar/Desactivar caché

- `true` ⭐ **RECOMENDADO** - Ahorra muchas llamadas en URLs repetidas
- `false` - Solo para debugging

**Ahorro típico:** 30-70% de llamadas si hay URLs repetidas.

---

#### `ttl` - Tiempo de vida

Tiempo que una URL permanece en caché antes de volver a llamar al LLM.

**Valores comunes:**
- `5 * 60 * 1000` = 5 minutos
- `60 * 60 * 1000` ⭐ **ACTUAL** = 1 hora
- `24 * 60 * 60 * 1000` = 24 horas

**Para ahorrar más:** Aumenta a 24 horas si los anuncios cambian poco.

---

#### `maxEntries` - Máximo de entradas

Número máximo de URLs diferentes en caché.

**Uso de memoria:**
- 1000 entradas ⭐ **ACTUAL** ≈ 1-2 MB
- 10000 entradas ≈ 10-20 MB

---

## 🎯 Escenarios de Uso

### 💰 Presupuesto MUY ajustado

```typescript
export const LLM_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: 100,        // ⬇️ Reducido
  temperature: 0.1,
  timeout: 10000,
}

export const LLM_RATE_LIMIT = {
  maxRequestsPerMinute: 5,    // ⬇️ Más restrictivo
  maxCallsPerDay: 100,        // ⬇️ Muy limitado
}

export const LLM_CACHE_CONFIG = {
  enabled: true,
  ttl: 24 * 60 * 60 * 1000,   // ⬆️ 24 horas
  maxEntries: 1000,
}
```

**Costo mensual:** ~$0.50/mes

---

### ⚖️ Equilibrio precio/calidad (ACTUAL)

```typescript
export const LLM_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: 150,
  temperature: 0.1,
  timeout: 10000,
}

export const LLM_RATE_LIMIT = {
  maxRequestsPerMinute: 10,
  maxCallsPerDay: 1000,
}

export const LLM_CACHE_CONFIG = {
  enabled: true,
  ttl: 60 * 60 * 1000,  // 1 hora
  maxEntries: 1000,
}
```

**Costo mensual:** ~$4/mes (con caché: ~$2/mes)

---

### 🚀 Producción con volumen

```typescript
export const LLM_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: 200,        // ⬆️ Más margen
  temperature: 0.1,
  timeout: 10000,
}

export const LLM_RATE_LIMIT = {
  maxRequestsPerMinute: 50,   // ⬆️ Más permisivo
  maxCallsPerDay: 5000,       // ⬆️ Mayor volumen
}

export const LLM_CACHE_CONFIG = {
  enabled: true,
  ttl: 60 * 60 * 1000,
  maxEntries: 10000,    // ⬆️ Más caché
}
```

**Costo mensual:** ~$20/mes (con caché: ~$10/mes)

---

## 📊 Monitoreo de Costos

Los logs muestran información útil:

```bash
# Llamada exitosa
{"callCount":42,"limit":1000,"remaining":958,"percentage":"4%"}

# Advertencia cerca del límite
⚠️  Acercándose al límite diario de llamadas LLM (remaining: 50)

# Límite alcanzado
🚨 Límite diario de llamadas LLM alcanzado. Usando valores fallback.

# Cache hit (ahorro)
Cache hit (ahorro de llamada LLM) age: 145s
```

---

## ✅ Recomendaciones

1. **Empieza conservador**: `maxCallsPerDay: 100` en testing
2. **Monitorea los logs**: Ajusta según uso real
3. **Activa el caché**: Ahorra 30-70% fácilmente
4. **Mantén `gpt-4o-mini`**: Es suficiente y 15x más barato que GPT-4
5. **Reduce `maxTokens`**: Si no necesitas respuestas largas

---

## 🔄 Cómo Cambiar la Configuración

1. Edita `src/config/llm.config.ts`
2. Cambia los valores que necesites
3. Reinicia el servidor: `npm run dev`
4. Los cambios son inmediatos (no requiere recompilación)

---

## 📝 Variables de Entorno Relacionadas

```bash
# .env
OPENAI_API_KEY=sk-...    # Tu API key de OpenAI
```

**NO cambies esto en el código**, usa variables de entorno.
