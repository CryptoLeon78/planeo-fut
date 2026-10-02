param (
    [string]$Device = "medium_tablet",
    [switch]$Rebuild
)

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         PLANEOFUT - SIMULADOR ANDROID                    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Localizar Android SDK
$SdkDir = "C:\Users\Ivan SQX\scoop\apps\android-clt\current"
if (-not (Test-Path $SdkDir)) {
    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
        $SdkDir = $env:ANDROID_HOME
    } elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
        $SdkDir = $env:ANDROID_SDK_ROOT
    }
}

$AdbPath = Join-Path $SdkDir "platform-tools\adb.exe"
$EmulatorPath = Join-Path $SdkDir "emulator\emulator.exe"

if (-not (Test-Path $AdbPath) -or -not (Test-Path $EmulatorPath)) {
    Write-Host "[ERROR] No se encontraron las herramientas adb o emulator en $SdkDir" -ForegroundColor Red
    exit 1
}

$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir

Write-Host "[1/4] Verificando emulador '$Device'..." -ForegroundColor Green

# 2. Comprobar si el emulador ya está corriendo
$devicesOutput = & $AdbPath devices 2>&1 | Out-String
$isDeviceRunning = $false
if ($devicesOutput -match "emulator-\d+\s+device") {
    $isDeviceRunning = $true
    Write-Host "      Emulador ya esta en marcha y listo." -ForegroundColor Yellow
}

if (-not $isDeviceRunning) {
    Write-Host "[2/4] Arrancando ventana del emulador ($Device)..." -ForegroundColor Green
    Write-Host "      (Por favor, no cierres esta consola mientras arranca)" -ForegroundColor Gray
    
    # Iniciar emulator en proceso independiente con aceleración GPU nativa
    Start-Process -FilePath $EmulatorPath -ArgumentList "-avd", $Device, "-gpu", "host"
    
    Write-Host "      Esperando conexion con el emulador..." -ForegroundColor Cyan
    & $AdbPath wait-for-device
    
    Write-Host "      Cargando sistema Android (puede tardar unos segundos)..." -ForegroundColor Cyan
    $bootCompleted = $false
    $retries = 60
    while (-not $bootCompleted -and $retries -gt 0) {
        Start-Sleep -Seconds 2
        try {
            $status = & $AdbPath shell getprop sys.boot_completed 2>$null
            if ($status -and ($status.Trim() -eq "1")) {
                $bootCompleted = $true
                break
            }
        } catch {
            # Ignorar mientras el daemon inicia
        }
        $retries--
    }
    
    # Espera adicional breve para que el lanzador de Android esté responsivo
    Start-Sleep -Seconds 3
    Write-Host "      Android inicio correctamente." -ForegroundColor Green
} else {
    Write-Host "[2/4] Emulador listo." -ForegroundColor Green
}

# Desbloquear pantalla si está en suspensión o pantalla de bloqueo
try {
    & $AdbPath shell input keyevent 224 2>$null # WAKEUP
    & $AdbPath shell input keyevent 82 2>$null  # UNLOCK (MENU)
} catch {}

# 3. Compilar APK si se solicita o si no existe
$ApkPath = Join-Path $ProjectRoot "dist-mobile\PlaneoFUT-debug.apk"
$FallbackApk = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"

if ($Rebuild -or (-not (Test-Path $ApkPath) -and -not (Test-Path $FallbackApk))) {
    Write-Host "[3/4] Compilando APK de PlaneoFUT..." -ForegroundColor Green
    Push-Location $ProjectRoot
    try {
        & npm run android:apk
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Fallo la compilacion del APK." -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Determinar APK a instalar
$TargetApk = if (Test-Path $ApkPath) { $ApkPath } else { $FallbackApk }
if (-not (Test-Path $TargetApk)) {
    Write-Host "[ERROR] No se encontro el archivo APK en $TargetApk" -ForegroundColor Red
    exit 1
}

# 4. Instalar APK y lanzarlo
Write-Host "[3/4] Instalando PlaneoFUT en el emulador..." -ForegroundColor Green
& $AdbPath install -r -d -g $TargetApk
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Reintentando instalacion..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    & $AdbPath install -r -d -g $TargetApk
}

Write-Host "[4/4] Abriendo la aplicacion en pantalla..." -ForegroundColor Green
# Lanzar actividad principal
& $AdbPath shell am start -n com.planeofut.app/.MainActivity

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡LISTO! La app PlaneoFUT esta abierta en el emulador.   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  INFORMACION UTIL:" -ForegroundColor Cyan
Write-Host "  - La app ya queda INSTALADA permanentemente con su icono." -ForegroundColor White
Write-Host "  - Si sales de la app, abrela deslizando desde abajo hacia" -ForegroundColor White
Write-Host "    arriba en la pantalla para abrir el cajon de apps y ver" -ForegroundColor White
Write-Host "    el icono 'PlaneoFUT'." -ForegroundColor White
Write-Host "  - Puedes arrastrar el icono a la pantalla de inicio dejandolo" -ForegroundColor White
Write-Host "    pulsado con el raton." -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
