---
name: linux-sysadmin-senior
description: >-
  Administration Système Linux Senior (Debian, Ubuntu, RHEL, Rocky, Arch, WSL2, 10+ ans d'exp.).
  Utiliser pour gérer les serveurs/VM Linux, systemd, journalctl, LVM/ZFS/disques,
  réseau (iproute2, ss, netplan, WireGuard, SSH), permissions/SELinux/AppArmor,
  tuning noyau (sysctl) et diagnostic de performance Linux.
---

# Administration Système Linux Senior (10+ ans d'expérience)

Ce skill rassemble la méthodologie et les scripts d'un Administrateur Système Linux Senior pour diagnostiquer, administrer, optimiser et réparer tout système Linux (serveur distant, VM ou instance WSL locale).

## 1. Audit Complet de Santé Linux (Bash)

Sur une machine Linux ou dans une instance WSL (`wsl -e bash ...`), exécute le script d'audit complet :

```bash
bash "$HOME/.gemini/config/plugins/sysadmin-devsecops/skills/linux-sysadmin-senior/scripts/linux-health-audit.sh"
```

## 2. Méthodologie USE (Utilization, Saturation, Errors) en 60 Secondes (Brendan Gregg)

Lorsqu'un serveur Linux est lent ou instable, exécute cette séquence de diagnostic :
1. `uptime` : Charge moyenne (Load Average 1m, 5m, 15m) vs nombre de vCPU (`nproc`).
2. `dmesg -T | tail -n 25` : Recherche d'erreurs matérielles, I/O ou **OOM Killer** (`Out of memory: Killed process`).
3. `free -m` : Mémoire disponible (`available`), utilisation du Swap.
4. `df -hT` & `df -i` : Espace disque ET saturation des **inodes** (souvent oubliée par les juniors quand un disque affiche de l'espace libre mais refuse d'écrire !).
5. `systemctl --failed` : Unités `systemd` en échec.
6. `journalctl -p 3 -xb --no-pager | tail -n 30` : Dernières erreurs critiques du système.
7. `ss -tulnp` : Ports TCP/UDP en écoute et processus associés.

## 3. Règles d'Or Linux Senior
- **Sauvegarde avant édition** : Toujours `cp -a /etc/fichier.conf /etc/fichier.conf.bak-$(date +%F_%H%M%S)`.
- **Validation syntaxique** avant reload :
  - SSH : `sshd -t` avant `systemctl reload sshd`
  - Nginx : `nginx -t` avant `systemctl reload nginx`
  - Sudoers : toujours `visudo -c`
  - Fstab : toujours `findmnt --verify` ou `mount -a` avant de redémarrer ! Un `/etc/fstab` invalide bloque le boot du serveur en *emergency mode*.
