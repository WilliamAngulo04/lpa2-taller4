# Frontend para el API de Música

## Descripción

En este taller generarás el frontend para el API de Música desarrollada en el lpa2-taller3 usando la herramienta [v0.app](https://v0.app/) y un *prompt* especializado.

## Prerrequisitos

- API del lpa2-taller3 funcionando localmente
- Node.js 18+ instalado
- Cuenta en [v0.app](https://v0.app)

## Preparar la información de tu API

Antes de usar el *prompt*, recopila esta información de tu API de Música, para cada *endpoint*:

```json
{
  "endpoint": "http://localhost:3000/api/tu-endpoint",
  "método": "GET/POST/PUT/DELETE",
  "body_request": {"clave": "valor"},
  "body_response": {"data": [], "message": "string"},
  "errores": {"400": "Bad Request", "500": "Server Error"}
}
```

## Usar el *Prompt* en v0.app

1. Accede a [v0.app](https://v0.app)
2. Copia y adapta el siguiente *prompt*:

    ---
    
    Eres un ingeniero de frontend senior especializado en React, TypeScript y Tailwind CSS. Tu tarea es diseñar interfaces web responsivas y eficientes que consuman APIs existentes.

    Crea un frontend web que interactúe con la siguiente API:  

    > pega el JSON con los detalles de tu API 

    Requisitos funcionales:  

    1. **Interfaz de usuario**:  

        - [ESPECIFICA: Diseño esperado (ej: formulario de login, dashboard de datos, tabla editable)]  
        - [ESPECIFICA: Estados de carga/éxito/error]  
        - [ESPECIFICA: Comportamientos interactivos (ej: validación en tiempo real, paginación)]

    2. **Lógica de integración**:  

        - Implementa manejo de errores robusto  
        - Optimiza el rendimiento (ej: caching, lazy loading)  
        - [ESPECIFICA: Validaciones de datos necesarias]

    ---

## Generar y Descargar el Código

1. Ejecuta el *prompt* en [v0.app](https://v0.app)
2. Revisa el *preview* y realiza los ajustes necesarios
3. Descarga el `ZIP` con la aplicación
4. Ve al proyecto: `cd proyectos/lpa2-taller4`
5. Descomprime el `ZIP` en este directorio
6. Configurar Node v20: `curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
7. Instalar Node/NPM: `sudo apt install nodejs -y`
8. Instalar PNPM: `sudo npm install -g pnpm`
9. Instalar las dependencias del proyecto: `pnpm install`
10. Ejecutar en modo desarrollo: `pnpm dev`
11. Abrir la aplicación en: [localhost:3000](http://localhost:3000/)
12. Revisa y ajusta la configuración del API
13. Para ejecutar en modo producción: `pnpm build` y luego: `pnpm start`


---

## Desarrollo del Taller

| Campo       | Valor                                                  |
|-------------|--------------------------------------------------------|
| Nombre      | William Q. Angulo A.                                   |
| Usuario Git | [WilliamAngulo04](https://github.com/WilliamAngulo04)  |
| API (taller 3) | [lpa2-taller3](https://github.com/WilliamAngulo04/lpa2-taller3) |
| Proyecto en v0 | _(pegar aquí el enlace público de v0)_              |

### 1. Información de la API

La descripción de los 23 *endpoints* del taller 3 (cuerpos, respuestas paginadas, autenticación y errores 401/404/409/422/500) está en [`docs/api-musica.json`](docs/api-musica.json).

### 2. *Prompt* usado en v0

El *prompt* completo, ya adaptado y con el JSON incluido, está en [`docs/prompt-v0.md`](docs/prompt-v0.md). Especifica:

- Vistas: Inicio (dashboard), Canciones, Usuarios y Favoritos.
- Estados de carga (*skeletons*), vacío, error con reintento y *toasts*.
- Búsqueda con *debounce*, paginación, diálogos de creación/edición y confirmación al eliminar.
- Validación con zod igual a la de la API, caché con SWR y URL de la API configurable.
- Modo demostración para que la versión publicada funcione sin el backend.

### 3. Ejecutar en Windows

```powershell
# API (en otra terminal)
cd ..\lpa2-taller3
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn main:app --reload   # http://localhost:8000

# Frontend
winget install OpenJS.NodeJS.LTS # Node 20+, solo la primera vez
npm install -g pnpm
pnpm install
copy .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm dev                         # http://localhost:3000
```

Para producción: `pnpm build` y `pnpm start`.

Si después de instalar Node la terminal de VS Code dice que `pnpm` no se reconoce, hay que cerrar todas las ventanas de VS Code y volver a abrirlo, o cargar la ruta en esa terminal:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:Path"
```

### 4. Ajustes al código generado por v0

El ZIP de v0 funcionaba, pero se corrigió en [`components/music-dashboard.tsx`](components/music-dashboard.tsx):

- Las tablas de Canciones y Usuarios usaban las primeras 100 filas y paginaban en el navegador; ahora usan la paginación del API (`pagina`, `tamaño`, `paginas`) y la búsqueda de `/api/canciones/buscar`.
- Los totales del inicio usan el campo `total` de la API en lugar de contar las filas cargadas.
- Mientras carga ya no se muestran los datos de ejemplo; hay *skeletons* y un estado de error con "Reintentar".
- El campo de URL de la API recargaba todo con cada tecla; ahora solo aplica al guardar.
- Si el usuario activo guardado no existe en la API, se usa el primero de la lista.
- La fecha del inicio estaba fija; ahora es la fecha actual.

### 5. Login y registro (OAuth2)

La API del taller 3 se amplió con OAuth2 (flujo de contraseña) y tokens JWT; los `GET` son públicos y las escrituras exigen token.

- [`components/auth-screen.tsx`](components/auth-screen.tsx): pantalla con pestañas **Ingresar** y **Registrarse** (nombre, correo, contraseña de 8 a 72 caracteres y confirmación), con botón para mostrar u ocultar la contraseña.
- [`lib/api.ts`](lib/api.ts): `login()` envía el formulario OAuth2 a `/api/auth/token` (`username` = correo), guarda el token y lo manda como `Authorization: Bearer` en cada petición. Un `401` cierra la sesión.
- El usuario activo es el que inició sesión (`/api/auth/me`); el botón de salida del menú lateral cierra la sesión.
- **Explorar en modo demostración** sigue disponible sin cuenta.
- Los usuarios cargados con DBeaver no tienen contraseña: para entrar hay que crear una cuenta con **Registrarse**.

### 6. Publicación

La aplicación se publica importando este repositorio desde GitHub en v0 y pulsando **Publish** (despliegue en Vercel). Como la API corre en `localhost`, la versión publicada no la alcanza y entra directo al modo demostración, sin pantalla de login. Para conectarla a la API real se cambia la URL en **Configuración de la API** (por ejemplo, un túnel `ngrok http 8000`); con la API disponible aparece la pantalla de login.
