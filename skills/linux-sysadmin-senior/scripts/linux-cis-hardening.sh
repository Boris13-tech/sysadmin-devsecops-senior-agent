#!/usr/bin/env bash
# ==============================================================================
# Audit et Durcissement Linux (CIS Benchmark Essentials - Senior DevSecOps)
# Méthode D.S.A.V. (Diagnostic, Sauvegarde, Action, Vérification)
# Auteur : Boris Owandja (@Boris13-tech)
# ==============================================================================
set -euo pipefail

echo "=================================================================="
echo "  AUDIT DE DURCISSEMENT LINUX (CIS BENCHMARKS & DEVSECOPS)"
echo "=================================================================="
echo "Date : $(date -Is)"
echo "Hôte : $(hostname)"
echo ""

# 1. Vérification SSH Hardening
echo "[1/5] Audit de la configuration SSH (/etc/ssh/sshd_config)..."
if [ -f /etc/ssh/sshd_config ]; then
  ROOT_LOGIN=$(grep -Ei '^\s*PermitRootLogin' /etc/ssh/sshd_config || echo "PermitRootLogin non spécifié (défaut)")
  PASS_AUTH=$(grep -Ei '^\s*PasswordAuthentication' /etc/ssh/sshd_config || echo "PasswordAuthentication non spécifié")
  X11_FWD=$(grep -Ei '^\s*X11Forwarding' /etc/ssh/sshd_config || echo "X11Forwarding non spécifié")
  MAX_TRIES=$(grep -Ei '^\s*MaxAuthTries' /etc/ssh/sshd_config || echo "MaxAuthTries non spécifié")
  echo "  - Root Login : $ROOT_LOGIN"
  echo "  - Password Auth : $PASS_AUTH"
  echo "  - X11 Forwarding : $X11_FWD"
  echo "  - Max Auth Tries : $MAX_TRIES"
else
  echo "  - Fichier sshd_config introuvable ou serveur SSH non installé."
fi
echo ""

# 2. Paramètres Noyau / sysctl (Sécurité Réseau)
echo "[2/5] Audit des paramètres réseau du noyau (sysctl)..."
check_sysctl() {
  local param="$1"
  local val
  val=$(sysctl -n "$param" 2>/dev/null || echo "N/A")
  echo "  - $param = $val"
}
check_sysctl "net.ipv4.ip_forward"
check_sysctl "net.ipv4.conf.all.accept_source_route"
check_sysctl "net.ipv4.conf.all.accept_redirects"
check_sysctl "net.ipv4.tcp_syncookies"
check_sysctl "net.ipv4.conf.all.rp_filter"
check_sysctl "fs.protected_hardlinks"
check_sysctl "fs.protected_symlinks"
echo ""

# 3. Comptes avec UID 0 et Sudoers
echo "[3/5] Audit des privilèges et comptes super-utilisateurs..."
UID_ZERO=$(awk -F: '($3 == "0") {print $1}' /etc/passwd | tr '\n' ' ')
echo "  - Comptes avec UID 0 : $UID_ZERO"
if [ "$UID_ZERO" = "root " ] || [ "$UID_ZERO" = "root" ]; then
  echo "  - Statut : OK (Seul root possède l'UID 0)"
else
  echo "  - ALERTE : Compte non-root avec UID 0 détecté !"
fi
echo ""

# 4. Fichiers avec permissions SUID/SGID inhabituelles
echo "[4/5] Recherche de binaires avec permissions SUID dans /usr/bin..."
SUID_COUNT=$(find /usr/bin -perm -4000 2>/dev/null | wc -l || echo "0")
echo "  - Nombre de binaires SUID trouvés dans /usr/bin : $SUID_COUNT"
echo ""

# 5. État du Pare-feu (UFW / nftables / iptables)
echo "[5/5] État du pare-feu Linux..."
if command -v ufw >/dev/null 2>&1; then
  echo "  - UFW : $(ufw status | head -n 1)"
elif command -v nft >/dev/null 2>&1; then
  echo "  - nftables présent"
elif command -v iptables >/dev/null 2>&1; then
  echo "  - iptables présent : $(iptables -L -n 2>/dev/null | grep -c 'Chain') chaînes actives"
else
  echo "  - Aucun pare-feu standard détecté !"
fi
echo "=================================================================="
echo "Fin de l'audit de durcissement."
