# PlaneoFUT Portable para Windows

El paquete generado contiene un `.exe` único y una carpeta `PlaneoFUT-Portable-<version>`. Ambos formatos no requieren Node.js, npm ni Docker. Para el uso diario se recomienda la carpeta portable: ejecuta `PlaneoFUT.exe` dentro de ella y evitarás la descompresión temporal que necesita el `.exe` único en cada arranque.

**Para los compañeros entrenadores**: no hay nada que instalar ni configurar. Reciben la carpeta (o el `.exe` único), ejecutan `PlaneoFUT.exe` y entran con la cuenta que les cree el administrador (ver `docs/AUTHENTICATION_PRODUCTION.md`). La distribución no incluye ningún archivo de configuración con credenciales — la conexión a Supabase queda horneada dentro del propio ejecutable en el momento de compilarlo.

## Configuración obligatoria (solo para quien compila, no para los compañeros)

Antes de compilar, crea `portable-config.json` en la **raíz del proyecto** (junto a `package.json`, nunca dentro de `dist/`) copiando `portable-config.example.json` y completando:

```json
{
  "supabaseUrl": "https://TU-PROYECTO.supabase.co",
  "supabasePublishableKey": "TU_CLAVE_PUBLICABLE_SUPABASE",
  "openaiApiKey": "",
  "googleOAuthEnabled": false,
  "emailConfirmationRequired": false,
  "supportEmail": "TU_EMAIL_PERSONAL@gmail.com"
}
```

La URL y la clave publicable deben corresponder a un proyecto Supabase que tenga aplicadas las migraciones de `supabase/migrations`. `googleOAuthEnabled` solo debe ser `true` tras configurar y probar Google OAuth en Supabase; `emailConfirmationRequired` debe reflejar la política remota de confirmación. La aplicación necesita conexión a Internet para Supabase, autenticación, almacenamiento y funciones remotas.

Este archivo **nunca se comitea** (está en `.gitignore`) y **nunca se copia** a la carpeta o ZIP que reciben los compañeros: `npm run package:win`/`package:win:single` lo leen una vez, generan `portable/runtime-config.generated.cjs` con los valores horneados dentro del `.exe`, y ese es el único sitio donde viven.

## Compilación

En un entorno con Node.js 22:

```powershell
npm ci
npm run build
npm run package:win
```

`npm run package:win` crea la carpeta de arranque directo en `dist/PlaneoFUT-Portable-<version>`. Si necesitas el formato de archivo único, `npm run package:win:single` genera el `.exe` y ZIP en `dist`; puede tardar bastante más porque Windows debe descomprimirlo en cada arranque. La creación se detiene si no hay una configuración Supabase válida en la raíz del proyecto: así se evita publicar un portable que abre sin poder conectarse.

## Límites reales de seguridad (léelo antes de repartir el paquete)

La clave publicable de Supabase (`supabasePublishableKey`) **no es un secreto** por diseño: cualquier app cliente de Supabase la necesita para hablar con la API, igual que una clave publicable de Stripe o una `apiKey` de Firebase. Hornearla dentro del `.exe` en vez de dejarla en un `portable-config.json` suelto evita que un compañero la vea abriendo la carpeta con el Explorador o un editor de texto, y las herramientas de desarrollador de la ventana quedan desactivadas en el build empaquetado — pero **no** la hace inextraíble para alguien con conocimientos técnicos (inspeccionando el `app.asar`, capturando tráfico de red, etc.).

La protección real de los datos está en:

- **RLS** (Row Level Security) en cada tabla, ya aplicada vía `supabase/migrations`: cada fila queda scoped a `owner_id`/membresía de equipo.
- **Cuentas gestionadas**: no hay auto-registro; solo entra quien tiene una cuenta creada por el administrador (`docs/AUTHENTICATION_PRODUCTION.md`).
- El `service_role` key **nunca** va en `portable-config.json` ni en el `.exe` — solo se usa desde el PC del administrador vía variable de entorno efímera (`npm run auth:manage-user`, `npm run auth:promote-admin`).

Si en el futuro se reparte el `.exe` fuera de un círculo de confianza y esto deja de ser aceptable, la única forma de ocultar la clave por completo es dejar de hablar con Supabase directamente desde el cliente y meter un backend propio en medio — eso es un cambio de arquitectura, no una opción de configuración.

> En este entorno no puedo ejecutar el binario Windows para una prueba gráfica; sí se valida el build de producción y la generación del paquete. Windows Defender puede mostrar una advertencia porque el ejecutable no está firmado digitalmente.
