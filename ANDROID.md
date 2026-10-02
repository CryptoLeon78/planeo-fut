# PlaneoFUT para Android (APK)

La app Android es un wrapper nativo (Capacitor) alrededor del mismo código React que la web y el
portable de Windows. A diferencia de la web (que usa SSR vía Cloudflare Workers), el build móvil
usa el modo `spa` de TanStack Start (`vite.mobile.config.ts`) para generar un único shell HTML
pre-renderizado en build: el APK no depende de ningún servidor en tiempo de ejecución, solo de
Supabase (igual que el portable de Windows).

## Requisitos para compilar

- Node.js 22 (igual que el resto del proyecto).
- JDK 21 (Capacitor 8 lo requiere; JDK 17 falla con `invalid source release: 21`).
- Android SDK: `platform-tools`, `platforms;android-34` (o superior), `build-tools;34.0.0` (o
  superior), con licencias aceptadas (`sdkmanager --licenses`). No hace falta instalar Android
  Studio completo — el SDK "command-line tools" + Gradle (ya viene con `gradlew` en `android/`)
  son suficientes.
- `android/local.properties` con `sdk.dir=<ruta al SDK>` (no se comitea — cada máquina tiene la
  suya; hay que crearlo a mano si no existe).

## Compilar el APK de depuración

```powershell
npm run android:apk
```

Esto: reconstruye el cliente en modo SPA (`build:mobile`), copia el shell generado como
`index.html`, sincroniza el proyecto nativo (`cap sync android`) y compila con Gradle. El APK
resultante queda en `android/app/build/outputs/apk/debug/app-debug.apk` (cópialo donde quieras,
p. ej. `dist-mobile/`, que está en `.gitignore` igual que `dist/`).

Es un APK de **depuración, sin firmar para producción** (firma automática de debug de Android).
Sirve para instalar en un dispositivo propio o repartir a un grupo de confianza para probar; no es
válido para publicar en Google Play sin generar antes un keystore de release y firmar con
`assembleRelease`.

## Instalar en un teléfono

Con el teléfono en modo desarrollador y depuración USB activada:

```powershell
$env:ANDROID_HOME = "<ruta al SDK>"
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r dist-mobile\PlaneoFUT-debug.apk
```

O, sin cable: copia el `.apk` al teléfono (por USB, Drive, etc.) y ábrelo desde el explorador de
archivos — Android pedirá permitir "instalar apps de origen desconocido" para esa fuente.

## Probar en Simulador / Emulador (Móvil y Tablet)

Ya dispones de dos dispositivos virtuales configurados:
- `medium_phone`: Simula un teléfono móvil Android con pantalla táctil interactiva.
- `medium_tablet`: Simula una tablet Android con pantalla panorámica.

### Formas de arranque:

1. **Con doble clic en Windows**:
   - `iniciar-emulador.bat`: Menú interactivo con opciones para móvil, tablet, recompilar o cerrar.
   - `iniciar-movil.bat`: Acceso directo para abrir directamente el móvil e iniciar la app.
   - `iniciar-tablet.bat`: Acceso directo para abrir directamente la tablet e iniciar la app.

2. **Vía comandos npm**:
   ```powershell
   npm run android:emulator:phone   # Abre móvil y lanza PlaneoFUT
   npm run android:emulator:tablet  # Abre tablet y lanza PlaneoFUT
   ```

El lanzador se encarga de todo de forma automática:
- Arranca la ventana gráfica del emulador con aceleración GPU por hardware.
- Espera a que Android inicie completamente (`boot_completed`).
- Instala o actualiza el APK `dist-mobile\PlaneoFUT-debug.apk`.
- Abre la app `PlaneoFUT` en pantalla lista para interactuar con ratón o táctil.

## Límites conocidos

- La app entra siempre por `/` (la landing), igual que la web — en el móvil no hace falta la
  landing de marketing, pero cambiar esto es una mejora de UX pendiente, no un bloqueante.
- El service worker (`sw.js`) que registra la web para PWA se empaqueta igual dentro del APK; si
  causa problemas de caché dentro del WebView de Android, se puede excluir del build móvil más
  adelante.
