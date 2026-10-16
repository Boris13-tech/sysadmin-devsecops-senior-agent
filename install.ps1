#Requires -Version 5.1
<#
.SYNOPSIS
    Installateur 1-Clic du Plugin & Agent Senior SysAdmin & DevSecOps pour Google Antigravity
#>
$ErrorActionPreference = 'Stop'

$pluginTarget = Join-Path $HOME ".gemini\config\plugins\sysadmin-devsecops"
$globalRules  = Join-Path $HOME ".gemini\config\AGENTS.md"

Write-Host "[1/3] Creation du repertoire du plugin : $pluginTarget" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $pluginTarget -Force | Out-Null

Write-Host "[2/3] Copie des fichiers du plugin (agents, rules, skills, assets)..." -ForegroundColor Cyan
Copy-Item -Path "$PSScriptRoot\plugin.json" -Destination $pluginTarget -Force
Copy-Item -Path "$PSScriptRoot\README.md"   -Destination $pluginTarget -Force
Copy-Item -Path "$PSScriptRoot\agents"      -Destination $pluginTarget -Recurse -Force
Copy-Item -Path "$PSScriptRoot\assets"      -Destination $pluginTarget -Recurse -Force
Copy-Item -Path "$PSScriptRoot\rules"       -Destination $pluginTarget -Recurse -Force
Copy-Item -Path "$PSScriptRoot\skills"      -Destination $pluginTarget -Recurse -Force

Write-Host "[3/3] Activation des regles globales Senior SysAdmin & DevSecOps..." -ForegroundColor Cyan
Copy-Item -Path "$PSScriptRoot\rules\AGENTS.md" -Destination $globalRules -Force

Write-Host "`nInstallation terminee avec succes ! Redemarrez Antigravity pour charger le plugin complet." -ForegroundColor Green
