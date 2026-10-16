#Requires -Version 5.1
<#
.SYNOPSIS
    Local Interactive UI/UX Server for Senior SysAdmin & DevSecOps (Zero Dependency)
.DESCRIPTION
    Starts a local Web server on http://127.0.0.1:8765, opens the dashboard in the browser,
    and connects 1-click buttons to the D.S.A.V. PowerShell scripts.
#>
param(
    [int]$Port = 8765,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Continue'
$rootDir    = Split-Path -Parent $PSScriptRoot
$docsDir    = Join-Path $rootDir "docs"
$winScripts = Join-Path $rootDir "skills\windows-sysadmin-senior\scripts"
$secScripts = Join-Path $rootDir "skills\devsecops-hardening-audit\scripts"

$url = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  SENIOR SYSADMIN & DEVSECOPS - INTERFACE GRAPHIQUE INTERACTIVE" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  Local URL : $url" -ForegroundColor Yellow
Write-Host "  Keep this window open while using the tool."
Write-Host "  Press Ctrl+C to stop the server."
Write-Host "==================================================================" -ForegroundColor Cyan

if (-not $NoBrowser) {
    Start-Process $url
}

function Send-HttpResponse {
    param(
        $Context,
        [string]$Body,
        [string]$ContentType = "application/json; charset=utf-8",
        [int]$StatusCode = 200
    )
    $res = $Context.Response
    $res.StatusCode = $StatusCode
    $res.ContentType = $ContentType
    $res.Headers.Add("Access-Control-Allow-Origin", "*")
    $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $path = $req.Url.LocalPath

        if ($req.HttpMethod -eq "OPTIONS") {
            Send-HttpResponse -Context $context -Body "" -ContentType "text/plain"
            continue
        }

        switch ($path) {
            "/api/status" {
                $statusJson = @{ status = "ok"; mode = "local-live"; host = $env:COMPUTERNAME } | ConvertTo-Json
                Send-HttpResponse -Context $context -Body $statusJson
            }
            "/api/audit/health" {
                $script = Join-Path $winScripts "win-health-audit.ps1"
                $out = & powershell -NoProfile -ExecutionPolicy Bypass -File $script | Out-String
                Send-HttpResponse -Context $context -Body $out
            }
            "/api/audit/security" {
                $script = Join-Path $secScripts "win-security-audit.ps1"
                $out = & powershell -NoProfile -ExecutionPolicy Bypass -File $script | Out-String
                Send-HttpResponse -Context $context -Body $out
            }
            "/api/action/clean-temp" {
                $script = Join-Path $winScripts "win-quick-repair.ps1"
                $out = & powershell -NoProfile -ExecutionPolicy Bypass -File $script -Action CleanTemp | Out-String
                Send-HttpResponse -Context $context -Body $out
            }
            "/api/action/flush-dns" {
                $script = Join-Path $winScripts "win-quick-repair.ps1"
                $out = & powershell -NoProfile -ExecutionPolicy Bypass -File $script -Action FlushDNS | Out-String
                Send-HttpResponse -Context $context -Body $out
            }
            "/api/action/optimize-startup" {
                $script = Join-Path $winScripts "win-startup-optimize.ps1"
                $out = & powershell -NoProfile -ExecutionPolicy Bypass -File $script | Out-String
                Send-HttpResponse -Context $context -Body $out
            }
            "/api/action/restore-startup" {
                $script = Join-Path $winScripts "win-startup-optimize.ps1"
                $out = & powershell -NoProfile -ExecutionPolicy Bypass -File $script -RestoreLatest | Out-String
                Send-HttpResponse -Context $context -Body $out
            }
            default {
                $relPath = if ($path -eq "/" -or [string]::IsNullOrEmpty($path)) { "index.html" } else { $path.TrimStart('/') }
                $filePath = Join-Path $docsDir $relPath
                if (Test-Path -LiteralPath $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $mime = switch ($ext) {
                        ".html" { "text/html; charset=utf-8" }
                        ".css"  { "text/css; charset=utf-8" }
                        ".js"   { "application/javascript; charset=utf-8" }
                        ".svg"  { "image/svg+xml" }
                        ".json" { "application/json; charset=utf-8" }
                        default { "text/plain; charset=utf-8" }
                    }
                    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
                    Send-HttpResponse -Context $context -Body $content -ContentType $mime
                } else {
                    Send-HttpResponse -Context $context -Body '{"error":"Not Found"}' -StatusCode 404
                }
            }
        }
    }
} finally {
    $listener.Stop()
}
