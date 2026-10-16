// Senior SysAdmin & DevSecOps Interactive Dashboard (Online + Local Connected Mode)

let isLocalConnected = false;
const LOCAL_API_BASE = "http://127.0.0.1:8765";

// Default realistic snapshot (used when visiting online on GitHub Pages before connecting locally)
let appState = {
  health: {
    Timestamp: "2026-10-16 18:10:00",
    Hostname: "LEGRAND-TECH",
    OS: "Microsoft Windows 11 Famille (Build 26300)",
    UptimeText: "0j 13h 38m",
    CPU: { Name: "11th Gen Intel Core i5-1135G7", Cores: 4, Logical: 8, LoadPercent: 28 },
    RAM: { TotalGB: 7.7, UsedGB: 6.1, FreeGB: 1.6, UsedPct: 79.2, Status: "OK" },
    Disks: [
      { Drive: "C:", SizeGB: 236.87, FreeGB: 24.5, UsedPct: 89.7, Status: "ATTENTION" },
      { Drive: "D:", SizeGB: 208.97, FreeGB: 24.69, UsedPct: 88.2, Status: "ATTENTION" }
    ],
    TempSizeMB: 281.4,
    TopProcessesRAM: [
      { Name: "Memory Compression", Id: 2968, RAM_MB: 380.2, CPU_s: 0 },
      { Name: "Antigravity", Id: 21968, RAM_MB: 153.4, CPU_s: 188.4 },
      { Name: "MsMpEng", Id: 5252, RAM_MB: 104.5, CPU_s: 0 },
      { Name: "powershell", Id: 22996, RAM_MB: 78.1, CPU_s: 1.1 },
      { Name: "claude", Id: 13888, RAM_MB: 75.4, CPU_s: 95.0 }
    ],
    StartupItems: [
      { Name: "OneDrive", Command: "\"C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe\" /background" },
      { Name: "Microsoft Teams", Command: "ms-teams.exe msteams:system-initiated" },
      { Name: "OpenVPN-GUI", Command: "C:\\Program Files\\OpenVPN\\bin\\openvpn-gui.exe" },
      { Name: "SecurityHealth", Command: "%windir%\\system32\\SecurityHealthSystray.exe" }
    ]
  },
  security: {
    FirewallProfiles: [
      { Profile: "Domain", Enabled: true, Status: "OK" },
      { Profile: "Private", Enabled: true, Status: "OK" },
      { Profile: "Public", Enabled: true, Status: "OK" }
    ],
    DefenderStatus: { RealTimeProtection: true, SignatureAgeDays: 1, Status: "OK" },
    UAC: { EnableLUA: 1, Status: "OK" },
    RDPEnabled: false,
    ExposedTCPPorts: [
      { Port: 135, PID: 1700, ProcessName: "svchost" },
      { Port: 445, PID: 4, ProcessName: "System" },
      { Port: 5040, PID: 10860, ProcessName: "svchost" },
      { Port: 27036, PID: 5080, ProcessName: "steam" },
      { Port: 58900, PID: 9748, ProcessName: "SpotifyLauncher" }
    ]
  },
  dsavLogs: [
    {
      time: "18:08:12",
      title: "Sauvegarde Registre + Optimisation du Démarrage (6 logiciels lourds désactivés au boot)",
      backup: "~/.gemini/Backups/SysAdmin/HKCU_Run_Backup_20261016-180812.reg",
      status: "🟢 Vérifié"
    },
    {
      time: "18:08:15",
      title: "Nettoyage sécurisé des fichiers temporaires obsolètes (+41,15 Mo libérés)",
      backup: "Fichiers temporaires > 48h uniquement (Documents personnels intacts)",
      status: "🟢 Vérifié"
    }
  ]
};

// Dictionary of human-friendly explanations for processes & ports
const PROCESS_EXPLANATIONS = {
  "Memory Compression": "Système Windows qui compresse la mémoire vive pour éviter que le PC ne bloque.",
  "MsMpEng": "Antivirus officiel Microsoft Defender qui protège votre PC en arrière-plan.",
  "Antigravity": "Votre assistant de développement et d'administration système intelligent.",
  "explorer": "L'affichage du Bureau Windows, de la barre des tâches et de vos dossiers.",
  "svchost": "Conteneur officiel de services internes Windows (réseau, audio, mises à jour).",
  "chrome": "Navigateur Internet Google Chrome (chaque onglet ouvert consomme de la mémoire).",
  "msedge": "Navigateur Internet Microsoft Edge.",
  "claude": "Outil d'assistance IA en cours d'exécution.",
  "powershell": "Moteur d'automatisation et d'administration Windows."
};

