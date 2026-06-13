# PlaneoFUT

![PlaneoFUT Logo](https://via.placeholder.com/150/000000/FFFFFF?text=PlaneoFUT)

## Descripción del Proyecto

**PlaneoFUT** es una herramienta integral diseñada para entrenadores de fútbol que buscan optimizar la planificación de sus temporadas. Permite la creación y gestión de ejercicios, sesiones de entrenamiento, microciclos semanales y la periodización completa de la temporada, adaptándose a las necesidades de fútbol base, cantera, amateur y alto rendimiento.

## Características Principales

*   **Dashboard**: Vista general y acceso rápido a las funcionalidades clave.
*   **Ejercicios**: Biblioteca detallada para crear y gestionar ejercicios con objetivos, fases, intensidad, espacio, material y etiquetas.
*   **Sesiones**: Planificación de sesiones de entrenamiento con bloques (calentamiento, parte principal, juego de aplicación, vuelta a la calma) y la posibilidad de añadir y editar ejercicios.
*   **Microciclos**: Organización semanal de entrenamientos, incluyendo sesiones y partidos.
*   **Pretemporada**: Herramientas específicas para la planificación de la pretemporada.
*   **Temporada**: Periodización visual y gestión de la temporada completa por mesociclos, con control de carga e intensidad.
*   **Calendario**: Visualización de la planificación de entrenamientos y partidos.
*   **Analytics**: Análisis y seguimiento del rendimiento.
*   **Equipo**: Gestión de la plantilla, categorías, calendario de partidos y staff técnico.
*   **Reutilización y Versionado**: Funcionalidades para duplicar sesiones, guardar favoritos y utilizar plantillas reutilizables.

## Tecnologías Utilizadas

El proyecto está construido con las siguientes tecnologías:

*   **Frontend**: React, TypeScript, Vite
*   **Estilos**: TailwindCSS
*   **Enrutamiento**: TanStack Router
*   **Gestión de estado/datos**: TanStack Query
*   **Backend/Base de Datos**: Supabase (Autenticación, Base de Datos)

## Configuración y Ejecución Local

Para poner en marcha el proyecto en tu entorno local, sigue los siguientes pasos:

### Prerrequisitos

*   Node.js (versión 18 o superior)
*   Bun (gestor de paquetes)
*   Una cuenta de Supabase y un proyecto configurado.

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/CryptoLeon78/planeo-fut.git
    cd planeo-fut
    ```

2.  **Instalar dependencias:**
    ```bash
    bun install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:
    ```
    VITE_SUPABASE_URL=tu_url_supabase
    VITE_SUPABASE_ANON_KEY=tu_anon_key_supabase
    ```

4.  **Ejecutar el proyecto:**
    ```bash
    bun dev
    ```

    El proyecto se ejecutará en `http://localhost:5173` (o un puerto similar).

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un *issue* para discutir los cambios propuestos o envía un *pull request* con tus mejoras.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## Contacto

Para cualquier consulta, puedes contactar a través de las redes sociales en el header de la aplicación o vía email a info@planeofut.com.
