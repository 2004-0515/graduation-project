@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev-stack.ps1" -ReleasePorts %*
exit /b %ERRORLEVEL%
