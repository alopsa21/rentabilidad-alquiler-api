## Visión técnica — `rentabilidad-alquiler-api`

Documento para entender la API desde un punto de vista similar a Java/Spring.

---

## 1. `package.json` (equivalente a `pom.xml` / `build.gradle`)

- **Scripts:**
  - `npm run dev` → arranca el servidor en modo desarrollo (similar a `mvn spring-boot:run`).
  - `npm run build` → compila TypeScript a JS en `dist/`.
  - `npm start` → ejecuta el servidor compilado (`node dist/server.js`).
  - `npm test` / `npm run test:run` → ejecutan tests con Vitest (similar a JUnit).

- **Dependencias clave:**
  - `fastify` → framework HTTP (analogía: Spring Boot / Spring MVC).
  - `zod` → validación de entrada (analogía: Bean Validation, `@Valid`).
  - `dotenv` → carga de variables de entorno desde `.env`.
  - `pino`, `pino-pretty` → logging (analogía: SLF4J + Logback).
  - `@fastify/cors` → soporte CORS.
  - `rentabilidad-alquiler-engine` → motor financiero (módulo separado con la lógica de negocio).

---

## 2. Punto de entrada — `src/index.ts`

```ts
import { arrancarServidor } from './server';

// Punto de entrada principal del servidor
arrancarServidor();
```

Equivalente a un `public static void main` que arranca Spring Boot.  
Toda la lógica real de arranque está en `src/server.ts`.

---

## 3. Configuración del servidor — `src/server.ts`

Responsable de:

- Crear la instancia de Fastify.
- Registrar CORS.
- Conectar el compilador de validación Zod.
- Registrar el manejador global de errores.
- Registrar rutas (`/health`, `/rentabilidad`).

Puntos clave:

- **`crearServidor()`**  
  Crea y configura Fastify (no lo arranca):

  ```ts
  export async function crearServidor(): Promise<FastifyInstance> {
    const server = Fastify({
      logger: config.env === 'test' ? false : (logger as any),
    });

    await server.register(cors, { origin: true });
    server.setValidatorCompiler(crearCompiladorZod());
    server.setErrorHandler(errorHandler);

    server.get('/health', async () => ({ status: 'ok' }));
    registrarRutasRentabilidad(server);

    return server;
  }
  ```

  Analogía: clase de configuración Spring Boot (`@Configuration`) + registro de filtros y controladores.

- **`arrancarServidor()`**  
  Obtiene la instancia de servidor configurada y llama a `listen`:

  ```ts
  export async function arrancarServidor(): Promise<void> {
    const server = await crearServidor();
    await server.listen({ port: config.port, host: config.host });
    // logging con pino
  }
  ```

  Analogía: `SpringApplication.run(...)`.

---

## 4. Configuración y entorno — `src/config/index.ts`

Responsable de leer y validar variables de entorno:

- `PORT`, `HOST`, `NODE_ENV`, `LOG_LEVEL`.
- Valida que el puerto sea un número válido.
- Valida que el nivel de log sea uno de `trace|debug|info|warn|error|fatal`.

Exporta un **singleton** `config` que se usa en `server.ts`.

Analogía: combinación de `application.properties` + clase `@ConfigurationProperties`.

---

## 5. Esquema de entrada — `src/schemas/motorInput.schema.ts`

Define el **contrato de entrada HTTP** usando Zod:

- Representa el `MotorInput` del motor financiero.
- Campos obligatorios:
  - `precioCompra`
  - `comunidadAutonoma`
  - `alquilerMensual`
- Muchos campos opcionales:
  - gastos de compra (`reforma`, `notaria`, `registro`, …)
  - gastos anuales (`comunidadAnual`, `ibi`, `seguroHogar`, …)
  - datos de hipoteca (`hayHipoteca`, `importeHipoteca`, `tipoInteres`, `plazoHipoteca`)

Los valores monetarios:

- Aceptan **number o string**.
- Se convierten internamente a `Decimal` para el motor.

Analogía en Java:

- DTO `MotorInputDto` con anotaciones de validación tipo `@NotNull`, `@Positive`.
- Un conversor que transforma `String` → `BigDecimal`.

Fastify usa este schema automáticamente gracias a `setValidatorCompiler(crearCompiladorZod())`.

---

## 6. Ruta de negocio — `src/routes/rentabilidad.ts`

Expone el endpoint principal:

- **POST `/rentabilidad`**

Responsable de:

1. Recibir el body ya validado por Fastify + Zod.
2. Llamar al motor financiero (`calcularRentabilidad`).
3. Serializar la respuesta para devolver JSON.

