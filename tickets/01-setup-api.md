# Ticket F2-01 — Setup del servidor API

## Objetivo

Inicializar el proyecto de la API con Node.js, TypeScript y Fastify, y levantar
un servidor HTTP básico con un endpoint de healthcheck.

Este ticket solo prepara la infraestructura del servidor, sin integrar aún el motor.

---

## Alcance

Este ticket debe incluir:

- Inicialización del proyecto Node.js
- Configuración de TypeScript
- Instalación y configuración de Fastify
- Script de desarrollo con hot reload
- Endpoint:

```
GET /health
→ { "status": "ok" }
```

---

## Fuera de alcance

❌ Integración con el motor  
❌ Validación de inputs  
❌ Endpoint de rentabilidad  
❌ Tests de integración  

---

## Stack técnico

- Node.js >= 20
- TypeScript
- Fastify
- tsx (para dev)
- dotenv (configuración)

---

## Estructura esperada

```
rentabilidad-alquiler-api/
├── src/
│   └── server.ts
├── test/
├── package.json
├── tsconfig.json
└── PROJECT_CONTEXT.md
```

---

## Criterios de aceptación

- El servidor arranca con `npm run dev`
- Acceder a `http://localhost:3000/health` (puerto configurable vía `PORT`, default 3000) devuelve:
  ```json
  { "status": "ok" }
  ```
- TypeScript compila sin errores

---

## Prompt para Cursor (copiar y pegar)

Configura un servidor API básico con Fastify y TypeScript:

- Inicializar proyecto Node con TypeScript
- Instalar Fastify, tsx y dotenv
- Crear `src/server.ts` con:
  - servidor Fastify
  - endpoint `GET /health` que devuelva `{ status: 'ok' }`
  - puerto configurable vía `PORT` (default 3000)
- Configurar script `dev` para arrancar con hot reload
- Mantener el proyecto mínimo, sin integrar aún el motor