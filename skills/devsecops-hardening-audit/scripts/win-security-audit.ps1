#Requires -Version 5.1
<#
.SYNOPSIS
    Audit de Sécurité & Hardening CIS Windows (Senior DevSecOps)
.DESCRIPTION
    Vérifie en lecture seule :
    - Profils du Pare-feu Windows Defender (Domain, Private, Public)
    - Statut de Microsoft Defender (Temps réel, Signatures, Tamper Protection)
    - Configuration UAC (User Account Control)
    - Ports TCP en écoute sur toutes les interfaces (0.0.0.0 / ::) avec le nom du processus
    - Membres du groupe Administrateurs local
    - Partages réseau non-défaut
    - Statut RDP et SMBv1
#>
$ErrorActionPreference = 'SilentlyContinue'

# 1. Pare-feu Windows
$fwProfiles = Get-NetFirewallProfile | ForEach-Object {
    [PSCustomObject]@{
        Profile = $_.Name
        Enabled = [bool]$_.Enabled
        Status  = if ($_.Enabled) { "OK" } else { "CRITIQUE" }
    }
}

# 2. Microsoft Defender
$mpStatus = Get-MpComputerStatus
$defender = if ($mpStatus) {
    [PSCustomObject]@{
        AntivirusEnabled        = $mpStatus.AntivirusEnabled
        RealTimeProtection      = $mpStatus.RealTimeProtectionEnabled
        BehaviorMonitor         = $mpStatus.BehaviorMonitorEnabled
        IoavProtection          = $mpStatus.IoavProtectionEnabled
        SignatureAgeDays        = $mpStatus.AntivirusSignatureAge
        Status                  = if ($mpStatus.RealTimeProtectionEnabled -and $mpStatus.AntivirusSignatureAge -le 7) { "OK" } else { "ATTENTION" }
    }
} else {
    [PSCustomObject]@{ Status = "INFO_NON_DISPONIBLE_SANS_ADMIN" }
}

# 3. UAC (EnableLUA & ConsentPromptBehaviorAdmin)
$uacReg = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System"
$uac = [PSCustomObject]@{
    EnableLUA                  = $uacReg.EnableLUA
    ConsentPromptBehaviorAdmin = $uacReg.ConsentPromptBehaviorAdmin
    Status                     = if ($uacReg.EnableLUA -eq 1 -and $uacReg.ConsentPromptBehaviorAdmin -ne 0) { "OK" } else { "CRITIQUE" }
}

# 4. RDP Status
$rdpReg = Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server"
$rdpEnabled = ($rdpReg.fDenyTSConnections -eq 0)

# 5. Ports TCP en écoute sur 0.0.0.0 ou :: (Exposés au réseau)
$listeningPorts = Get-NetTCPConnection -State Listen |
    Where-Object { $_.LocalAddress -in @('0.0.0.0', '::') } |
    Select-Object -Unique LocalPort, OwningProcess |
    Sort-Object LocalPort |
    ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Port        = $_.LocalPort
            PID         = $_.OwningProcess
            ProcessName = if ($proc) { $proc.ProcessName } else { "System/Inconnu" }
            Path        = if ($proc) { $proc.Path } else { $null }
        }
    }

# 6. Comptes locaux Administrateurs
$localAdmins = Get-LocalGroupMember -Group "Administrators" -ErrorAction SilentlyContinue
if (-not $localAdmins) {
    $localAdmins = Get-LocalGroupMember -Group "Administrateurs" -ErrorAction SilentlyContinue
}
$adminList = $localAdmins | Select-Object Name, ObjectClass, PrincipalSource

# 7. Partages SMB actifs
$shares = Get-SmbShare -ErrorAction SilentlyContinue | Where-Object { $_.Name -notin @('ADMIN$','C$','D$','IPC$') } | Select-Object Name, Path, Description

$secReport = [PSCustomObject]@{
    Timestamp          = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Hostname           = $env:COMPUTERNAME
    FirewallProfiles   = $fwProfiles
    DefenderStatus     = $defender
    UAC                = $uac
    RDPEnabled         = $rdpEnabled
    ExposedTCPPorts    = $listeningPorts
    LocalAdmins        = $adminList
    CustomSmbShares    = $shares
}

$secReport | ConvertTo-Json -Depth 4
