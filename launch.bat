@echo off
title Smart QR Attendance System
cd /d "%~dp0"
echo =======================================================================
echo   SMART QR-BASED ATTENDANCE & PARENT NOTIFICATION SYSTEM
echo =======================================================================
echo.
echo Starting Application Server...
echo The browser will open automatically once the server is ready.
echo.

:: Launch background watcher that opens browser as soon as server responds
start "" /b powershell -WindowStyle Hidden -Command "$url='http://localhost:8080'; for ($i=0; $i -lt 40; $i++) { try { $r=[System.Net.WebRequest]::Create($url + '/login'); $r.Timeout=1000; $res=$r.GetResponse(); $res.Close(); Start-Process $url; break } catch { Start-Sleep -Milliseconds 800 } }"

:: Start Spring Boot
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    mvn spring-boot:run
) else (
    if exist "..\apache-maven-3.9.6\bin\mvn.cmd" (
        "..\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
    ) else (
        call mvnw.cmd spring-boot:run
    )
)
