Eres un ingeniero de frontend senior especializado en React, TypeScript y Tailwind CSS. Tu tarea es diseñar interfaces web responsivas y eficientes que consuman APIs existentes.

Crea un frontend web (Next.js App Router + TypeScript + Tailwind + shadcn/ui), todo en español, llamado "Música LPA2", que interactúe con la siguiente API REST (FastAPI):

```json
{
  "base_url": "http://localhost:8000",
  "notas": {
    "paginacion": "Los GET de colecciones aceptan ?pagina=1&tamaño=10 (tamaño máx. 100) y responden con un objeto Pagina",
    "pagina": {"total": 0, "pagina": 1, "tamaño": 10, "paginas": 0, "items": []},
    "errores": {
      "404": {"detail": "Usuario no encontrado | Canción no encontrada | Favorito no encontrado"},
      "409": {"detail": "El correo ya está registrado | La canción ya está en favoritos"},
      "422": {"detail": [{"loc": ["body", "campo"], "msg": "mensaje de validación", "type": "value_error"}]},
      "500": {"detail": "Error interno del servidor | Error interno de base de datos"}
    },
    "fechas": "ISO 8601 en UTC, p. ej. 2026-11-16T21:40:00Z",
    "cors": "La API permite cualquier origen (CORS *)"
  },
  "modelos": {
    "Usuario": {"id": 1, "nombre": "string (2-100)", "correo": "string único, formato email", "fecha_registro": "datetime"},
    "Cancion": {
      "id": 1,
      "titulo": "string (1-200)",
      "artista": "string (1-150)",
      "album": "string | null (máx. 200)",
      "duracion": "int > 0 (segundos)",
      "año": "int entre 1900 y el año actual",
      "genero": "string (1-50)",
      "fecha_creacion": "datetime"
    },
    "Favorito": {"id": 1, "id_usuario": 1, "id_cancion": 1, "fecha_marcado": "datetime"}
  },
  "endpoints": [
    {"endpoint": "/", "método": "GET", "body_response": {"nombre": "API de Música", "version": "1.0.0", "entorno": "development"}},
    {"endpoint": "/health", "método": "GET", "body_response": {"status": "healthy", "database": "conectada", "uptime_segundos": 12.3, "version": "1.0.0"}},

    {"endpoint": "/api/usuarios", "método": "GET", "query": "pagina, tamaño", "body_response": "Pagina<Usuario>"},
    {"endpoint": "/api/usuarios", "método": "POST", "body_request": {"nombre": "Ana Pérez", "correo": "ana@example.com"}, "body_response": "Usuario", "status": 201, "errores": [409, 422]},
    {"endpoint": "/api/usuarios/{id}", "método": "GET", "body_response": "Usuario", "errores": [404]},
    {"endpoint": "/api/usuarios/{id}", "método": "PUT", "body_request": {"nombre": "opcional", "correo": "opcional"}, "body_response": "Usuario", "errores": [404, 409, 422]},
    {"endpoint": "/api/usuarios/{id}", "método": "DELETE", "status": 204, "nota": "también borra sus favoritos", "errores": [404]},

    {"endpoint": "/api/canciones", "método": "GET", "query": "pagina, tamaño", "body_response": "Pagina<Cancion>"},
    {"endpoint": "/api/canciones/buscar", "método": "GET", "query": "titulo, artista, genero (coincidencia parcial, todos opcionales), pagina, tamaño", "body_response": "Pagina<Cancion>"},
    {"endpoint": "/api/canciones", "método": "POST", "body_request": {"titulo": "Bohemian Rhapsody", "artista": "Queen", "album": "A Night at the Opera", "duracion": 354, "año": 1975, "genero": "Rock"}, "body_response": "Cancion", "status": 201, "errores": [422]},
    {"endpoint": "/api/canciones/{id}", "método": "GET", "body_response": "Cancion", "errores": [404]},
    {"endpoint": "/api/canciones/{id}", "método": "PUT", "body_request": "cualquier subconjunto de los campos de Cancion", "body_response": "Cancion", "errores": [404, 422]},
    {"endpoint": "/api/canciones/{id}", "método": "DELETE", "status": 204, "nota": "también borra los favoritos que la referencian", "errores": [404]},

    {"endpoint": "/api/favoritos", "método": "GET", "query": "pagina, tamaño", "body_response": "Pagina<Favorito>"},
    {"endpoint": "/api/favoritos", "método": "POST", "body_request": {"id_usuario": 1, "id_cancion": 1}, "body_response": "Favorito", "status": 201, "errores": [404, 409, 422]},
    {"endpoint": "/api/favoritos/{id}", "método": "GET", "body_response": "Favorito", "errores": [404]},
    {"endpoint": "/api/favoritos/{id}", "método": "DELETE", "status": 204, "errores": [404]},
    {"endpoint": "/api/usuarios/{id}/favoritos", "método": "GET", "query": "pagina, tamaño", "body_response": "Pagina<Favorito>", "errores": [404]},
    {"endpoint": "/api/usuarios/{id_usuario}/favoritos/{id_cancion}", "método": "POST", "body_response": "Favorito", "status": 201, "errores": [404, 409]},
    {"endpoint": "/api/usuarios/{id_usuario}/favoritos/{id_cancion}", "método": "DELETE", "status": 204, "errores": [404]}
  ]
}
```

