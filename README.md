# PlaneoFUT

![PlaneoFUT Logo](https://via.placeholder.com/150/000000/FFFFFF?text=PlaneoFUT)

## Descripción del Proyecto

**PlaneoFUT** es una herramienta integral diseñada para entrenadores de fútbol que buscan optimizar la planificación de sus temporadas. Permite la creación y gestión de ejercicios, sesiones de entrenamiento, microciclos semanales y la periodización completa de la temporada, adaptándose a las necesidades de fútbol base, cantera, amateur y alto rendimiento.

## Características Principales

*   **Dashboard**: Vista general y acceso rápido a las funcionalidades clave.
*   **Ejercicios**: Biblioteca detallada para crear y gestionar ejercicios con objetivos, fases, intensidad, espacio, material, etiquetas y **fotos/capturas del ejercicio**.
*   **Sesiones**: Planificación de sesiones de entrenamiento con bloques (calentamiento, parte principal, juego de aplicación, vuelta a la calma) y la posibilidad de añadir y editar ejercicios. Las imágenes se incluyen automáticamente en el **PDF exportable**.
*   **Microciclos**: Organización semanal de entrenamientos, incluyendo sesiones y partidos.
*   **Pretemporada**: Herramientas específicas para la planificación de la pretemporada.
*   **Temporada**: Periodización visual y gestión de la temporada completa por mesociclos, con control de carga e intensidad.
*   **Calendario**: Visualización mejorada de la planificación de entrenamientos y partidos con indicadores de intensidad y duración.
*   **Analytics**: Análisis y seguimiento del rendimiento.
*   **Equipo**: Gestión de la plantilla con **escudo del equipo**, **fotos de jugadores**, categorías, calendario de partidos y staff técnico.
*   **Reutilización y Versionado**: Funcionalidades para duplicar sesiones, guardar favoritos y utilizar plantillas reutilizables.

## Tecnologías Utilizadas

El proyecto está construido con las siguientes tecnologías:

*   **Frontend**: React, TypeScript, Vite
*   **Estilos**: TailwindCSS
*   **Enrutamiento**: TanStack Router
*   **Gestión de estado/datos**: TanStack Query
*   **Backend/Base de Datos**: Supabase (Autenticación, Base de Datos, Storage)
*   **Validación**: Zod
*   **Notificaciones**: Sonner

## Configuración y Ejecución Local

Para poner en marcha el proyecto en tu entorno local, sigue los siguientes pasos:

### Prerrequisitos

*   Node.js (versión 18 o superior)
*   npm (gestor de paquetes)
*   Docker (para ejecutar Supabase localmente)
*   Una cuenta de Supabase y un proyecto configurado

### Instalación Rápida

Ejecuta el script de inicio incluido:

```bash
./start.sh
```

Este script instalará las dependencias y iniciará la aplicación en modo desarrollo.

### Instalación Manual

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/CryptoLeon78/planeo-fut.git
    cd planeo-fut
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Supabase localmente:**
    
    Supabase proporciona un entorno local para desarrollo. Sigue estos pasos:
    
    ```bash
    # Instalar Supabase CLI
    npm install -g supabase
    
    # Iniciar Supabase localmente (en otra terminal)
    supabase start
    ```
    
    Este repositorio usa puertos locales aislados para no interferir con otros proyectos Docker:
    - PostgreSQL en `localhost:55433`
    - Supabase Studio en `http://localhost:55435`
    - API en `http://localhost:54321`
    
    Después de ejecutar `supabase start`, verás las credenciales de conexión. Copia la URL y la clave anon.

4.  **Configurar variables de entorno:**
    
    Crea un archivo `.env.local` en la raíz del proyecto:
    
    ```env
    # Supabase Local (si usas Supabase localmente)
    VITE_SUPABASE_URL=http://localhost:54321
    VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publicable_local
    
    # O Supabase Cloud (reemplaza con tus credenciales)
    # VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
    # VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publicable_supabase
    ```

5.  **Ejecutar las migraciones de base de datos:**
    
    Las migraciones se aplican automáticamente cuando ejecutas `supabase start`. Si necesitas aplicarlas manualmente:
    
    ```bash
    supabase migration up
    ```

6.  **Ejecutar el proyecto:**
    ```bash
    npm run dev
    ```
    
    El proyecto se ejecutará en `http://localhost:5173` (o un puerto similar).

### Configuración de la Base de Datos en Supabase

#### Tablas Principales

La base de datos incluye las siguientes tablas:

*   **profiles**: Información del usuario
*   **teams**: Equipos creados por el usuario
*   **players**: Jugadores de cada equipo (con soporte para fotos)
*   **exercises**: Biblioteca de ejercicios (con soporte para imágenes)
*   **sessions**: Sesiones de entrenamiento
*   **session_blocks**: Bloques dentro de una sesión
*   **session_block_exercises**: Ejercicios dentro de cada bloque
*   **microcycles**: Microciclos semanales
*   **microcycle_slots**: Slots dentro de un microciclo
*   **season_events**: Eventos de la temporada (partidos, etc.)
*   **session_evaluations**: Evaluaciones post-sesión

#### Storage Buckets

Se crean automáticamente dos buckets de almacenamiento:

*   **exercise-images**: Para fotos y capturas de ejercicios
*   **team-images**: Para escudos de equipos y fotos de jugadores

#### Aplicar Migraciones Personalizadas

Si necesitas agregar nuevas migraciones:

```bash
supabase migration new nombre_migracion
# Edita el archivo SQL generado
supabase migration up
```

## Estructura del Proyecto

```
planeo-fut/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── routes/            # Páginas y rutas
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilidades y constantes
│   ├── integrations/      # Integraciones (Supabase, etc.)
│   └── styles/            # Estilos globales
├── supabase/
│   └── migrations/        # Migraciones de base de datos
├── vite.config.ts         # Configuración de Vite
├── tsconfig.json          # Configuración de TypeScript
└── start.sh               # Script de inicio rápido
```

## Desarrollo

PlaneoFUT se ejecuta y despliega sobre infraestructura propia: Supabase para datos/Auth/Storage y Cloudflare Workers para el runtime. No requiere cuenta, plugin ni servicio de un generador externo.

```bash
npx wrangler login
npm run cf-typegen
npm run deploy
```

`OPENAI_API_KEY` es exclusivamente de servidor. Las variables `VITE_*` son públicas y deben apuntar al proyecto Supabase de cada entorno.

### Agregar un nuevo ejercicio con imagen

1. Ve a la sección **Ejercicios**
2. Haz clic en **Nuevo ejercicio**
3. Completa los datos del ejercicio
4. En la sección **Foto/Captura del ejercicio**, sube una imagen
5. Guarda el ejercicio

La imagen se almacenará en el bucket `exercise-images` y se mostrará automáticamente en las sesiones y en el PDF exportado.

### Gestionar equipo y jugadores

1. Ve a la sección **Equipo**
2. Haz clic en **Nuevo equipo** para crear un equipo
3. Haz clic en el icono de editar para abrir los detalles del equipo
4. Sube el **escudo del equipo**
5. Añade jugadores con su número, nombre y posición
6. Sube la **foto de cada jugador**

## Exportar a PDF

Las sesiones pueden exportarse a PDF incluyendo:
- Nombre y objetivo de la sesión
- Bloques de entrenamiento
- Ejercicios con sus imágenes
- Duración y intensidad

Para exportar:
1. Abre una sesión
2. Haz clic en **Exportar PDF**
3. Guarda el archivo en tu dispositivo

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un *issue* para discutir los cambios propuestos o envía un *pull request* con tus mejoras.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## Contacto

Para cualquier consulta, puedes contactar a través de las redes sociales en el header de la aplicación o vía email a info@planeofut.com.

## Roadmap Futuro

*   Integración con análisis de video
*   Seguimiento de lesiones y recuperación
*   Reportes avanzados y estadísticas
*   Aplicación móvil nativa
*   Colaboración en tiempo real entre entrenadores
*   Integración con wearables y sensores de rendimiento
