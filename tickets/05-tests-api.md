# Ticket F2-05 — Tests de API (request real)

## Objetivo

Crear tests de integración que validen el endpoint:

POST /rentabilidad

mediante requests HTTP reales contra el servidor Fastify.

Estos tests garantizan que:
- la validación funciona
- el motor se ejecuta correctamente
- el contrato HTTP es estable

---

## Contexto

Ya existe:

- Endpoint POST /rentabilidad
- Validación Zod
- Integración con motor financiero

Ahora necesitamos validar el flujo completo vía HTTP.

---

## Alcance

Este ticket debe incluir:

- Configuración de entorno de test para Fastify
- Tests que hagan requests reales al servidor
- Validación de status codes
- Validación de campos clave del response

---

## Fuera de alcance

❌ Tests del motor (ya existen en Fase 1)  
❌ Tests de rendimiento  
❌ Auth  
❌ Persistencia  

---

## Casos de test mínimos

### ✅ Caso 1 — Request válida

- POST /rentabilidad con MotorInput válido
- Esperar:
  - status 200
  - campos numéricos presentes en response

### ❌ Caso 2 — Request inválida

- POST /rentabilidad con body incompleto o mal tipado
- Esperar:
  - status 400

---

## Stack de test

Se recomienda:

- Vitest
- Supertest (o inyección de Fastify)

Usar el servidor en modo test (sin escuchar en puerto real).

---

## Ubicación del código

Crear:

```
test/rentabilidad.api.test.ts
```

---

## Criterios de aceptación

- Tests pasan con `npm test`
- El endpoint se prueba vía HTTP
- Se valida al menos:
  - status
  - existencia de campos clave del MotorOutput

---

## Prompt para Cursor (copiar y pegar)

Crea tests de integración para la API:

- Configurar entorno de test con Fastify
- Importar el server sin arrancar en puerto
- Usar Supertest o inyección de Fastify
- Test 1:
  - POST /rentabilidad con MotorInput válido
  - Esperar status 200
  - Validar campos:
    - totalCompra
    - cashflowFinal
    - rentabilidadBruta
- Test 2:
  - POST /rentabilidad con body inválido
  - Esperar status 400

No modificar la lógica del endpoint ni del motor.
