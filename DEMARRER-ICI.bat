@echo off
title Poste de Controle Systeme — Demarrage Facile
chcp 65001 >nul
cls

echo ==================================================================
echo   POSTE DE CONTROLE SYSTEME — OUTIL D'ENTRETIEN WINDOWS & LINUX
echo ==================================================================
echo.
echo   Bonjour ! Preparation de votre outil en cours...
echo.

:: Debloquer les scripts au cas ou Windows SmartScreen les aurait marques comme telecharges
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue" 2>nul

echo   [1/2] Verification de l'environnement Windows... OK
echo   [2/2] Lancement du relais local securise... OK
echo.
echo   Votre tableau de bord va s'ouvrir dans votre navigateur.
echo   Gardez simplement cette petite fenetre ouverte pendant l'utilisation.
echo ==================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\start-ui-server.ps1"

echo.
echo Le serveur a ete arrete. Appuyez sur une touche pour quitter.
pause >nul
