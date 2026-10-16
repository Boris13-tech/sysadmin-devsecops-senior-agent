#Requires -Version 5.1
<#
.SYNOPSIS
    Optimisation Sécurisée du Démarrage Windows avec Sauvegarde & Rollback (Senior SysAdmin)
.DESCRIPTION
    Protocole D.S.A.V. :
    1. Sauvegarde la clé HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run (.reg et .json)
    2. Désactive uniquement les applications lourdes non-essentielles au démarrage
       (Steam, Discord, TeraBox, TeraBoxWeb, Notion, Docker Desktop) sans les désinstaller.
    3. Génère la commande exacte de Rollback.
#>
param(
    [string]$BackupDir = "$HOME\.gemini\Backups\SysAdmin",
    [switch]$RestoreLatest
)

$ErrorActionPreference = 'Stop'
$runKeyPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if ($RestoreLatest) {
    $latestReg = Get-ChildItem -Path $BackupDir -Filter "HKCU_Run_Backup_*.reg" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latestReg) {
        Write-Error "Aucune sauvegarde trouvée dans $BackupDir"
        exit 1
    }
    reg import $latestReg.FullName
    [PSCustomObject]@{
        Action       = "RestoreStartup"
        RestoredFrom = $latestReg.FullName
        Status       = "OK"
    } | ConvertTo-Json
    exit 0
}

$timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$regBackupFile  = Join-Path $BackupDir "HKCU_Run_Backup_$timestamp.reg"
$jsonBackupFile = Join-Path $BackupDir "HKCU_Run_Backup_$timestamp.json"

# 1. Sauvegarde via reg export
reg export "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" $regBackupFile /y | Out-Null

# Sauvegarde JSON lisible
$currentProps = Get-ItemProperty -Path $runKeyPath
$propMap = @{}
foreach ($prop in $currentProps.PSObject.Properties) {
    if ($prop.Name -notin @('PSPath','PSParentPath','PSChildName','PSDrive','PSProvider')) {
        $propMap[$prop.Name] = $prop.Value
    }
}
$propMap | ConvertTo-Json | Set-Content -Path $jsonBackupFile -Encoding UTF8

# 2. Applications lourdes à retirer du lancement automatique à l'allumage
$targetsToDisable = @(
    'Steam',
    'Discord',
    'TeraBox',
    'TeraBoxWeb',
    'electron.app.Notion',
    'Docker Desktop'
)

$disabledList = @()
foreach ($app in $targetsToDisable) {
    if ($propMap.ContainsKey($app)) {
        Remove-ItemProperty -Path $runKeyPath -Name $app -ErrorAction SilentlyContinue
        $disabledList += [PSCustomObject]@{
            Name          = $app
            PreviousValue = $propMap[$app]
        }
    }
}

# 3. Vérification post-action
$afterProps = Get-ItemProperty -Path $runKeyPath
$remainingApps = @()
foreach ($prop in $afterProps.PSObject.Properties) {
    if ($prop.Name -notin @('PSPath','PSParentPath','PSChildName','PSDrive','PSProvider')) {
        $remainingApps += $prop.Name
    }
}

[PSCustomObject]@{
    Timestamp        = $timestamp
    RegBackupPath    = $regBackupFile
    JsonBackupPath   = $jsonBackupFile
    RollbackCommand  = "reg import `"$regBackupFile`""
    DisabledCount    = $disabledList.Count
    DisabledApps     = $disabledList
    RemainingStartup = $remainingApps
    Status           = "OK"
} | ConvertTo-Json -Depth 4
