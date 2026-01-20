# Ticket F2-02 — Integrar motor como dependencia

## Objetivo

Integrar el proyecto `rentabilidad-alquiler-engine` como dependencia local en la API
y verificar que la API puede invocar correctamente el motor financiero.

Este ticket NO expone aún el endpoint público de rentabilidad, solo valida la integración.

---

## Contexto

La arquitectura definida es:

API → importa → Motor → ejecuta cálculos

El motor debe usarse como **caja negra**:
- no se reimplementan fórmulas
- no se duplican cálculos

---

## Alcance

Este ticket debe incluir:

- Añadir dependencia local al motor en `package.json`
- Importar `calcularRentabilidad` desde el motor
- Crear un endpoint temporal de prueba (o script) que invoque el motor
- Verificar que la API puede ejecutar el cálculo sin errores

---

## Fuera de alcance

❌ Validación con Zod  
❌ Endpoint definitivo `/rentabilidad`  
❌ Tests HTTP completos  
❌ Manejo de errores avanzado  

---

## Dependencia local

En `package.json` de la API:

```json
{
  "dependencies": {
    "rentabilidad-alquiler-engine": "file:../rentabilidad-alquiler-engine"
  }
}
```

Luego ejecutar:

```bash
npm install
```

---

## Integración mínima

### Opción A — Endpoint temporal (recomendado)

Crear un endpoint de prueba:

```
GET /test-motor
```

Que:

- construya un `MotorInput` mínimo
- invoque `calcularRentabilidad`
- devuelva parte del resultado

### Opción B — Script interno

Crear un script que se ejecute al arrancar el servidor y loguee el resultado.

---

## Ubicación sugerida

- Import del motor en:
  - `src/server.ts`
  o
  - `src/routes/testMotor.ts`

---

## Criterios de aceptación

- La API arranca con el motor integrado
- Se puede ejecutar el motor desde la API sin errores
- Se obtiene un resultado válido del motor
- No hay lógica financiera en la API

---

## Prompt para Cursor (copiar y pegar)

Integra el motor financiero como dependencia local en la API:

- Añadir en `package.json`:
  - dependencia `rentabilidad-alquiler-engine` vía `file:../rentabilidad-alquiler-engine`
- Importar `calcularRentabilidad` y tipos desde el motor
- Crear endpoint temporal `GET /test-motor`
- No implementar aún `/rentabilidad`
- No añadir Zod todavía

Objetivo: validar integración técnica entre API y motor.
