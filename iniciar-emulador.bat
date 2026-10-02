@echo off
chcp 65001 >nul
title PlaneoFUT - Simulador Android
color 0B

:MENU
cls
echo ==========================================================
echo           PLANEOFUT - SIMULADOR ANDROID (APK)
echo ==========================================================
echo.
echo  Selecciona una opción:
echo.
echo   [1] Iniciar MÓVIL (Phone) y abrir la app
echo   [2] Iniciar TABLET y abrir la app
echo   [3] Recompilar APK y reinstalar en el emulador activo
echo   [4] Solo abrir emulador MÓVIL (sin reinstalar)
echo   [5] Solo abrir emulador TABLET (sin reinstalar)
echo   [6] Cerrar todos los emuladores
echo   [0] Salir
echo.
echo ==========================================================
set /p opt="Elige una opción (0-6): "

if "%opt%"=="1" goto MOVIL
if "%opt%"=="2" goto TABLET
if "%opt%"=="3" goto REBUILD
if "%opt%"=="4" goto SOLO_MOVIL
if "%opt%"=="5" goto SOLO_TABLET
if "%opt%"=="6" goto CERRAR
if "%opt%"=="0" goto FIN
goto MENU

:MOVIL
cls
echo Iniciando simulador de móvil...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-emulator.ps1" -Device medium_phone
echo.
pause
goto MENU

:TABLET
cls
echo Iniciando simulador de tablet...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-emulator.ps1" -Device medium_tablet
echo.
pause
goto MENU

:REBUILD
cls
echo Recompilando e instalando APK en el emulador...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-emulator.ps1" -Rebuild
echo.
pause
goto MENU

:SOLO_MOVIL
cls
echo Lanzando ventana del emulador móvil...
start "" "C:\Users\Ivan SQX\scoop\apps\android-clt\current\emulator\emulator.exe" -avd medium_phone -gpu host
echo Emulador en marcha.
timeout /t 3 >nul
goto MENU

:SOLO_TABLET
cls
echo Lanzando ventana del emulador tablet...
start "" "C:\Users\Ivan SQX\scoop\apps\android-clt\current\emulator\emulator.exe" -avd medium_tablet -gpu host
echo Emulador en marcha.
timeout /t 3 >nul
goto MENU

:CERRAR
cls
echo Cerrando emuladores Android...
"C:\Users\Ivan SQX\scoop\apps\android-clt\current\platform-tools\adb.exe" emu kill >nul 2>&1
echo Emuladores detenidos.
timeout /t 2 >nul
goto MENU

:FIN
exit /b 0
