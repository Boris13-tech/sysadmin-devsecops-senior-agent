@echo off
title Installation du Raccourci sur le Bureau
chcp 65001 >nul
cls

echo ==================================================================
echo   CREATION DU RACCOURCI SUR LE BUREAU
echo ==================================================================
echo.
echo Creation de votre raccourci "Poste de Controle PC" en cours...

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$sc = $ws.CreateShortcut((Join-Path $desktop 'Poste de Controle PC.lnk')); " ^
  "$sc.TargetPath = '%~dp0DEMARRER-ICI.bat'; " ^
  "$sc.WorkingDirectory = '%~dp0'; " ^
  "$sc.Description = 'Poste de Controle Systeme — Entretien et Sante PC'; " ^
  "$sc.IconLocation = 'shell32.dll,238'; " ^
  "$sc.Save(); " ^
  "Write-Host '`nRaccourci cree avec succes sur votre Bureau !' -ForegroundColor Green"

echo.
echo Vous pouvez desormais lancer l'outil a tout moment depuis votre Bureau.
echo Appuyez sur une touche pour fermer.
pause >nul
