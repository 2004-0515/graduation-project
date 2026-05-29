@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev-stack.ps1" -FrontendBasePort 5174 -BackendBasePort 8081 -ReleasePorts %*
exit /b %ERRORLEVEL%