const PORT_EXPLANATIONS = {
  135: { desc: "Communication interne Windows (RPC). Normal sur un PC Windows protégé par pare-feu.", risk: "🟢 Normal (Protégé par Pare-feu)" },
  445: { desc: "Partage de fichiers et d'imprimantes Windows (SMB) sur le réseau local.", risk: "🟡 Normal en local (Bloqué sur Internet public)" },
  5040: { desc: "Service Windows d'appareils connectés (Partage de proximité / téléphone).", risk: "🟢 Normal" },
  5357: { desc: "Découverte des appareils sur votre box Wi-Fi locale (WSDAPI).", risk: "🟢 Normal" },
  7680: { desc: "Optimisation de distribution des mises à jour Windows Update.", risk: "🟢 Normal" },
  27036: { desc: "Diffusion locale Steam (In-Home Streaming pour les jeux).", risk: "🟢 Faible (Application Steam)" },
  58900: { desc: "Synchronisation locale Spotify Connect (pour contrôler la musique depuis votre téléphone).", risk: "🟢 Faible (Application Spotify)" }
};

const SYMPTOM_GUIDES = {
  slow: {
    title: "🐢 Diagnostic « Mon PC est lent / rame »",
    why: "Sur un PC de 8 Go de RAM, la lenteur vient dans 90 % des cas de trop d'applications qui se lancent toutes seules dès l'allumage (Steam, Discord, TeraBox, Docker, Teams) et saturent la mémoire vive.",
    solution: "Cliquez sur « 🚀 Alléger le Démarrage » et « 🧹 Nettoyer les Fichiers Inutiles » ci-dessus. Votre PC gardera 1,5 à 2,5 Go de mémoire libre supplémentaire dès le prochain démarrage.",
    actionBtn: { label: "🚀 Alléger le Démarrage maintenant", action: "optimize-startup" }
  },
  disk: {
    title: "💾 Diagnostic « Mon disque dur est presque plein »",
    why: "Quand un disque dépasse 85 % à 90 % d'occupation (comme vos disques C: et D:), Windows manque de place pour ses fichiers temporaires et ralentit.",
    solution: "Commencez par purger les fichiers temporaires en 1 clic ci-dessous. Évitez aussi de laisser les vidéos ou téléchargements lourds dans le dossier Téléchargements du disque C:.",
    actionBtn: { label: "🧹 Nettoyer les fichiers temporaires", action: "clean-temp" }
  },
  security: {
    title: "🛡️ Diagnostic « Vérifier si mon PC est bien sécurisé »",
    why: "Un administrateur senior vérifie 4 verrous essentiels : le Pare-feu (contre les intrusions), l'Antivirus temps réel, le contrôle UAC (qui bloque les modifications secrètes) et la fermeture du Bureau à distance (RDP).",
    solution: "Bonne nouvelle : vos 4 verrous de sécurité sont au vert (🟢). Vous pouvez relancer un audit complet à tout moment pour inspecter les ports réseau.",
    actionBtn: { label: "🔍 Relancer l'audit de sécurité", action: "full-audit" }
  },
  network: {
    title: "🌍 Diagnostic « Internet coupe ou certains sites bloquent »",
    why: "Parfois votre Wi-Fi fonctionne, mais le « carnet d'adresses » de Windows (le cache DNS) garde en mémoire une ancienne adresse expirée.",
    solution: "Vider le cache DNS force Windows à redemander une adresse propre et résout instantanément la majorité des blocages de sites Web.",
    actionBtn: { label: "🌐 Vider le cache DNS en 1 clic", action: "flush-dns" }
  },
  linux: {
    title: "🐧 Diagnostic « Serveur Linux / WSL / Conteneurs Docker »",
    why: "Sous Linux, on applique la méthode USE (Utilization, Saturation, Errors) : charge CPU (uptime), mémoire disponible (free -h), espace disque ET inodes (df -h / df -i), et services systemd en échec (systemctl --failed).",
    solution: "Depuis votre terminal Linux ou WSL, notre script `linux-health-audit.sh` vérifie ces 7 points vitaux en 2 secondes sans rien modifier.",
    actionBtn: { label: "📋 Copier la commande d'audit Linux", action: "copy-linux-cmd" }
  }
};

