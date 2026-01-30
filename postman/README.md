# Postman Collection - Rentabilidad Alquiler API

Esta carpeta contiene la colección de Postman para probar la API.

## Cómo importar la colección

1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Selecciona el archivo `Rentabilidad Alquiler API.postman_collection.json`
4. La colección aparecerá en tu workspace

## Variables de entorno

La colección usa una variable `base_url` que por defecto está configurada como:
- `http://localhost:3000`

Puedes cambiarla en Postman:
1. Click en la colección → **Variables**
2. Modifica `base_url` según tu entorno

## Endpoints incluidos

### Healthcheck
- **GET /health** - Verifica que el servidor está funcionando. Respuesta: `{ "status": "ok" }`

### Rentabilidad (POST /rentabilidad)
- **POST /rentabilidad - Sin hipoteca** - Body mínimo válido (precioCompra, comunidadAutonoma, alquilerMensual). Respuesta 200 con métricas.
- **POST /rentabilidad - Con hipoteca** - Incluye hayHipoteca, importeHipoteca, tipoInteres, plazoHipoteca. Respuesta 200.
- **POST /rentabilidad - Completo con opcionales** - Ejemplo con gastos de compra, gastos anuales y hipoteca. Respuesta 200.
- **POST /rentabilidad - Request inválido (campos faltantes)** - Solo precioCompra. Respuesta 400.
- **POST /rentabilidad - Request inválido (tipo incorrecto)** - precioCompra no numérico. Respuesta 400.
- **POST /rentabilidad - Request inválido (comunidad no válida)** - comunidadAutonoma "Madrid" (debe ser "Comunidad de Madrid"). Respuesta 400.

## Notas

- La API valida el body con el schema del motor; los valores monetarios aceptan number o string.
- Comunidades válidas: ver mensaje de error 400 si se envía una no soportada (ej. "Comunidad de Madrid", "Cataluña", etc.).
