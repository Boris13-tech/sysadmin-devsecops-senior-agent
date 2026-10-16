<div align="center">
  <img src="assets/logo.svg" alt="Senior SysAdmin & DevSecOps Agent Logo" width="110" />
  <h1>🛡️ Senior SysAdmin (Windows & Linux 10+ YoE) & DevSecOps</h1>
  <p><strong>Outil Interactif Grand Public (UI/UX) + Plugin & Sous-Agent Autonome pour Google Antigravity</strong></p>
  <p><em>« Expert sous le capot, Simple à l'écran » — utilisable par tout le monde en 1 clic, sans aucune compétence technique requise</em></p>

  <p>
    <a href="https://boris13-tech.github.io/sysadmin-devsecops-senior-agent/">
      <img src="https://img.shields.io/badge/%F0%9F%8C%90_Ouvrir_l'Application_Web_en_Ligne-Live_UI%2FUX-0284c7?style=for-the-badge" alt="Ouvrir l'application Web en ligne" />
    </a>
    &nbsp;
    <a href="https://github.com/Boris13-tech/sysadmin-devsecops-senior-agent/releases/latest/download/SysAdmin-DevSecOps-Senior-Tool-v1.1.0.zip">
      <img src="https://img.shields.io/badge/%F0%9F%93%A5_T%C3%A9l%C3%A9charger_l'Outil_PC_(.ZIP)-Double--Clic_Windows-10b981?style=for-the-badge" alt="Télécharger l'outil PC (.ZIP)" />
    </a>
  </p>
</div>

---

## 🌟 2 Façons Très Simples d'Utiliser l'Outil

### 1️⃣ Découvrir en Ligne (Sans rien installer sur votre PC)
👉 **[Ouvrir le Poste de Contrôle en ligne (GitHub Pages)](https://boris13-tech.github.io/sysadmin-devsecops-senior-agent/)**
- Visualisez l'état de santé type avec explications douces et rassurantes.
- Testez les scénarios du **« Docteur PC »** (*"Mon PC rame"*, *"Disque presque plein"*, *"Vérifier ma sécurité"*).
- Basculez entre la **Vue Simple (Conseils clairs)** et la **Vue Détaillée (Technique)**.

### 2️⃣ Lancer sur votre Propre PC en 2 Clics
👉 **[Télécharger le pack gratuit `SysAdmin-DevSecOps-Senior-Tool-v1.1.0.zip`](https://github.com/Boris13-tech/sysadmin-devsecops-senior-agent/releases/latest/download/SysAdmin-DevSecOps-Senior-Tool-v1.1.0.zip)**
1. **Extrayez le fichier `.ZIP`** téléchargé (clic-droit > *Extraire tout*).
2. **Double-cliquez sur `DEMARRER-ICI.bat`** (ou lancez `lancer-sysadmin-ui.sh` sous Linux).
3. Votre navigateur s'ouvre automatiquement avec le voyant vert **Connecté en direct à votre ordinateur** :
   - Nettoyez les fichiers temporaires inutiles d'un simple clic.
   - Allégez le démarrage pour que votre PC s'allume plus vite (sauvegarde de secours créée automatiquement).
   - Débloquez votre connexion internet en cas de souci.
   - *(Optionnel)* Double-cliquez sur **`Creer-Raccourci-Bureau.bat`** pour installer une icône sur votre Bureau Windows !

---

## 🏗️ Architecture & Protocole Senior D.S.A.V.

```mermaid
flowchart LR
    U["👤 Utilisateur Lambda (0 ligne de code)"] -->|"Double-clic sur Lancer-SysAdmin-UI.bat ou Web UI"| UI["🖥️ Interface Interactive UI/UX (docs/)"]
    UI -->|"API Locale 127.0.0.1:8765"| S["⚡ Serveur Local PowerShell (Zéro Dépendance)"]
    S --> D["1️⃣ Diagnostic Lecture Seule (USE)"]
    D --> B["2️⃣ Sauvegarde Automatique (.reg / .bak)"]
    B --> A["3️⃣ Action en 1 Clic"]
    A --> V["4️⃣ Vérification & Bilan 🟢🟡🔴"]
```

---

## 📦 Structure Complète du Dépôt

```text
sysadmin-devsecops-senior-agent/
├── Lancer-SysAdmin-UI.bat                          # 🖱️ Double-clic Windows : lance l'interface graphique connectée au PC
├── lancer-sysadmin-ui.sh                           # 🐧 Lanceur de l'interface graphique pour Linux / macOS
├── docs/                                           # 🌐 Application Web Interactive (GitHub Pages & UI Locale)
│   ├── index.html                                  # Tableau de bord visuel & Assistant « Docteur Système »
│   ├── styles.css                                  # Design moderne Dark Glassmorphism
│   └── app.js                                      # Logique interactive (Mode En Ligne + Mode Connecté au PC)
├── server/
│   └── start-ui-server.ps1                         # Serveur HTTP local natif PowerShell (Zéro dépendance à installer)
├── plugin.json                                     # Manifeste du plugin Google Antigravity
├── install.ps1 / install.sh                        # Installateurs 1-clic du plugin pour Google Antigravity
├── agents/
│   └── sysadmin_devsecops_senior.md                # Sous-agent spécialisé Senior SysAdmin & DevSecOps
├── rules/
│   └── AGENTS.md                                   # Règles d'or D.S.A.V. & pédagogie sans jargon
└── skills/
    ├── windows-sysadmin-senior/                    # Audit santé, nettoyage Temp/DNS, optimisation démarrage + Rollback
    ├── linux-sysadmin-senior/                      # Audit Linux/WSL (Méthode USE : CPU, RAM, Disques, Inodes, systemd)
    └── devsecops-hardening-audit/                  # Audit sécurité CIS (Pare-feu, Defender, UAC, RDP, Ports exposés)
```

---

## 🤖 Utilisation comme Plugin dans Google Antigravity

Si vous utilisez **Google Antigravity**, vous pouvez également installer cet agent directement dans votre IDE :

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

---

## 📜 Licence

Distribué sous licence **MIT**. Créé pour **Boris Owandja (@Boris13-tech)**.
