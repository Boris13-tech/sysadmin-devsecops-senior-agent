---
name: windows-sysadmin-senior
description: >-
  Administration Système Windows Senior (Client & Server, 10+ ans d'exp.).
  Utiliser pour diagnostiquer un PC Windows lent, analyser CPU/RAM/Disque,
  inspecter les journaux d'événements (Event Logs), gérer les services, Active Directory/GPO,
  le réseau, WSL2, réparer Windows (DISM/SFC) ou nettoyer le système en toute sécurité.
---

# Administration Système Windows Senior (10+ ans d'expérience)

Ce skill fournit les procédures et scripts d'audit/réparation d'un Administrateur Système Windows Senior, conçus pour être exécutés automatiquement pour l'utilisateur et expliqués simplement.

## 1. Audit Complet de Santé Windows (Exécution Automatique)

Pour réaliser un bilan complet de la machine Windows (OS, Uptime, CPU, RAM, Disques, Services critiques arrêtés, Erreurs récentes dans l'Observateur d'événements, Réseau et Démarrage), exécute le script fourni :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.gemini\config\plugins\sysadmin-devsecops\skills\windows-sysadmin-senior\scripts\win-health-audit.ps1"
```

## 2. Procédures de Dépannage Senior (Runbooks)

### A. PC Lent / Surcharge CPU ou RAM
1. Identifier le top 10 des processus consommateurs de CPU et de RAM :
   ```powershell
   Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, @{N='CPU_s';E={[math]::Round($_.CPU,1)}} | Format-Table -AutoSize
   ```
2. Vérifier la pression mémoire et le fichier d'échange (Pagefile) via `Win32_OperatingSystem`.
3. Vérifier les applications lancées automatiquement au démarrage (`Get-CimInstance Win32_StartupCommand`).

### B. Disque Plein / Nettoyage Sécurisé
1. Vérifier l'espace libre sur toutes les partitions (`Get-PSDrive -PSProvider FileSystem`).
2. Analyser la taille des dossiers temporaires (`$env:TEMP`, `C:\Windows\Temp`, `C:\Windows\SoftwareDistribution\Download`) sans jamais toucher aux fichiers personnels de l'utilisateur (`Documents`, `Desktop`, `Downloads` sauf demande explicite).
3. Pour nettoyer les fichiers temporaires de plus de 3 jours en toute sécurité, exécuter :
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.gemini\config\plugins\sysadmin-devsecops\skills\windows-sysadmin-senior\scripts\win-quick-repair.ps1" -Action CleanTemp
   ```

### C. Corruption Système / Crashs / Écrans Bleus (BSOD)
1. Inspecter les événements critiques (Kernel-Power ID 41, BugCheck ID 1001, Application Error ID 1000) des dernières 48h.
2. Si des fichiers système sont corrompus (nécessite les droits Administrateur) :
   - `DISM.exe /Online /Cleanup-Image /RestoreHealth`
   - `sfc /scannow`

### D. Panne Réseau / DNS / Internet Lent
1. Vérifier les adaptateurs actifs (`Get-NetAdapter | Where-Object Status -eq 'Up'`), la passerelle par défaut et les serveurs DNS (`Get-DnsClientServerAddress`).
2. Tester la connectivité couche par couche :
   - Passerelle locale (Ping IP passerelle)
   - Internet IP brute (`Test-NetConnection 1.1.1.1 -InformationLevel Quiet`)
   - Résolution DNS (`Resolve-DnsName google.com`)
3. En cas de cache DNS corrompu : `Clear-DnsClientCache` (`ipconfig /flushdns`).