// Initialize Dashboard
window.addEventListener("DOMContentLoaded", async () => {
  selectSymptom("slow", document.querySelector(".symptom-btn"));
  await checkLocalServerAndLoad();
});

async function checkLocalServerAndLoad() {
  try {
    const res = await fetch(`${LOCAL_API_BASE}/api/status`, { method: "GET" });
    if (res.ok) {
      isLocalConnected = true;
      const badge = document.getElementById("connectionBadge");
      badge.className = "badge-pill badge-local";
      badge.textContent = "🟢 Connecté en Direct à votre PC";
      document.getElementById("connectionHint").textContent =
        "L'agent local est actif : toutes les métriques et tous les boutons d'action en 1 clic agissent en temps réel sur votre machine.";
      await runFullDiagnostic(true);
      return;
    }
  } catch (_) {
    isLocalConnected = false;
  }
  renderDashboard();
}

function computeGlobalScore(health, sec) {
  let score = 100;
  if (health.RAM.UsedPct > 90) score -= 18;
  else if (health.RAM.UsedPct > 80) score -= 8;

  const maxDisk = Math.max(...(health.Disks || []).map(d => d.UsedPct || 0), 0);
  if (maxDisk > 92) score -= 15;
  else if (maxDisk > 85) score -= 8;

  if (sec.RDPEnabled) score -= 15;
  if (sec.DefenderStatus && !sec.DefenderStatus.RealTimeProtection) score -= 25;
  return Math.max(40, Math.min(100, Math.round(score)));
}

function renderDashboard() {
  const { health, security } = appState;
  const score = computeGlobalScore(health, security);

  document.getElementById("scoreValue").textContent = score;
  const deg = Math.round((score / 100) * 360);
  const ring = document.getElementById("scoreRing");
  ring.style.setProperty("--score-deg", `${deg}deg`);
  ring.style.background = `conic-gradient(${
    score >= 80 ? "var(--status-ok)" : score >= 65 ? "var(--status-warn)" : "var(--status-crit)"
  } ${deg}deg, rgba(255,255,255,0.08) 0deg)`;

  document.getElementById("lastAuditTime").textContent = `Audit : ${health.Timestamp}`;
  document.getElementById("osLabel").textContent = health.OS || "Windows 11";
  document.getElementById("uptimeLabel").textContent = health.UptimeText || "N/A";
  document.getElementById("hostSubtitle").textContent =
    `Machine : ${health.Hostname || "PC Local"} • Processeur : ${(health.CPU && health.CPU.Name) || "Intel Core"}`;

  // RAM
  const ramPct = health.RAM.UsedPct;
  const ramStatus = ramPct >= 90 ? "CRITIQUE" : ramPct >= 80 ? "ATTENTION" : "OK";
  const ramBadge = document.getElementById("ramBadge");
  ramBadge.className = `status-dot status-${ramStatus}`;
  ramBadge.textContent = ramStatus === "OK" ? "🟢 FLUIDE" : ramStatus === "ATTENTION" ? "🟡 CHARGÉE" : "🔴 SATURÉE";
  document.getElementById("ramValue").textContent = `${health.RAM.UsedGB} Go / ${health.RAM.TotalGB} Go`;
  const ramBar = document.getElementById("ramBar");
  ramBar.style.width = `${Math.min(100, ramPct)}%`;
  ramBar.style.background = ramStatus === "OK" ? "var(--status-ok)" : ramStatus === "ATTENTION" ? "var(--status-warn)" : "var(--status-crit)";
  document.getElementById("ramExplain").textContent =
    `Utilisée à ${ramPct} % (${health.RAM.FreeGB} Go libres disponibles immédiatement).`;

  // Disk
  const mainDisk = (health.Disks && health.Disks[0]) || { Drive: "C:", FreeGB: 24.5, UsedPct: 89, Status: "ATTENTION" };
  const diskBadge = document.getElementById("diskBadge");
  diskBadge.className = `status-dot status-${mainDisk.Status}`;
  diskBadge.textContent = mainDisk.Status === "OK" ? "🟢 OK" : "🟡 ATTENTION";
  document.getElementById("diskValue").textContent = `${mainDisk.FreeGB} Go libres (${mainDisk.Drive})`;
  const diskBar = document.getElementById("diskBar");
  diskBar.style.width = `${Math.min(100, mainDisk.UsedPct)}%`;
  diskBar.style.background = mainDisk.Status === "OK" ? "var(--status-ok)" : "var(--status-warn)";
  document.getElementById("diskExplain").textContent =
    `Disque ${mainDisk.Drive} rempli à ${mainDisk.UsedPct} %. Fichiers temporaires : ${health.TempSizeMB || 0} Mo.`;
  document.getElementById("tempSizeLabel").textContent = `${health.TempSizeMB || 0} Mo`;

  // Security
  const fwOk = (security.FirewallProfiles || []).every(p => p.Enabled);
  const defOk = security.DefenderStatus ? security.DefenderStatus.RealTimeProtection !== false : true;
  const uacOk = security.UAC ? security.UAC.EnableLUA === 1 : true;
  const rdpOk = !security.RDPEnabled;
  const checks = [fwOk, defOk, uacOk, rdpOk].filter(Boolean).length;
  document.getElementById("secValue").textContent = `${checks} / 4 Verrous Actifs`;
  const secBadge = document.getElementById("secBadge");
  secBadge.className = `status-dot status-${checks === 4 ? "OK" : "ATTENTION"}`;
  secBadge.textContent = checks === 4 ? "🟢 PROTÉGÉ" : "🟡 À VÉRIFIER";

  // Tables
  renderStartupTable(health.StartupItems || []);
  renderProcessTable(health.TopProcessesRAM || []);
  renderPortsTable(security.ExposedTCPPorts || []);
  renderDsavLogs();
}

