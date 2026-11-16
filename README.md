# CoffeeHouse

Proyecto académico de una cafetería en Cochabamba. Incluye Inicio con video en bucle, Servicios, Especialidades, Nosotros, Precios y Contacto, además de un chatbot de atención.

## Arquitectura

```text
Navegador → Angular HttpClient → API REST de Node.js / Express → MySQL
                                         └→ Ollama → Gemma 3
```

- `frontend/` contiene la aplicación Angular. El proxy del servidor de desarrollo envía `/api` y `/media` a Express.
- `backend/` contiene `App.js`, los modelos, controladores, middleware y el módulo de chatbot. Express también puede servir la compilación de Angular en el mismo origen.
- `database/` contiene el esquema y los datos de demostración. El primer GET entrega desde MySQL las etiquetas, secciones, contenidos, galería, rutas de medios y catálogo. Express entrega los archivos audiovisuales por HTTP.
- El chatbot adapta el flujo del backend del Chaco. Conserva la configuración de Ollama por variables de entorno, la validación, el límite de tiempo y las respuestas JSON. Usa `/api/chat` de Ollama para conservar el historial reciente e incorpora el catálogo público de MySQL como contexto. Gemma 3 genera las respuestas en cada consulta.

| Tabla | Datos |
| --- | --- |
| `site_profile` | Marca, ubicación, dirección, teléfono, horario, historia y rutas del video |
| `ui_texts` | Etiquetas, mensajes, moneda y configuración textual del asistente |
| `sections` | Encabezados y orden de navegación |
| `services` | Servicios de la cafetería |
| `categories` | Categorías de la carta |
| `products` | Productos, fotos, especialidades y precios |
| `gallery` | Fotos y textos alternativos |
| `contact_messages` | Consultas recibidas y fecha |

## Iniciar en Windows

Se requiere Node.js 24, MySQL 8 (o MariaDB de XAMPP) y Ollama con Gemma 3. Inicia MySQL antes de continuar. En el cliente de administración de tu servidor ejecuta lo siguiente con una cuenta administradora. Elige tu contraseña y úsala también en el archivo `.env`.

```sql
CREATE DATABASE coffeehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'coffeehouse'@'localhost' IDENTIFIED BY 'elige_una_contraseña';
GRANT ALL ON coffeehouse.* TO 'coffeehouse'@'localhost';
```

En una terminal, desde la raíz del proyecto:

```powershell
ollama pull gemma3:1b
Set-Location backend
Copy-Item .env.example .env
notepad .env
npm ci
npm run db:init
npm start
```

Actualiza `DB_PASSWORD` en el editor antes de ejecutar `db:init`. Si Ollama no está iniciado, abre la aplicación Ollama o ejecuta `ollama serve` en otra terminal.

En una segunda terminal, desde la raíz del proyecto:

```powershell
Set-Location frontend
npm ci
npm start
```

Abre [CoffeeHouse en Angular](http://localhost:4200). Para servir la compilación de Angular desde Express, ejecuta `npm run build` en `frontend` y abre [CoffeeHouse en Express](http://127.0.0.1:3000) con el backend iniciado.

## API

| Método | Ruta | Entrada y salida |
| --- | --- | --- |
| GET | `/api/site` | Devuelve `profile`, `texts`, `sections`, `services`, `categories`, `products` y `gallery`. |
| POST | `/api/contact` | Recibe `{ "name", "email", "message" }`, guarda el mensaje en MySQL y devuelve HTTP 201. |
| POST | `/api/chat` | Recibe `{"messages":[{"role":"user","content":"¿Cuánto cuesta el espresso?"}]}` y devuelve `{"reply":"..."}`. Con historial, alterna `user` y `assistant` y termina en `user`. |

Para ver el contenido dinámico, ejecuta este cambio de ejemplo en MySQL y recarga la página:

```sql
UPDATE ui_texts SET text_value = 'Café para empezar bien' WHERE text_key = 'heroLead';
SELECT id, name, email, created_at FROM contact_messages ORDER BY id DESC;
```

## Publicar el código

Crea en GitHub un repositorio vacío. Desde la raíz extraída, con Git autenticado:

```powershell
git init -b main
git add .
git commit -m "Implementar CoffeeHouse"
git remote add origin https://github.com/TU_USUARIO/coffeehouse.git
git push -u origin main
```

Comparte las carpetas `frontend` y `backend` desde ese repositorio. El código comparte raíz con `database`, que necesita el backend para inicializar el esquema.

## Medios

- [Video de espresso de Nathan Baldwin en Pexels](https://www.pexels.com/video/a-machine-pouring-coffee-in-a-cup-9399042/). La portada se obtiene del mismo video.
- Fotografías ilustrativas de Pexels, identificadores [1855214](https://www.pexels.com/photo/1855214/), [1307698](https://www.pexels.com/photo/1307698/), [312418](https://www.pexels.com/photo/312418/), [350478](https://www.pexels.com/photo/350478/) y [3892469](https://www.pexels.com/photo/3892469/).
- [Licencia de Pexels](https://www.pexels.com/license/). Las fotos ilustran los productos y la cafetería del proyecto.

