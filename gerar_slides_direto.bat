@echo off
chcp 65001 > nul
title GERADOR INSTANTÂNEO DE SLIDES - 100%% OFFLINE

echo ================================================================
echo  ⚡ GERADOR LOCAL DE SLIDES (100%% OFFLINE / ZERO CRÉDITOS)
echo ================================================================

cd /d "%~dp0"
node gerar_slides_direto.js %*

echo.
pause