Requisitos funcionales:

1. **Interfaz de usuario**:

    - Layout con barra lateral (en móvil, menú desplegable) y cuatro vistas: **Inicio**, **Canciones**, **Usuarios** y **Favoritos**.
    - **Inicio (dashboard)**: tarjetas con el total de usuarios, canciones y favoritos (usar el campo `total` de cada listado con `tamaño=1`), indicador del estado de la API según `GET /health` (verde "conectada" / rojo "sin conexión") y las 5 canciones más recientes.
    - **Canciones**: tabla con título, artista, álbum, duración en formato mm:ss, año y género (badge). Barra de búsqueda con tres filtros (título, artista, género) que usa `/api/canciones/buscar`. Botones para crear, editar y eliminar en un diálogo modal. Botón de corazón por fila para marcar/quitar la canción como favorita del usuario activo.
    - **Usuarios**: tabla con nombre, correo y fecha de registro (formato dd/mm/aaaa). Crear, editar y eliminar en diálogo modal. Al hacer clic en un usuario, abrir un panel lateral (Sheet) con sus canciones favoritas (`GET /api/usuarios/{id}/favoritos`, resolviendo cada `id_cancion` a título y artista).
    - **Favoritos**: selector de "usuario activo" (guardado en localStorage y también visible en el encabezado) y lista de sus favoritos como tarjetas con opción de quitar.
    - **Paginación** en todas las tablas usando `pagina`, `tamaño` y `paginas` de la respuesta, con selector de tamaño (5, 10, 20, 50).
    - **Estados**: skeletons mientras carga; estado vacío con ilustración y botón "Crear el primero"; mensajes de error con botón "Reintentar"; toasts (sonner) de éxito y error en cada acción.
    - **Confirmación** antes de eliminar (AlertDialog), avisando que se borran también los favoritos asociados.
    - Tema claro/oscuro.

2. **Lógica de integración**:

    - La URL base de la API se toma de `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8000`) y además se puede cambiar desde un diálogo "Configuración de la API" en el encabezado (guardado en localStorage), con un botón "Probar conexión" que llama a `/health`.
    - Si la API no responde, ofrecer un **modo demostración** con datos de ejemplo en memoria (5 usuarios y 10 canciones) para que la vista previa publicada funcione sin el backend; mostrar un banner "Modo demostración" cuando esté activo.
    - Cliente HTTP tipado en `lib/api.ts` con un tipo genérico `Pagina<T>` y tipos `Usuario`, `Cancion`, `Favorito`.
    - Manejo de errores robusto: leer `detail` de la respuesta; si es una lista (error 422 de FastAPI) mostrar cada `msg` junto al campo correspondiente según `loc`; 404 y 409 como toast con el texto de `detail`; error de red como "No se pudo conectar con la API". Las respuestas 204 no tienen cuerpo.
    - Rendimiento: usar SWR para caché y revalidación de los listados, invalidar la caché después de crear/editar/eliminar, debounce de 300 ms en la búsqueda y carga diferida (lazy) del panel de favoritos.
    - Validaciones en tiempo real con react-hook-form + zod, iguales a las de la API:
        - Usuario: nombre 2-100 caracteres; correo con formato válido, máx. 150.
        - Canción: título 1-200; artista 1-150; álbum opcional máx. 200; duración entera > 0 (permitir escribirla como mm:ss y convertir a segundos); año entero entre 1900 y el año actual; género 1-50 (combobox con sugerencias: Rock, Pop, Jazz, Salsa, Reggaetón, Electrónica, Clásica, Hip Hop).
    - No enviar cookies (`credentials: "omit"`); enviar `Content-Type: application/json` en POST y PUT.
