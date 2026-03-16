@echo off
REM Cleans up all DCS Dropzone runtime data on uninstall.
REM Called by the Inno Setup uninstaller with the install directory as %1.
REM Inno Setup handles removing its own installed files (Dropzone_Launcher.exe, uninstall.bat).
REM This script removes everything else: downloaded releases, manifests, and data files.

if "%~1"=="" (
    set "APP_DIR=%LOCALAPPDATA%\DCSDropzone"
) else (
    set "APP_DIR=%~1"
)

if not exist "%APP_DIR%" exit /b 0

cd /d "%TEMP%"

REM Remove the manifest file created by the launcher
del /q "%APP_DIR%\.manifest" 2>nul

REM Remove all subdirectories (versioned release folders like 0.0.0/, 1.2.3/, etc.)
for /d %%D in ("%APP_DIR%\*") do rmdir /s /q "%%D" 2>nul

REM Remove any other runtime files (logs, database, etc.)
del /q "%APP_DIR%\data.sqlite" 2>nul
del /q "%APP_DIR%\error.log" 2>nul
del /q "%APP_DIR%\log4js.yaml" 2>nul
