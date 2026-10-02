@echo off
chcp 65001 >nul
title PlaneoFUT - Móvil
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-emulator.ps1" -Device medium_phone
pause
