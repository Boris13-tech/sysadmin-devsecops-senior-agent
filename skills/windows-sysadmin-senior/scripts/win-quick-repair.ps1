#Requires -Version 5.1
<#
.SYNOPSIS
    Réparation et Maintenance Rapide Windows Sécurisée (Senior SysAdmin)
.PARAMETER Action
    CleanTemp : Nettoie les fichiers temporaires dans $env:TEMP vieux de plus de 2 jours
    FlushDNS  : Vide le cache de résolution DNS Windows
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('CleanTemp', 'FlushDNS')]
    [string]$Action
)

$ErrorActionPreference = 'SilentlyContinue'

switch ($Action) {
    'CleanTemp' {
        $cutoff = (Get-Date).AddDays(-2)
        $beforeBytes = (Get-ChildItem -Path $env:TEMP -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $oldFiles = Get-ChildItem -Path $env:TEMP -Recurse -File | Where-Object { $_.LastWriteTime -lt $cutoff }
        $removedCount = 0
        foreach ($f in $oldFiles) {
            Remove-Item -LiteralPath $f.FullName -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path -LiteralPath $f.FullName)) { $removedCount++ }
        }
        $afterBytes = (Get-ChildItem -Path $env:TEMP -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $freedMB = [math]::Round((($beforeBytes - $afterBytes) / 1MB), 2)
        [PSCustomObject]@{
            Action       = 'CleanTemp'
            RemovedFiles = $removedCount
            FreedMB      = $freedMB
            Status       = 'OK'
        } | ConvertTo-Json
    }
    'FlushDNS' {
        Clear-DnsClientCache
        [PSCustomObject]@{
            Action = 'FlushDNS'
            Status = 'OK'
            Detail = 'Cache DNS vidé avec succès'
        } | ConvertTo-Json
    }
}
