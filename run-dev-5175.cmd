@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev-stack.ps1" -FrontendBasePort 5175 -BackendBasePort 8082 -ReleasePorts %*
exit /b %ERRORLEVEL%
