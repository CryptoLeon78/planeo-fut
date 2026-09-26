# PlaneoFUT Portable para Windows

El paquete generado contiene un `.exe` único y una carpeta `PlaneoFUT-Portable-<version>`. Ambos formatos no requieren Node.js, npm ni Docker. Para el uso diario se recomienda la carpeta portable: ejecuta `PlaneoFUT.exe` dentro de ella y evitarás la descompresión temporal que necesita el `.exe` único en cada arranque.

## Configuración obligatoria

La distribución creada desde una configuración válida ya incluye `portable-config.json`. Si necesitas cambiar de proyecto, edita ese archivo (situado junto al `.exe`) y completa:

```json
{
  "supabaseUrl": "https://TU-PROYECTO.supabase.co",
  "supabasePublishableKey": "TU_CLAVE_PUBLICABLE_SUPABASE",
  "openaiApiKey": "",
  "googleOAuthEnabled": false,
  "emailConfirmationRequired": false
}
```

La URL y la clave publicable deben corresponder a un proyecto Supabase que tenga aplicadas las migraciones de `supabase/migrations`. La clave publicable es segura para el cliente; no introduzcas una `service_role` en este archivo. `googleOAuthEnabled` solo debe ser `true` tras configurar y probar Google OAuth en Supabase; `emailConfirmationRequired` debe reflejar la política remota de confirmación. La aplicación necesita conexión a Internet para Supabase, autenticación, almacenamiento y funciones remotas.

## Compilación

En un entorno con Node.js 22:

```powershell
npm ci
npm run build
npm run package:win
```

`npm run package:win` crea la carpeta de arranque directo en `dist/PlaneoFUT-Portable-<version>`. Si necesitas el formato de archivo único, `npm run package:win:single` genera el `.exe` y ZIP en `dist`; puede tardar bastante más porque Windows debe descomprimirlo en cada arranque. La creación se detiene si no hay una configuración Supabase válida: así se evita publicar un portable que abre sin poder conectarse.

> En este entorno no puedo ejecutar el binario Windows para una prueba gráfica; sí se valida el build de producción y la generación del paquete. Windows Defender puede mostrar una advertencia porque el ejecutable no está firmado digitalmente.