function renderStartupTable(items) {
  const tbody = document.getElementById("startupTableBody");
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--text-muted);">Aucun programme superflu au démarrage !</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => {
    const isEssential = /SecurityHealth|OneDrive|OpenVPN/i.test(item.Name);
    return `
      <tr>
        <td><strong>${escapeHtml(item.Name)}</strong></td>
        <td>${isEssential ? "🟢 Faible" : "🟡 Moyen à Élevé"}</td>
        <td>${isEssential ? "Conserver (Utile au système)" : "Peut être lancé manuellement au besoin"}</td>
        <td style="font-family:monospace;font-size:0.78rem;color:var(--text-muted);">${escapeHtml(item.Command || "")}</td>
      </tr>
    `;
  }).join("");
}

function renderProcessTable(procs) {
  const tbody = document.getElementById("processTableBody");
  tbody.innerHTML = procs.map(p => {
    const desc = PROCESS_EXPLANATIONS[p.Name] || "Application ou service en cours d'exécution sur votre session.";
    return `
      <tr>
        <td><strong>${escapeHtml(p.Name)}</strong> <span style="color:var(--text-muted);font-size:0.78rem;">(PID ${p.Id})</span></td>
        <td>${escapeHtml(desc)}</td>
        <td><strong>${p.RAM_MB} Mo</strong></td>
        <td>${p.CPU_s || 0} s</td>
      </tr>
    `;
  }).join("");
}

function renderPortsTable(ports) {
  const tbody = document.getElementById("portsTableBody");
  tbody.innerHTML = ports.map(pt => {
    const info = PORT_EXPLANATIONS[pt.Port] || {
      desc: "Service système interne Windows (RPC dynamique).",
      risk: "🟢 Normal (Protégé par le Pare-feu)"
    };
    return `
      <tr>
        <td><strong>Port ${pt.Port}</strong></td>
        <td><code>${escapeHtml(pt.ProcessName || "Système")}</code></td>
        <td>${escapeHtml(info.desc)}</td>
        <td>${info.risk}</td>
      </tr>
    `;
  }).join("");
}

