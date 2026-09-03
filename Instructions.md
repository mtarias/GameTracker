# Contexto del Proyecto: Clon Personal de Gestión de Videojuegos (MyBacklog Custom Clone)
 
## 📌 Objetivo del Proyecto
Crear una aplicación web personal y responsiva (Mobile-First) para gestionar de forma 100% privada mi colección y registro cronológico de videojuegos (Backlog, Jugando, Completados). No se desean funciones de red social ni feeds de noticias. El sistema debe permitir ordenar manualmente los juegos y generar una vista pública y compartible mediante un enlace para que otras personas puedan ver mis listas.
 
## 🛠️ Arquitectura e Infraestructura Seleccionada
Para garantizar coste cero, escalabilidad automática y cero mantenimiento manual de tokens, la infraestructura elegida es:
 
1. **Frontend / Cliente:** Next.js (React) con TypeScript, estilizado de manera minimalista y responsiva (Mobile-First). Desplegado en **Vercel** de forma gratuita. Se configurará como PWA (Progressive Web App) para poder "instalarse" en el celular con su propio icono.
2. **Backend & Base de Datos:** **Supabase** (Plan gratuito con PostgreSQL en la nube).
   - Manejará la autenticación nativa (Login por Email/Password privado).
   - Almacenará la colección de juegos.
3. **Manejo de Tokens / Proxy de API:** **Supabase Edge Functions** (Serverless). Actuará como el middleware seguro entre nuestra aplicación e IGDB para proteger las credenciales de desarrollo.
 
## 🔄 Integración con la API de IGDB (Twitch)
Los datos de los videojuegos (nombres, IDs y carátulas) se obtienen de la API de IGDB de Twitch utilizando el flujo **Client Credentials Grant Flow**.
 
### El problema a resolver con el Token:
Twitch no ofrece `refresh_token` para credenciales de aplicación. El `access_token` expira cada ~60 días y requiere una petición POST exponiendo el `Client Secret`. Para evitar hardcodear el Secret en el frontend o actualizarlo manualmente, **Supabase Edge Functions** se encargará de:
1. Recibir la petición de búsqueda del cliente.
2. Comprobar en una tabla de caché interna de Supabase si el `access_token` de IGDB está vigente.
3. Si está expirado o no existe, la Edge Function usará de forma segura las variables de entorno (`TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET`) para pedir un nuevo token a Twitch y actualizar la BD.
4. Realizar la petición a IGDB usando el lenguaje de consultas *Apicalypse* e inyectando los headers de autenticación.
5. Retornar los resultados limpios (juegos y URLs de carátulas en alta resolución) al frontend.
 
## 💾 Modelo de Datos Inicial (PostgreSQL en Supabase)
 
### 1. Tabla: `profiles` (Creada por defecto por Supabase Auth)
- `id`: uuid (PK, hace referencia a `auth.users.id`)
- `username`: text (nombre único para la URL pública, ej: `://app.com`)
 
### 2. Tabla: `user_games` (Colección de juegos de cada usuario)
- `id`: uuid (PK)
- `user_id`: uuid (FK a `profiles.id`)
- `igdb_id`: integer (ID único del juego en IGDB)
- `title`: text (Título del juego)
- `cover_url`: text (URL de la carátula del juego)
- `status`: text (enum: 'backlog', 'wishlist', 'playing', 'completed', 'abandoned', 'endless')
- `start_date`: date (editable, opcional)
- `end_date`: date (editable, opcional)
- `completion_percentage`: integer (0-100, opcional)
- `custom_order`: integer (Orden manual del juego **dentro de su propia lista/estado**, no global. El drag & drop reordena únicamente los juegos que comparten el mismo `status`)
- `created_at`: timestamp with time zone

> Nota de UX: al cambiar el filtro de orden (ej. alfabético) el frontend reordena solo la vista, sin sobrescribir `custom_order`. Al volver a "orden custom" se debe leer nuevamente por esa columna.
 
### 3. Tabla: `twitch_auth_cache` (Para el control del Serverless Token)
- `id`: integer (PK, fila única)
- `access_token`: text
- `expires_at`: timestamp with time zone
 
## 🛤️ Estructura de Rutas del Frontend (Next.js App Router)
- `/` -> Landing page simple con botón de Login.
- `/login` -> Formulario de inicio de sesión privado (solo yo tendré acceso a registrarme o loguearme).
- `/dashboard` -> **[RUTA PRIVADA]** Mi panel de control. Buscador de IGDB para añadir juegos, selectores de estado (Backlog, Wishlist, Jugando, Completado, Abandonado, Endless), y la lista visual donde puedo arrastrar o reordenar los juegos (drag & drop) dentro de cada lista de forma independiente, o alternar a orden alfabético/fijo sin perder el orden manual.
- `/usuario/[username]` -> **[RUTA PÚBLICA]** Vista limpia y estética en formato galería que muestra únicamente mis carátulas de videojuegos ordenadas cronológicamente. No tiene botones de edición ni requiere autenticación.
 
## 🤖 Instrucciones para GitHub Copilot
Cuando te pida escribir código para este proyecto, guíate estrictamente por este archivo de contexto. Prioriza:
1. Código limpio en TypeScript y componentes funcionales de React.
2. Diseño Mobile-First limpio, oscuro, enfocado puramente en portadas grandes de videojuegos sin elementos distractores de redes sociales.
3. Implementación correcta de las políticas de seguridad RLS (Row Level Security) de Supabase para asegurar que solo yo pueda editar mis juegos, pero cualquiera pueda leer la ruta pública.