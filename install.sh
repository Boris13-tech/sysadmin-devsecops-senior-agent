#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_TARGET="$HOME/.gemini/config/plugins/sysadmin-devsecops"
GLOBAL_RULES="$HOME/.gemini/config/AGENTS.md"

echo "[1/3] Création du répertoire du plugin : $PLUGIN_TARGET"
mkdir -p "$PLUGIN_TARGET"

echo "[2/3] Copie des fichiers du plugin (agents, rules, skills, assets)..."
cp -rf "$SCRIPT_DIR/plugin.json" "$SCRIPT_DIR/README.md" "$SCRIPT_DIR/agents" "$SCRIPT_DIR/assets" "$SCRIPT_DIR/rules" "$SCRIPT_DIR/skills" "$PLUGIN_TARGET/"
chmod +x "$PLUGIN_TARGET/skills/linux-sysadmin-senior/scripts/"*.sh

echo "[3/3] Activation des règles globales Senior SysAdmin & DevSecOps..."
cp -f "$SCRIPT_DIR/rules/AGENTS.md" "$GLOBAL_RULES"

echo "Installation terminée avec succès ! Redémarrez Antigravity pour charger le plugin complet."
