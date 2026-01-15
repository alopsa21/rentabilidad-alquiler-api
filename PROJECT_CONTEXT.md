# Project Context — Rentabilidad Alquiler API

## 1. Objetivo del proyecto

Este proyecto implementa una **API HTTP** que expone el motor financiero de
rentabilidad de alquiler contenido en:

👉 `rentabilidad-alquiler-engine`

La API:
- NO implementa lógica financiera
- NO replica fórmulas
- SOLO valida, orquesta y expone resultados

Toda lógica de negocio vive en el motor.

---

## 2. Alcance actual (Fase 2)

Estamos en la **FASE 2 — API mínima funcional**.

Incluye:
- servidor HTTP
- validación de inputs
- endpoint de cálculo

No incluye:
- autenticación
- base de datos
- usuarios
- scraping
- almacenamiento

---

## 3. Stack técnico fijado

- Runtime: Node.js >= 20
- Lenguaje: TypeScript
- Framework HTTP: Fastify
- Validación: Zod
- Configuración: dotenv

---

## 4. Relación con el motor

La API debe:

- importar `calcularRentabilidad` desde el motor
- usar exactamente los tipos `MotorInput` y `MotorOutput`
- NO duplicar validaciones de dominio complejas
- NO recalcular nada

Si un cálculo cambia, debe cambiar en el motor, no aquí.

---

## 5. Validación de inputs

La API:

- valida estructura y tipos con Zod
- NO valida reglas financieras (eso es del motor)

Errores deben devolverse como:
- 400 → input inválido
- 500 → error interno

---

## 6. Diseño de endpoints

Principio:

> 1 endpoint = 1 caso de uso

Para MVP:

POST /rentabilidad


Request:
- JSON compatible con `MotorInput`

Response:
- JSON compatible con `MotorOutput`

---

## 7. Estilo de código

- Código simple y explícito
- Separar:
  - rutas
  - schemas
  - servicios
- Evitar lógica en controladores
- Preferir funciones pequeñas

---

## 8. Testing

Debe haber:

- tests de rutas (request real)
- tests de integración con motor

No se requieren tests financieros aquí.

---

## 9. Filosofía general

Prioridades:

1. Correcta integración con el motor
2. Estabilidad del contrato HTTP
3. Simplicidad
4. Facilidad de despliegue

Este proyecto es un adaptador, no el núcleo del negocio.
