param (
    [string]$Device = "medium_phone",
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"
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

Write-Host "[1/5] Verificando emulador '$Device'..." -ForegroundColor Green

# 2. Comprobar si el emulador ya está corriendo
$runningDevices = & $AdbPath devices
$isDeviceRunning = $false
if ($runningDevices -match "emulator-\d+\s+device") {
    $isDeviceRunning = $true
    Write-Host "      Emulador ya en ejecucion y conectado a ADB." -ForegroundColor Yellow
}

if (-not $isDeviceRunning) {
    Write-Host "[2/5] Arrancando ventana del emulador ($Device)..." -ForegroundColor Green
    Write-Host "      (Se abrira la ventana interactiva del movil/tablet)" -ForegroundColor Gray
    
    # Iniciar emulator en proceso independiente con aceleracion por hardware
    Start-Process -FilePath $EmulatorPath -ArgumentList "-avd", $Device, "-gpu", "host"
    
    Write-Host "      Esperando a que el sistema Android termine de arrancar..." -ForegroundColor Cyan
    & $AdbPath wait-for-device
    
    $bootCompleted = $false
    $retries = 60
    while (-not $bootCompleted -and $retries -gt 0) {
        Start-Sleep -Seconds 2
        $status = & $AdbPath shell getprop sys.boot_completed 2>$null
        if ($status -and $status.Trim() -eq "1") {
            $bootCompleted = $true
        }
        $retries--
    }
    
    if (-not $bootCompleted) {
        Write-Host "      [AVISO] El emulador todavia esta cargando su interfaz, continuando..." -ForegroundColor Yellow
    } else {
        Write-Host "      Android inicio correctamente." -ForegroundColor Green
    }
} else {
    Write-Host "[2/5] Emulador listo." -ForegroundColor Green
}

# 3. Compilar APK si se solicita o si no existe
$ApkPath = Join-Path $ProjectRoot "dist-mobile\PlaneoFUT-debug.apk"
$FallbackApk = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"

if ($Rebuild -or (-not (Test-Path $ApkPath) -and -not (Test-Path $FallbackApk))) {
    Write-Host "[3/5] Compilando APK de PlaneoFUT..." -ForegroundColor Green
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
} else {
    Write-Host "[3/5] Usando APK existente." -ForegroundColor Green
}

# Determinar APK a instalar
$TargetApk = if (Test-Path $ApkPath) { $ApkPath } else { $FallbackApk }
if (-not (Test-Path $TargetApk)) {
    Write-Host "[ERROR] No se encontro el archivo APK en $TargetApk" -ForegroundColor Red
    exit 1
}

# 4. Instalar APK
Write-Host "[4/5] Instalando / actualizando PlaneoFUT en el emulador..." -ForegroundColor Green
& $AdbPath install -r -d $TargetApk
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Reintentando instalacion..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    & $AdbPath install -r -d $TargetApk
}

# 5. Lanzar la aplicacion
Write-Host "[5/5] Iniciando aplicacion en pantalla..." -ForegroundColor Green
& $AdbPath shell am start -n com.planeofut.app/.MainActivity

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡LISTO! La app PlaneoFUT ya esta abierta en el emulador. " -ForegroundColor Yellow
Write-Host "  Puedes interactuar con ella con el raton o pantalla tactil. " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
