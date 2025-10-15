@echo off
title POS System - Starting...
cd /d "%~dp0"

echo ====================================
echo     POS SYSTEM - ELECTRON
echo ====================================
echo.
echo Memulai aplikasi POS...
echo.

REM Check if node exists
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo.
    echo Silakan install Node.js terlebih dahulu dari:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] node_modules tidak ditemukan.
    echo Melakukan instalasi dependencies...
    echo.
    call npm install
    echo.
)

REM Run electron
echo [INFO] Menjalankan POS System...
echo.
node_modules\.bin\electron.cmd .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Aplikasi gagal dijalankan!
    echo.
    pause
)
