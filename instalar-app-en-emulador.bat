@echo off
chcp 65001 >nul
title PlaneoFUT - Cargar App en Emulador
color 0A

echo ==========================================================
echo        CARGANDO PLANEOFUT EN EL EMULADOR ACTIVO
echo ==========================================================
echo.
set SDK_DIR=C:\Users\Ivan SQX\scoop\apps\android-clt\current
set ADB="%SDK_DIR%\platform-tools\adb.exe"
set APK="%~dp0dist-mobile\PlaneoFUT-debug.apk"

if not exist %APK% set APK="%~dp0android\app\build\outputs\apk\debug\app-debug.apk"

echo [1/3] Comprobando emulador conectado...
%ADB% wait-for-device

echo [2/3] Instalando PlaneoFUT con icono permanente...
%ADB% install -r -d -g %APK%

echo [3/3] Abriendo la aplicación en la pantalla...
%ADB% shell input keyevent 82 >nul 2>&1
%ADB% shell am start -n com.planeofut.app/.MainActivity

echo.
echo ==========================================================
echo  ¡Listo! La app PlaneoFUT ya está en pantalla.
echo  El icono también está disponible en el cajón de apps.
echo ==========================================================
echo.
pause