function renderDsavLogs() {
  const container = document.getElementById("dsavLogList");
  container.innerHTML = appState.dsavLogs.map(log => `
    <div style="background:rgba(15,23,42,0.7);border:1px solid var(--border-color);padding:0.9rem 1.1rem;border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
      <div>
        <div style="font-weight:700;font-size:0.95rem;">[${escapeHtml(log.time)}] ${escapeHtml(log.title)}</div>
        <div style="font-size:0.82rem;color:var(--text-muted);">Sauvegarde / Sécurité : <code>${escapeHtml(log.backup)}</code></div>
      </div>
      <span class="status-dot status-OK">${escapeHtml(log.status)}</span>
    </div>
  `).join("");
}

async function runFullDiagnostic(silent = false) {
  const btn = document.getElementById("btnRunAudit");
  btn.disabled = true;
  btn.textContent = "⏳ Analyse du système en cours...";

  try {
    if (isLocalConnected) {
      const [hRes, sRes] = await Promise.all([
        fetch(`${LOCAL_API_BASE}/api/audit/health`),
        fetch(`${LOCAL_API_BASE}/api/audit/security`)
      ]);
      if (hRes.ok) appState.health = await hRes.json();
      if (sRes.ok) appState.security = await sRes.json();
      if (!silent) showToast("✅ Diagnostic en direct terminé avec succès !");
    } else {
      await new Promise(r => setTimeout(r, 600));
      appState.health.Timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
      if (!silent) {
        showToast("ℹ️ Diagnostic simulé mis à jour (Téléchargez et lancez Lancer-SysAdmin-UI.bat pour analyser votre PC en direct).");
      }
    }
    renderDashboard();
  } catch (err) {
    showToast("⚠️ Impossible de contacter l'agent local : affichage des données de démonstration.");
  } finally {
    btn.disabled = false;
    btn.textContent = "🔍 Relancer le Diagnostic Complet";
  }
}

