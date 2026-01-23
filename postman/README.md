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
- **GET /health** - Verifica que el servidor está funcionando

### Rentabilidad (Endpoint principal)
- **POST /rentabilidad - Sin hipoteca** - Calcula rentabilidad sin financiación
- **POST /rentabilidad - Con hipoteca** - Calcula rentabilidad con datos de hipoteca
- **POST /rentabilidad - Request inválido (campos faltantes)** - Prueba error 400
- **POST /rentabilidad - Request inválido (tipo incorrecto)** - Prueba error 400

### Testing - Motor Integration
- **GET /test-motor** - Prueba la integración con el motor (valores hardcodeados)

## Notas

- Esta colección se actualizará conforme se añadan nuevos endpoints
- Los endpoints marcados como "Testing" son temporales y se eliminarán cuando se implementen los endpoints definitivos
