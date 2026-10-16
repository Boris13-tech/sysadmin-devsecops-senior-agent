@echo off
title Senior SysAdmin ^& DevSecOps — Centre de Controle Interactif
chcp 65001 >nul
echo Lancement de l'interface graphique Senior SysAdmin ^& DevSecOps...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\start-ui-server.ps1"
pause
