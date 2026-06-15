@echo off
REM ============================================================
REM   Social-Media Reporting Dashboard - 1-Klick-Starter
REM   Doppelklick auf diese Datei: startet den Server und
REM   oeffnet das Dashboard im Browser (http://localhost:4317).
REM ============================================================
cd /d "%~dp0"
title Dashboard-Starter

echo ============================================================
echo    Social-Media Reporting Dashboard
echo ============================================================
echo.

REM --- Pruefen, ob Node.js installiert ist ---
where node >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Node.js wurde nicht gefunden.
  echo Bitte einmalig installieren: https://nodejs.org  ^(LTS-Version^)
  echo Danach diese Datei erneut doppelklicken.
  echo.
  pause
  exit /b 1
)

echo Starte den Server in einem eigenen Fenster ...
start "Dashboard-Server (offen lassen!)" cmd /k "npm run dashboard"

echo Warte kurz, bis der Server bereit ist ...
timeout /t 3 /nobreak >nul

echo Oeffne das Dashboard im Browser ...
start "" "http://localhost:4317"

echo.
echo ------------------------------------------------------------
echo   Fertig. Das Dashboard sollte sich im Browser oeffnen.
echo.
echo   WICHTIG: Das schwarze "Dashboard-Server"-Fenster bitte
echo   geoeffnet lassen - es laeuft der Server darin.
echo.
echo   Zum Beenden: einfach beide Fenster schliessen.
echo ------------------------------------------------------------
echo.
echo Dieses Fenster kann jetzt geschlossen werden.
timeout /t 6 /nobreak >nul
exit /b 0
