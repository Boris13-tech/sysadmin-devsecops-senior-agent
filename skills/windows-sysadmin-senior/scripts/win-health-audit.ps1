#Requires -Version 5.1
<#
.SYNOPSIS
    Audit Complet de Santé Système Windows (Senior SysAdmin 10+ YoE)
.DESCRIPTION
    Collecte en lecture seule les métriques clés (OS, Uptime, CPU, RAM, Disques,
    Top Processus, Services automatiques arrêtés, Erreurs EventLog 24h, Réseau, Démarrage)
    et retourne un rapport structuré JSON + résumé console.
#>
param(
    [switch]$JsonOnly
)

$ErrorActionPreference = 'SilentlyContinue'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cs = Get-CimInstance Win32_ComputerSystem
$uptimeSpan = (Get-Date) - $os.LastBootUpTime

$totalRamGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeRamGB  = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedRamGB  = [math]::Round($totalRamGB - $freeRamGB, 2)
$ramPct     = [math]::Round(($usedRamGB / $totalRamGB) * 100, 1)

$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
    $sizeGB = [math]::Round($_.Size / 1GB, 2)
    $freeGB = [math]::Round($_.FreeSpace / 1GB, 2)
    $usedPct = if ($sizeGB -gt 0) { [math]::Round((($sizeGB - $freeGB) / $sizeGB) * 100, 1) } else { 0 }
    [PSCustomObject]@{
        Drive   = $_.DeviceID
        Label   = $_.VolumeName
        SizeGB  = $sizeGB
        FreeGB  = $freeGB
        UsedPct = $usedPct
        Status  = if ($usedPct -ge 90) { "CRITIQUE" } elseif ($usedPct -ge 80) { "ATTENTION" } else { "OK" }
    }
}

$topRamProcs = Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 8 | ForEach-Object {
    [PSCustomObject]@{
        Name   = $_.ProcessName
        Id     = $_.Id
        RAM_MB = [math]::Round($_.WorkingSet64 / 1MB, 1)
        CPU_s  = [math]::Round($_.CPU, 1)
    }
}

$stoppedAutoServices = Get-CimInstance Win32_Service -Filter "StartMode='Auto' AND State!='Running'" |
    Where-Object { $_.Name -notin @('edgeupdate','gupdate','MapsBroker','sppsvc','tiledatamodelsvc','WbioSrvc','ShellHWDetection','TrustedInstaller','PimIndexMaintenanceSvc','UnistoreSvc','UserDataSvc') } |
    Select-Object -First 10 Name, DisplayName, State, ExitCode

$since = (Get-Date).AddHours(-24)
$sysErrors = Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2; StartTime=$since} -MaxEvents 10 |
    Select-Object TimeCreated, Id, ProviderName, @{N='Message';E={($_.Message -split "`r?`n")[0]}}

$appErrors = Get-WinEvent -FilterHashtable @{LogName='Application'; Level=1,2; StartTime=$since} -MaxEvents 10 |
    Select-Object TimeCreated, Id, ProviderName, @{N='Message';E={($_.Message -split "`r?`n")[0]}}

$tempFolderSizeMB = [math]::Round(((Get-ChildItem -Path $env:TEMP -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB), 1)

$startupApps = Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location

$report = [PSCustomObject]@{
    Timestamp        = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Hostname         = $env:COMPUTERNAME
    IsAdmin          = $isAdmin
    OS               = "$($os.Caption) ($($os.Version) Build $($os.BuildNumber))"
    UptimeDays       = [math]::Round($uptimeSpan.TotalDays, 1)
    UptimeText       = "$($uptimeSpan.Days)j $($uptimeSpan.Hours)h $($uptimeSpan.Minutes)m"
    CPU              = [PSCustomObject]@{
        Name        = $cpu.Name
        Cores       = $cpu.NumberOfCores
        Logical     = $cpu.NumberOfLogicalProcessors
        LoadPercent = $cpu.LoadPercentage
    }
    RAM              = [PSCustomObject]@{
        TotalGB = $totalRamGB
        UsedGB  = $usedRamGB
        FreeGB  = $freeRamGB
        UsedPct = $ramPct
        Status  = if ($ramPct -ge 90) { "CRITIQUE" } elseif ($ramPct -ge 80) { "ATTENTION" } else { "OK" }
    }
    Disks            = $disks
    TempSizeMB       = $tempFolderSizeMB
    TopProcessesRAM  = $topRamProcs
    StoppedAutoSvcs  = $stoppedAutoServices
    SystemErrors24h  = $sysErrors
    AppErrors24h     = $appErrors
    StartupItemsCount= @($startupApps).Count
    StartupItems     = $startupApps
}

$report | ConvertTo-Json -Depth 4
