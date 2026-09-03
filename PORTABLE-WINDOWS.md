# PlaneoFUT Portable para Windows

El paquete generado contiene `PlaneoFUT.exe`, que arranca la aplicación sin instalar Node.js, npm ni Docker. Es una distribución portable: se puede copiar la carpeta completa a un USB o a otro PC Windows.

## Configuración obligatoria

Antes del primer arranque, copia `portable-config.example.json` como `portable-config.json` y completa:

```json
{
  "supabaseUrl": "https://TU-PROYECTO.supabase.co",
  "supabasePublishableKey": "TU_CLAVE_PUBLICABLE_SUPABASE",
  "openaiApiKey": ""
}
```

La URL y la clave publicable deben corresponder a un proyecto Supabase que tenga aplicadas las migraciones de `supabase/migrations`. La clave publicable es segura para el cliente; no introduzcas una `service_role` en este archivo. La aplicación necesita conexión a Internet para Supabase, autenticación, almacenamiento y funciones remotas.

## Compilación

En un entorno con Node.js 22:

```powershell
npm ci
npm run build
npm run package:win
```

El resultado se crea en `release/PlaneoFUT-Portable-<version>.exe`. Para distribuirlo, entrega el `.exe` junto a `portable-config.json` en la misma carpeta.

> En este entorno no puedo ejecutar el binario Windows para una prueba gráfica; sí se valida el build de producción y la generación del paquete. Windows Defender puede mostrar una advertencia porque el ejecutable no está firmado digitalmente.
