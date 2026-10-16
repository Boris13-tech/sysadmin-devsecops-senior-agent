#!/usr/bin/env bash
# ==============================================================================
# Audit de Sécurité Conteneurs (Docker & Kubernetes - DevSecOps Senior)
# Auteur : Boris Owandja (@Boris13-tech)
# ==============================================================================
set -uo pipefail

echo "=================================================================="
echo "  AUDIT DEVSECOPS : CONTENEURS DOCKER & KUBERNETES"
echo "=================================================================="
echo "Date : $(date -Is)"
echo ""

# 1. Présence du démon Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker n'est pas installé ou n'est pas dans le PATH."
else
  echo "[1/4] Audit du Démon Docker..."
  if ! docker info >/dev/null 2>&1; then
    echo "  - Le démon Docker ne semble pas actif ou nécessite des privilèges root/sudo."
  else
    ROOTLESS=$(docker info 2>/dev/null | grep -i "rootless" || echo "Mode rootless non activé")
    echo "  - Statut : Actif"
    echo "  - Configuration : $ROOTLESS"
    echo ""

    echo "[2/4] Audit des Conteneurs en cours d'exécution..."
    CONTAINERS=$(docker ps -q)
    if [ -z "$CONTAINERS" ]; then
      echo "  - Aucun conteneur en cours d'exécution."
    else
      echo "  - Conteneurs actifs trouvés : $(echo "$CONTAINERS" | wc -l)"
      echo "  - Vérification des privilèges et des montages sensibles :"
      docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
      
      # Recherche de conteneurs privilégiés
      PRIV_CONTAINERS=$(docker ps -q | xargs -r docker inspect --format '{{.Name}}: Privileged={{.HostConfig.Privileged}}' | grep "true" || true)
      if [ -n "$PRIV_CONTAINERS" ]; then
        echo "  - ALERTE SÉCURITÉ : Conteneurs en mode Privilégié détectés :"
        echo "$PRIV_CONTAINERS"
      else
        echo "  - Aucun conteneur en mode Privilégié (Bonne pratique)."
      fi
    fi
    echo ""

    echo "[3/4] Nettoyage et Volumes Dangling..."
    DANGLING_VOL=$(docker volume ls -qf dangling=true | wc -l || echo "0")
    DANGLING_IMG=$(docker images -qf dangling=true | wc -l || echo "0")
    echo "  - Images orphelines (dangling) : $DANGLING_IMG"
    echo "  - Volumes orphelins (dangling) : $DANGLING_VOL"
  fi
fi
echo ""

# 4. Kubernetes (kubectl)
echo "[4/4] Détection de l'environnement Kubernetes..."
if command -v kubectl >/dev/null 2>&1; then
  CURRENT_CTX=$(kubectl config current-context 2>/dev/null || echo "Aucun contexte actif")
  echo "  - kubectl installé. Contexte courant : $CURRENT_CTX"
else
  echo "  - kubectl n'est pas installé sur cette machine."
fi
echo "=================================================================="
