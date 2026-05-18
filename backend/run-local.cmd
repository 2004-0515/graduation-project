@echo off
setlocal

set "JAR_PATH="
set "SOCKET_TMP=%SystemRoot%\Temp"
for /f "delims=" %%F in ('dir /b /o:-d "target\shion-fuuen-backend-*.jar" ^| findstr /v /i ".original"') do (
  if not defined JAR_PATH set "JAR_PATH=target\%%F"
)

if not defined JAR_PATH (
  echo No packaged jar found under backend\target.
  echo Run: mvn -DskipTests package
  exit /b 1
)

java -Djdk.net.unixdomain.tmpdir=%SOCKET_TMP% -jar "%JAR_PATH%"
