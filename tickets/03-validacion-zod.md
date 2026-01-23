# Ticket F2-03 — Validación de Input con Zod

## Objetivo

Implementar la validación del body del request usando **Zod** antes de invocar el motor.

Este ticket define el **contrato HTTP de entrada** de la API y evita que datos inválidos
lleguen al motor financiero.

Todavía NO se debe llamar al motor en este ticket.

---

## Contexto

El motor define el tipo `MotorInput`, pero la API debe:

- validar JSON entrante
- convertirlo a la forma esperada por el motor
- rechazar inputs inválidos con error 400

La validación se hará con **Zod**.

---

## Alcance

Este ticket debe incluir:

- Instalación de Zod
- Definición de schema Zod equivalente a `MotorInput`
- Validación de `req.body` usando el schema
- Respuesta HTTP 400 si el body es inválido

---

## Fuera de alcance

❌ Llamar al motor  
❌ Cálculos financieros  
❌ Persistencia  
❌ Autenticación  

---

## Reglas importantes

- El schema debe reflejar exactamente `MotorInput`
- Campos opcionales deben ser opcionales en Zod
- Campos obligatorios deben ser obligatorios en Zod
- No transformar valores financieros a number para el motor

---

## Inputs esperados (resumen)

Obligatorios:

- precioCompra
- comunidadAutonoma
- alquilerMensual

Opcionales:

- notaria
- registro
- comisionInmobiliaria
- otrosGastosCompra
- reforma
- tasacion
- gestoriaBanco
- seguroVidaHipoteca
- comunidadAnual
- ibi
- seguroHogar
- seguroImpago
- basura
- agua
- electricidad
- gas
- internet
- hayHipoteca
- importeHipoteca
- tipoInteres
- plazoHipoteca

---

## Ubicación del código

Se recomienda:

```
src/schemas/motorInput.schema.ts
```

y usarlo desde la ruta.

---

## Criterios de aceptación

- Requests con body inválido devuelven 400
- Requests con body válido pasan la validación
- No se ejecuta aún el motor

---

## Prompt para Cursor (copiar y pegar)

Implementa validación de input con Zod en la API:

- Instalar `zod`
- Crear schema Zod que represente `MotorInput`
- Colocar schema en `src/schemas/motorInput.schema.ts`
- Usar el schema para validar `req.body` en la ruta
- Si la validación falla:
  - devolver HTTP 400 con mensaje de error
- No llamar aún al motor

Objetivo: blindar el contrato de entrada de la API.
