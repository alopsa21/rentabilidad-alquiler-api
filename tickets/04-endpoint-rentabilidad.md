# Ticket F2-04 — Endpoint POST /rentabilidad

## Objetivo

Implementar el endpoint real de negocio:

POST /rentabilidad

Que:
- valida el body con Zod
- invoca el motor financiero
- devuelve el resultado como JSON

Con este ticket, la API ya es funcional para clientes reales (web, plugin, scripts).

---

## Contexto

Ya existen:

- Servidor Fastify
- Schema Zod para MotorInput
- Motor financiero integrado como dependencia

Ahora solo falta:
validación → motor → response.

---

## Alcance

Este ticket debe incluir:

- Ruta POST /rentabilidad
- Uso del schema Zod para validar body
- Llamada a `calcularRentabilidad`
- Respuesta JSON con `MotorOutput`
- Manejo de errores básico

---

## Fuera de alcance

❌ Autenticación  
❌ Persistencia  
❌ Rate limiting  
❌ Logs avanzados  

---

## Flujo esperado

Request:

```
POST /rentabilidad
Content-Type: application/json
Body: MotorInput
```

Proceso:

1. Validar body con Zod
2. Si inválido → 400
3. Si válido → llamar al motor
4. Devolver MotorOutput

Response:

```
200 OK
{ ...MotorOutput }
```

---

## Ubicación sugerida

Se recomienda:

- Crear ruta en:
  - src/routes/rentabilidad.ts
- Registrar la ruta en:
  - server.ts

Mantener la lógica fuera del server principal.

---

## Criterios de aceptación

- Request válido devuelve 200 con JSON
- Request inválido devuelve 400
- El resultado coincide con ejecución directa del motor
- No hay lógica financiera en la API

---

## Prompt para Cursor (copiar y pegar)

Implementa el endpoint POST /rentabilidad:

- Crear ruta `src/routes/rentabilidad.ts`
- Usar el schema Zod existente para validar `req.body`
- Si la validación falla:
  - responder con status 400 y mensaje
- Si es válida:
  - invocar `calcularRentabilidad` del motor
  - devolver el resultado como JSON
- Registrar la ruta en `server.ts`
- No añadir autenticación ni persistencia

Objetivo: exponer el motor vía HTTP de forma segura.