Estructura simplificada:

```ts
interface RentabilidadRequest {
  Body: MotorInput;
}

async function calcularRentabilidadHandler(
  request: FastifyRequest<RentabilidadRequest>
) {
  const inputValidado = request.body;
  const resultado = calcularRentabilidad(inputValidado);
  return serializarMotorOutput(resultado);
}

export function registrarRutasRentabilidad(server: FastifyInstance) {
  server.post(
    '/rentabilidad',
    { schema: { body: motorInputSchema } },
    calcularRentabilidadHandler
  );
}
```

Analogía con Spring:

- `@RestController` con `@PostMapping("/rentabilidad")`.
- Recibe un DTO validado (`@Valid MotorInputDto`).
- Llama a un servicio de dominio externo (`calcularRentabilidad` del motor).
- Devuelve un DTO de salida (`MotorOutputSerializado`).

---

## 7. Serialización de salida — `src/services/serializacion.ts`

Convierte el resultado del motor (`MotorOutput`, con `Decimal`) al JSON que ve el cliente:

- Interfaz `MotorOutputSerializado` con todos los campos como `string`.
- Función `serializarMotorOutput` que hace `.toString()` de cada `Decimal`.

Analogía: mapper tipo MapStruct o método `toDto()`.

---

## 8. Manejo centralizado de errores — `src/utils/errorHandler.ts`

Funciona como un `@ControllerAdvice`:

- Registra un **error handler global** en Fastify (`server.setErrorHandler(errorHandler)`).
- Distingue entre:
  - Errores de validación de Zod / Fastify (`FST_ERR_VALIDATION`) → HTTP 400.
  - Errores del motor (ej: comunidad no soportada) → HTTP 400.
  - Errores internos inesperados → HTTP 500.
- Registra los errores con `logger` (pino) incluyendo URL y método.

Respuestas típicas:

- **400 validación**:
  - `{ status: 'error-validacion', message: '...', errores: [...] }`
- **500 interno**:
  - `{ status: 'error-interno', message: 'Error interno del servidor al calcular la rentabilidad' }`

---

## 9. Logging — `src/utils/logger.ts`

Configura `pino`:

- Desarrollo:
  - Usa `pino-pretty` para logs legibles (colores, timestamps).
- Producción:
  - Logs JSON estructurados, listos para recolectar por herramientas externas (ELK, etc.).

El logger se conecta a Fastify y al error handler.

---

## 10. Validación integrada — `src/utils/validator.ts`

Permite a Fastify usar **schemas Zod** como validadores nativos:

- Implementa un compilador de schemas (`crearCompiladorZod`) que:
  - Intenta hacer `schema.parse(data)`.
  - Si falla, convierte los errores de Zod en un formato que Fastify entiende.
- Eso hace que:
  - Se valide la request **antes** de entrar al handler.
  - El error handler global pueda capturar y devolver 400 con info útil.

Analogía: integración entre Bean Validation y el pipeline de Spring MVC.

---

## 11. Tests — `test/rentabilidad.api.test.ts`

Usa **Vitest** + el método `crearServidor()` para tests de integración:

- Arranca un servidor Fastify en memoria:
  - No abre puerto real; usa `app.inject()` para simular peticiones HTTP.
- Cubre casos:
  - Requests válidos (con/sin hipoteca, valores como `number` o `string`).
  - Errores de validación (campos faltantes, tipos incorrectos).
  - Error de comunidad no válida.

Analogía con:

- `MockMvc` o `WebTestClient` en Spring para tests de controllers.

---

## 12. Postman

Colección en `postman/Rentabilidad Alquiler API.postman_collection.json`:

- **GET `/health`** → estado del servidor.
- **POST `/rentabilidad`**:
  - Casos válidos:
    - Sin hipoteca.
    - Con hipoteca.
    - Completo con opcionales.
  - Casos inválidos:
    - Campos faltantes.
    - Tipo incorrecto.
    - Comunidad no válida.

Documentado en `postman/README.md`.

---

## 13. Resumen mental estilo Java

- `index.ts` → `main` de Spring Boot.
- `server.ts` → `@SpringBootApplication` + configuración global.
- `config/` → `application.properties` + `@ConfigurationProperties`.
- `schemas/` → DTOs de entrada + Bean Validation.
- `routes/rentabilidad.ts` → `@RestController` con `@PostMapping`.
- `services/serializacion.ts` → mapper dominio → DTO salida.
- `utils/errorHandler.ts` → `@ControllerAdvice`.
- `utils/validator.ts` → integración del validador (Zod) con el framework.
- `test/` → tests de integración con servidor embebido.