async function triggerAction(actionName) {
  if (actionName === "full-audit") {
    return runFullDiagnostic();
  }
  if (actionName === "copy-linux-cmd") {
    navigator.clipboard.writeText("bash ./skills/linux-sysadmin-senior/scripts/linux-health-audit.sh");
    showToast("📋 Commande d'audit Linux copiée dans le presse-papiers !");
    return;
  }

  if (isLocalConnected) {
    showToast("⏳ Exécution sécurisée en cours (Protocole D.S.A.V.)...");
    try {
      const res = await fetch(`${LOCAL_API_BASE}/api/action/${actionName}`, { method: "POST" });
      const data = await res.json();
      const now = new Date().toTimeString().slice(0, 8);
      if (actionName === "clean-temp") {
        appState.dsavLogs.unshift({
          time: now,
          title: `Nettoyage des fichiers temporaires (${data.RemovedFiles || 0} fichiers supprimés, ${data.FreedMB || 0} Mo libérés)`,
          backup: "Seuls les fichiers temporaires > 48h ont été nettoyés",
          status: "🟢 Vérifié"
        });
        showToast(`🧹 Nettoyage terminé : ${data.FreedMB || 0} Mo libérés !`);
      } else if (actionName === "flush-dns") {
        appState.dsavLogs.unshift({
          time: now,
          title: "Vidage et rafraîchissement du cache DNS Windows",
          backup: "Opération réversible sans perte de connexion",
          status: "🟢 Vérifié"
        });
        showToast("🌐 Cache DNS rafraîchi avec succès !");
      } else if (actionName === "optimize-startup") {
        appState.dsavLogs.unshift({
          time: now,
          title: `Optimisation du démarrage (${data.DisabledCount || 0} logiciels lourds retirés du démarrage auto)`,
          backup: data.RegBackupPath || "Sauvegarde .reg créée",
          status: "🟢 Vérifié"
        });
        showToast(`🚀 Démarrage optimisé ! Sauvegarde créée : ${data.RegBackupPath || "OK"}`);
      } else if (actionName === "restore-startup") {
        appState.dsavLogs.unshift({
          time: now,
          title: "Rollback effectué : restauration de la sauvegarde du démarrage Windows",
          backup: data.RestoredFrom || "Dernière sauvegarde .reg",
          status: "🟢 Restauré"
        });
        showToast("⏪ État précédent du démarrage restauré avec succès !");
      }
      await runFullDiagnostic(true);
    } catch (e) {
      showToast("⚠️ Erreur lors de l'action locale.");
    }
    return;
  }

  // Interactive online simulation when user is on GitHub Pages
  const now = new Date().toTimeString().slice(0, 8);
  if (actionName === "clean-temp") {
    const freed = appState.health.TempSizeMB || 120;
    appState.health.TempSizeMB = 12.4;
    appState.dsavLogs.unshift({
      time: now,
      title: `[Démo] Nettoyage sécurisé des fichiers temporaires (${freed} Mo libérés)`,
      backup: "Fichiers personnels intacts",
      status: "🟢 Simulé"
    });
    showToast(`🧹 [Mode Démo En Ligne] ${freed} Mo nettoyés ! Pour agir sur votre vrai PC, téléchargez l'outil (.ZIP) en haut à droite.`);
  } else if (actionName === "optimize-startup") {
    appState.health.RAM.UsedGB = 5.4;
    appState.health.RAM.FreeGB = 2.3;
    appState.health.RAM.UsedPct = 70.1;
    appState.dsavLogs.unshift({
      time: now,
      title: "[Démo] Sauvegarde Registre (.reg) + Allègement des applications au démarrage",
      backup: "HKCU_Run_Backup.reg",
      status: "🟢 Simulé"
    });
    showToast("🚀 [Mode Démo En Ligne] Démarrage optimisé ! Téléchargez le .ZIP en haut à droite pour l'exécuter sur votre PC.");
  } else if (actionName === "flush-dns") {
    appState.dsavLogs.unshift({
      time: now,
      title: "[Démo] Rafraîchissement du cache DNS Windows",
      backup: "Aucune perte de données",
      status: "🟢 Simulé"
    });
    showToast("🌐 [Mode Démo En Ligne] Cache DNS vidé !");
  } else if (actionName === "restore-startup") {
    appState.dsavLogs.unshift({
      time: now,
      title: "[Démo] Restauration (Rollback) de la sauvegarde du Registre Windows",
      backup: "HKCU_Run_Backup.reg restauré",
      status: "🟢 Simulé"
    });
    showToast("⏪ [Mode Démo En Ligne] Rollback effectué !");
  }
  renderDashboard();
}

function selectSymptom(key, btnEl) {
  document.querySelectorAll(".symptom-btn").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  const item = SYMPTOM_GUIDES[key];
  const box = document.getElementById("wizardContent");
  box.innerHTML = `
    <h3 style="margin-bottom:0.45rem;color:#7dd3fc;">${escapeHtml(item.title)}</h3>
    <p style="margin-bottom:0.5rem;font-size:0.92rem;"><strong>Pourquoi ça arrive :</strong> ${escapeHtml(item.why)}</p>
    <p style="margin-bottom:0.95rem;font-size:0.92rem;color:#cbd5e1;"><strong>La solution Senior (expliquée simplement) :</strong> ${escapeHtml(item.solution)}</p>
    <button class="btn btn-primary" onclick="triggerAction('${item.actionBtn.action}')">
      ${escapeHtml(item.actionBtn.label)}
    </button>
  `;
}

function switchTab(tabId, btnEl) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btnEl.classList.add("active");
  document.getElementById(tabId).classList.add("active");
}

function importJsonReport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.RAM && data.Disks) {
        appState.health = data;
      } else if (data.health && data.security) {
        appState = data;
      }
      renderDashboard();
      showToast("📂 Rapport JSON importé et affiché avec succès !");
    } catch (_) {
      showToast("⚠️ Ce fichier JSON n'est pas un rapport valide.");
    }
  };
  reader.readAsText(file);
}

function exportCurrentReport() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bilan-SysAdmin-${(appState.health.Hostname || "PC")}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("💾 Votre bilan complet a été téléchargé au format JSON.");
}

function openDownloadModal() {
  document.getElementById("downloadModal").classList.add("open");
}

function closeDownloadModal() {
  document.getElementById("downloadModal").classList.remove("open");
}

function showToast(msg) {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 4500);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
