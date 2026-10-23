@echo off
title Smart QR-Based Attendance System - College Mini Project
echo =======================================================================
echo   SMART QR-BASED ATTENDANCE ^& PARENT NOTIFICATION SYSTEM
echo   Java Spring Boot Mini Project
echo =======================================================================
echo.

where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using system Maven...
    mvn spring-boot:run
) else (
    if exist "..\apache-maven-3.9.6\bin\mvn.cmd" (
        echo Using portable Apache Maven...
        "..\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
    ) else (
        echo Error: Maven not found on PATH and portable Maven not found.
        echo Please ensure Maven or Java 17+ is installed.
        pause
    )
)
