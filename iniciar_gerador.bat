@echo off
chcp 65001 > nul
title GERADOR DE SLIDES DE SERMÃO (16:9 Full HD)

echo ================================================================
echo  🚀 INICIANDO SERVIDOR DO GERADOR DE SLIDES...
echo ================================================================
echo.

cd /d "%~dp0"
node server.js

pause
