@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
if not "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR%\"
set "TARGET=%SCRIPT_DIR%Dashboard\index.html"

if exist "%TARGET%" (
  start "" "%TARGET%"
) else (
  echo Could not find Dashboard\index.html relative to %~nx0.
  echo Expected at: %TARGET%
  pause
)
