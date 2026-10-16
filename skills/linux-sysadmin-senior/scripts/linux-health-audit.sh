#!/usr/bin/env bash
# Audit Complet de Santé & Sécurité Linux (Senior SysAdmin 10+ YoE)
set -uo pipefail

echo "================================================================"
echo "   AUDIT DE SANTE SYSTEME LINUX (SENIOR SYSADMIN 10+ YOE)"
echo "================================================================"
echo "Date       : $(date -Is)"
echo "Hostname   : $(hostname)"
echo "OS / Kernel: $(grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '\"') | $(uname -r)"
echo "Uptime/Load: $(uptime)"
echo "vCPUs      : $(nproc 2>/dev/null || echo 'N/A')"
echo ""
echo "--- MEMOIRE (RAM & SWAP) ---"
free -h
echo ""
echo "--- ESPACE DISQUE & INODES ---"
df -hT -x tmpfs -x devtmpfs 2>/dev/null || df -h
echo ""
echo "--- SERVICES SYSTEMD EN ECHEC ---"
systemctl --failed --no-pager 2>/dev/null || echo "systemd non actif dans cet environnement"
echo ""
echo "--- TOP 5 PROCESSUS (RAM) ---"
ps aux --sort=-%mem | head -n 6
echo ""
echo "--- PORTS EN ECOUTE (TCP/UDP) ---"
ss -tuln 2>/dev/null | head -n 20
echo ""
echo "--- DERNIERES ERREURS CRITIQUES (JOURNALCTL / DMESG) ---"
journalctl -p 3 -n 10 --no-pager 2>/dev/null || dmesg -T 2>/dev/null | tail -n 10 || echo "Aucun log critique accessible"
