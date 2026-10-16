---
name: devsecops-hardening-audit
description: >-
  Audit de sécurité, Hardening CIS Benchmarks (Windows & Linux), DevSecOps,
  Pare-feu, Analyse de ports/processus suspects (avec REA), Conteneurs (Docker/K8s),
  Ansible, Terraform et sécurisation de pipelines CI/CD.
---

# DevSecOps, Cybersécurité Défensive & Hardening Senior (10+ ans d'exp.)

Ce skill équipe l'agent des procédures d'audit de sécurité, de durcissement système (Hardening CIS Benchmarks), d'inspection forensique et de bonnes pratiques DevSecOps (Docker, Kubernetes, Terraform, Ansible, CI/CD).

## 1. Audit de Sécurité & Surface d'Attaque Windows (Exécution Automatique)

Pour auditer immédiatement la posture de sécurité d'une machine Windows (Pare-feu Windows Defender, Antivirus Defender, UAC, SMBv1, RDP, Ports exposés sur `0.0.0.0`, Comptes Administrateurs locaux, Partages réseau et Persistance), exécute :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.gemini\config\plugins\sysadmin-devsecops\skills\devsecops-hardening-audit\scripts\win-security-audit.ps1"
```

## 2. Inspection Forensique & Analyse de Processus Suspects avec REA
Lorsqu'un port inhabituel est ouvert ou qu'un processus suspect tourne :
1. Récupérer le chemin complet du binaire et sa signature Authenticode :
   ```powershell
   Get-Process -Id <PID> | Select-Object Name, Id, Path, Company, ProductVersion
   Get-AuthenticodeSignature -FilePath "<Path>"
   ```
2. Si le binaire n'est pas signé ou semble suspect, utiliser le skill **`reverse-engineer-anything`** (serveur MCP `rea`) pour analyser ses imports, ses chaînes de caractères et son comportement sans l'exécuter à nouveau.

## 3. Checklist DevSecOps (Conteneurs, IaC & CI/CD)
- **Docker** :
  - Toujours utiliser des builds multi-stages et des images minimales (`distroless`, `alpine`, versions épinglées avec digest ou tag précis, jamais `:latest` en prod).
  - Exécuter le conteneur avec un utilisateur non-root (`USER 10001:10001`), système de fichiers en lecture seule (`--read-only`) et suppression des capabilities Linux (`cap_drop: [ALL]`).
- **Kubernetes** :
  - Définir systématiquement `resources.requests` et `resources.limits` (CPU/Memory), `securityContext` (`runAsNonRoot: true`, `allowPrivilegeEscalation: false`), et isoler le trafic avec des `NetworkPolicy`.
- **CI/CD & Secrets** :
  - Ne jamais stocker de clé API, mot de passe ou clé privée dans Git (`.env` dans `.gitignore`).
  - Épingler les GitHub Actions par SHA complet (`uses: actions/checkout@<sha>`) et restreindre les permissions du `GITHUB_TOKEN` (`permissions: contents: read`).
