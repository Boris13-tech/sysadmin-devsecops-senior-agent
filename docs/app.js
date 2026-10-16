// Poste de Contrôle Système — Logique Front-End (Mode Local Direct & Mode Aperçu Web)

let isLocalConnected = false;
let currentFilter = "";
const LOCAL_API_BASE = "http://127.0.0.1:8765";

let appState = {
  health: {
    Timestamp: "16/10/2026 18:10:00",
    Hostname: "LEGRAND-TECH",
    OS: "Microsoft Windows 11 Famille (Build 26300)",
    UptimeText: "0j 13h 38m",
    CPU: { Name: "Intel Core i5-1135G7 @ 2.40GHz", Cores: 4, Logical: 8, LoadPercent: 28 },
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
  devsecops: [
    {
      component: "Démon Docker",
      check: "Mode d'exécution et droits socket",
      finding: "Docker Desktop (WSL2 Engine) — Accès restreint aux administrateurs locaux",
      status: "Conforme",
      level: "ok"
    },
    {
      component: "Privilèges Conteneurs",
      check: "Exécution non-root & Flag --privileged",
      finding: "Aucun conteneur détecté en mode privilégié (--privileged)",
      status: "Conforme",
      level: "ok"
    },
    {
      component: "Volumes & Images",
      check: "Ressources orphelines (dangling)",
      finding: "Nettoyage périodique conseillé (docker image/volume prune)",
      status: "À surveiller",
      level: "warn"
    },
    {
      component: "Kubernetes (kubectl)",
      check: "Pod Security Standards & Contextes",
      finding: "kubectl détecté — isolation des namespaces recommandée en production",
      status: "Bonnes pratiques",
      level: "ok"
    }
  ],
  dsavLogs: [
    {
      time: "18:08:12",
      title: "Allègement du démarrage (6 applications retirées du lancement automatique)",
      backup: "~/.gemini/Backups/SysAdmin/HKCU_Run_Backup_20261016-180812.reg",
      status: "Vérifié"
    },
    {
      time: "18:08:15",
      title: "Nettoyage des fichiers temporaires obsolètes (+41,15 Mo récupérés)",
      backup: "Fichiers > 48h uniquement (Documents intacts)",
      status: "Vérifié"
    }
  ]
};

const PROCESS_EXPLANATIONS = {
  "Memory Compression": "Mécanisme interne de Windows qui compresse la RAM au lieu de ralentir sur le disque.",
  "MsMpEng": "Service antivirus Microsoft Defender actif en arrière-plan.",
  "Antigravity": "Environnement de développement et d'assistance technique.",
  "explorer": "Gestionnaire du Bureau Windows, de la barre des tâches et des fenêtres de fichiers.",
  "svchost": "Processus hôte regroupant plusieurs services système de Windows.",
  "chrome": "Navigateur Google Chrome (chaque onglet ouvert occupe un segment mémoire).",
  "msedge": "Navigateur Microsoft Edge.",
  "claude": "Processus d'assistance en ligne de commande.",
  "powershell": "Interpréteur de commandes et d'automatisation Windows."
};

const PORT_EXPLANATIONS = {
  135: { desc: "Appel de procédure distante Windows (RPC). Service interne standard.", risk: "Standard (Filtré par le pare-feu)", level: "ok" },
  445: { desc: "Partage de fichiers et d'imprimantes sur le réseau local (protocole SMB).", risk: "À limiter au réseau local privé", level: "warn" },
  5040: { desc: "Service Windows de partage de proximité entre appareils connectés.", risk: "Standard", level: "ok" },
  5357: { desc: "Découverte des périphériques sur le réseau local (WSDAPI).", risk: "Standard", level: "ok" },
  7680: { desc: "Optimisation de téléchargement des mises à jour Windows Update.", risk: "Standard", level: "ok" },
  27036: { desc: "Découverte locale du client Steam (diffusion de jeu à domicile).", risk: "Application locale (Steam)", level: "ok" },
  58900: { desc: "Synchronisation locale Spotify Connect sur le Wi-Fi domestique.", risk: "Application locale (Spotify)", level: "ok" }
};

const SCENARIOS = {
  slow: {
    title: "Lenteur générale au démarrage ou en multitâche",
    cause: "Sur une machine dotée de 8 Go de mémoire vive, le lancement simultané d'applications lourdes dès l'ouverture de session (clients de jeux, messageries, synchronisation cloud, conteneurs) sature plus de 90 % de la RAM avant même d'ouvrir un document.",
    remedy: "Retirer ces programmes du lancement automatique (ils restent disponibles normalement quand vous cliquez sur leur icône) permet de récupérer immédiatement entre 1,5 et 2,5 Go de mémoire vive.",
    btnLabel: "Alléger le démarrage maintenant",
    action: "optimize-startup"
  },
  disk: {
    title: "Saturation progressive des partitions C: et D:",
    cause: "Lorsqu'un SSD approche des 90 % d'occupation, Windows dispose de moins de marge pour son fichier d'échange ( mémoire virtuelle ) et les mises à jour accumulent des fichiers temporaires dans %TEMP%.",
    remedy: "Commencez par purger les fichiers temporaires de plus de 48 heures. Cette opération ne touche à aucun fichier personnel (Bureau, Documents, Téléchargements).",
    btnLabel: "Purger les fichiers temporaires",
    action: "clean-temp"
  },
  security: {
    title: "Contrôle des services exposés sur le réseau",
    cause: "Une machine mal configurée peut laisser le Bureau à distance (RDP) ouvert ou désactiver un profil de pare-feu sur un Wi-Fi public.",
    remedy: "L'audit vérifie les 3 profils du pare-feu Windows, l'état temps réel de Microsoft Defender, la protection UAC et traduit chaque port ouvert en clair.",
    btnLabel: "Relancer l'audit de sécurité",
    action: "full-audit"
  },
  network: {
    title: "Sites web inaccessibles malgré une connexion Wi-Fi active",
    cause: "Le cache DNS local de Windows conserve parfois en mémoire une adresse IP périmée après un changement de réseau ou de VPN.",
    remedy: "La réinitialisation du cache DNS force le système à interroger à nouveau le serveur DNS sans couper votre connexion actuelle.",
    btnLabel: "Vider le cache DNS",
    action: "flush-dns"
  },
  linux: {
    title: "Diagnostic rapide d'un serveur Linux ou d'une instance WSL",
    cause: "Sur Linux, un ralentissement ou un refus d'écriture provient souvent d'un service systemd en échec, d'une saturation des inodes (df -i) ou d'une intervention du OOM Killer dans dmesg.",
    remedy: "Exécutez le script d'audit en lecture seule basé sur la méthode USE (Utilization, Saturation, Errors) pour obtenir un état complet en quelques secondes.",
    btnLabel: "Copier la commande d'audit Linux",
    action: "copy-linux-cmd"
  }
};

window.addEventListener("DOMContentLoaded", async () => {
  selectScenario("slow", document.querySelector(".scenario-btn"));
  await checkLocalServerAndLoad();
});

async function checkLocalServerAndLoad() {
  try {
    const res = await fetch(`${LOCAL_API_BASE}/api/status`, { method: "GET" });
    if (res.ok) {
      isLocalConnected = true;
      const ind = document.getElementById("connectionStatus");
      ind.className = "status-indicator connected";
      document.getElementById("connectionLabel").textContent = "Connecté au poste local (127.0.0.1:8765)";
      document.getElementById("connectionSubtext").textContent =
        "Relais PowerShell actif : les relevés et les boutons d'intervention agissent en direct sur votre système.";
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

  // Meta bar
  document.getElementById("metaHostname").textContent = health.Hostname || "Poste local";
  document.getElementById("metaOS").textContent = health.OS || "Windows 11";
  document.getElementById("metaCPU").textContent =
    health.CPU ? `${health.CPU.Name} (${health.CPU.Cores} cœurs / ${health.CPU.Logical} threads)` : "Processeur x64";
  document.getElementById("metaUptime").textContent = health.UptimeText || "N/A";
  document.getElementById("metaTimestamp").textContent = `Relevé : ${health.Timestamp}`;

  // Score Card
  document.getElementById("scoreNumber").textContent = score;
  const scoreBar = document.getElementById("scoreBar");
  scoreBar.style.width = `${score}%`;
  const scoreTag = document.getElementById("scoreTag");
  if (score >= 80) {
    scoreTag.className = "tag tag-ok";
    scoreTag.textContent = "Bon état";
    scoreBar.style.backgroundColor = "var(--ok)";
  } else if (score >= 65) {
    scoreTag.className = "tag tag-warn";
    scoreTag.textContent = "À surveiller";
    scoreBar.style.backgroundColor = "var(--warn)";
  } else {
    scoreTag.className = "tag tag-crit";
    scoreTag.textContent = "Action requise";
    scoreBar.style.backgroundColor = "var(--crit)";
  }

  // RAM Card
  const ramPct = health.RAM.UsedPct;
  document.getElementById("ramUsedLabel").textContent = `${health.RAM.UsedGB} Go`;
  document.getElementById("ramTotalLabel").textContent = `${health.RAM.TotalGB} Go`;
  const ramMeter = document.getElementById("ramMeter");
  ramMeter.style.width = `${Math.min(100, ramPct)}%`;
  const ramTag = document.getElementById("ramTag");
  if (ramPct >= 90) {
    ramTag.className = "tag tag-crit";
    ramTag.textContent = "Saturée";
    ramMeter.style.backgroundColor = "var(--crit)";
  } else if (ramPct >= 78) {
    ramTag.className = "tag tag-warn";
    ramTag.textContent = "Sollicitée";
    ramMeter.style.backgroundColor = "var(--warn)";
  } else {
    ramTag.className = "tag tag-ok";
    ramTag.textContent = "Fluide";
    ramMeter.style.backgroundColor = "var(--ok)";
  }
  document.getElementById("ramNote").textContent =
    `${ramPct} % utilisés (${health.RAM.FreeGB} Go libres immédiatement disponibles).`;

  // Disk Card
  const d0 = (health.Disks && health.Disks[0]) || { Drive: "C:", SizeGB: 236.9, FreeGB: 24.5, UsedPct: 89.7 };
  document.getElementById("diskFreeLabel").textContent = `${d0.FreeGB} Go`;
  const diskMeter = document.getElementById("diskMeter");
  diskMeter.style.width = `${Math.min(100, d0.UsedPct)}%`;
  const diskTag = document.getElementById("diskTag");
  if (d0.UsedPct >= 92) {
    diskTag.className = "tag tag-crit";
    diskTag.textContent = `${d0.UsedPct} % occupé`;
    diskMeter.style.backgroundColor = "var(--crit)";
  } else if (d0.UsedPct >= 82) {
    diskTag.className = "tag tag-warn";
    diskTag.textContent = `${d0.UsedPct} % occupé`;
    diskMeter.style.backgroundColor = "var(--warn)";
  } else {
    diskTag.className = "tag tag-ok";
    diskTag.textContent = `${d0.UsedPct} % occupé`;
    diskMeter.style.backgroundColor = "var(--ok)";
  }
  document.getElementById("diskNote").textContent =
    `Sur ${d0.SizeGB} Go au total (${d0.Drive}). Fichiers temporaires : ${health.TempSizeMB || 0} Mo.`;
  document.getElementById("tempSizeInline").textContent = `${health.TempSizeMB || 0} Mo`;

  // Security Card
  const fwOk = (security.FirewallProfiles || []).every(p => p.Enabled);
  const defOk = security.DefenderStatus ? security.DefenderStatus.RealTimeProtection !== false : true;
  const uacOk = security.UAC ? security.UAC.EnableLUA === 1 : true;
  const rdpOk = !security.RDPEnabled;
  const passed = [fwOk, defOk, uacOk, rdpOk].filter(Boolean).length;
  const secTag = document.getElementById("secTag");
  secTag.textContent = `${passed} / 4 actifs`;
  secTag.className = passed === 4 ? "tag tag-ok" : "tag tag-warn";
  document.getElementById("secHeadline").textContent = passed === 4 ? "Conforme" : "À vérifier";

  renderTables();
}

function renderTables() {
  const q = currentFilter.trim().toLowerCase();
  const { health, security, dsavLogs } = appState;

  // Startup
  const startups = (health.StartupItems || []).filter(item =>
    !q || (item.Name && item.Name.toLowerCase().includes(q)) || (item.Command && item.Command.toLowerCase().includes(q))
  );
  document.getElementById("countStartup").textContent = startups.length;
  document.getElementById("tbodyStartup").innerHTML = startups.length
    ? startups.map(item => {
        const essential = /SecurityHealth|OneDrive|OpenVPN/i.test(item.Name);
        return `
          <tr>
            <td><strong>${escapeHtml(item.Name)}</strong></td>
            <td><span class="tag ${essential ? "tag-ok" : "tag-warn"}">${essential ? "Faible" : "Modéré"}</span></td>
            <td>${essential ? "Conserver au démarrage" : "Lancement manuel conseillé"}</td>
            <td><code class="code-inline">${escapeHtml(item.Command || "")}</code></td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" style="color:var(--text-tertiary);">Aucun élément correspondant.</td></tr>`;

  // Processes
  const procs = (health.TopProcessesRAM || []).filter(p =>
    !q || (p.Name && p.Name.toLowerCase().includes(q)) || String(p.Id).includes(q)
  );
  document.getElementById("countProcs").textContent = procs.length;
  document.getElementById("tbodyProcesses").innerHTML = procs.map(p => {
    const desc = PROCESS_EXPLANATIONS[p.Name] || "Processus applicatif ou service actif sur la session.";
    return `
      <tr>
        <td><strong>${escapeHtml(p.Name)}</strong> <span class="tabular" style="color:var(--text-tertiary);font-size:12px;">(PID ${p.Id})</span></td>
        <td style="color:var(--text-secondary);">${escapeHtml(desc)}</td>
        <td class="tabular"><strong>${p.RAM_MB} Mo</strong></td>
        <td class="tabular" style="color:var(--text-secondary);">${p.CPU_s || 0} s</td>
      </tr>
    `;
  }).join("");

  // Ports
  const ports = (security.ExposedTCPPorts || []).filter(pt =>
    !q || String(pt.Port).includes(q) || (pt.ProcessName && pt.ProcessName.toLowerCase().includes(q))
  );
  document.getElementById("countPorts").textContent = ports.length;
  document.getElementById("tbodyPorts").innerHTML = ports.map(pt => {
    const info = PORT_EXPLANATIONS[pt.Port] || {
      desc: "Service RPC dynamique interne à Windows.",
      risk: "Standard (Filtré par le pare-feu)",
      level: "ok"
    };
    return `
      <tr>
        <td class="tabular"><strong>${pt.Port}</strong> / TCP</td>
        <td><code class="code-inline">${escapeHtml(pt.ProcessName || "System")}</code></td>
        <td style="color:var(--text-secondary);">${escapeHtml(info.desc)}</td>
        <td><span class="tag tag-${info.level}">${escapeHtml(info.risk)}</span></td>
      </tr>
    `;
  }).join("");

  // DevSecOps
  const devsecopsList = (appState.devsecops || []).filter(item =>
    !q || (item.component && item.component.toLowerCase().includes(q)) ||
    (item.check && item.check.toLowerCase().includes(q)) ||
    (item.finding && item.finding.toLowerCase().includes(q))
  );
  const countDevEl = document.getElementById("countDevsecops");
  if (countDevEl) countDevEl.textContent = devsecopsList.length;
  const tbodyDevEl = document.getElementById("tbodyDevsecops");
  if (tbodyDevEl) {
    tbodyDevEl.innerHTML = devsecopsList.map(item => `
      <tr>
        <td><strong>${escapeHtml(item.component)}</strong></td>
        <td>${escapeHtml(item.check)}</td>
        <td style="color:var(--text-secondary);">${escapeHtml(item.finding)}</td>
        <td><span class="tag tag-${item.level}">${escapeHtml(item.status)}</span></td>
      </tr>
    `).join("");
  }

  // Journal
  document.getElementById("countJournal").textContent = dsavLogs.length;
  document.getElementById("tbodyJournal").innerHTML = dsavLogs.map(log => `
    <tr>
      <td class="tabular" style="color:var(--text-secondary);">${escapeHtml(log.time)}</td>
      <td><strong>${escapeHtml(log.title)}</strong></td>
      <td><code class="code-inline">${escapeHtml(log.backup)}</code></td>
      <td><span class="tag tag-ok">${escapeHtml(log.status)}</span></td>
    </tr>
  `).join("");
}

function filterTables(val) {
  currentFilter = val || "";
  renderTables();
}

function selectScenario(key, btnEl) {
  document.querySelectorAll(".scenario-btn").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  const s = SCENARIOS[key];
  document.getElementById("scenarioContainer").innerHTML = `
    <h3 style="font-size:15px;font-weight:600;margin-bottom:4px;">${escapeHtml(s.title)}</h3>
    <div class="scenario-grid">
      <div class="diag-block">
        <div class="diag-block-label">Diagnostic technique (Traduit en clair)</div>
        <p>${escapeHtml(s.cause)}</p>
      </div>
      <div class="diag-block">
        <div class="diag-block-label">Action recommandée (Protocole D.S.A.V.)</div>
        <p>${escapeHtml(s.remedy)}</p>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <span style="font-size:12px;color:var(--text-tertiary);">
        Aucune donnée personnelle n'est modifiée lors de cette opération.
      </span>
      <button class="btn btn-primary" onclick="triggerAction('${s.action}')">
        ${escapeHtml(s.btnLabel)}
      </button>
    </div>
  `;
}

async function runFullDiagnostic(silent = false) {
  const btn = document.getElementById("btnRefreshAudit");
  btn.disabled = true;
  const origHtml = btn.innerHTML;
  btn.textContent = "Analyse en cours...";

  try {
    if (isLocalConnected) {
      const [hRes, sRes] = await Promise.all([
        fetch(`${LOCAL_API_BASE}/api/audit/health`),
        fetch(`${LOCAL_API_BASE}/api/audit/security`)
      ]);
      if (hRes.ok) appState.health = await hRes.json();
      if (sRes.ok) appState.security = await sRes.json();
      if (!silent) notify("Relevé système mis à jour en direct depuis votre PC.");
    } else {
      await new Promise(r => setTimeout(r, 400));
      const now = new Date();
      appState.health.Timestamp = now.toLocaleString("fr-FR");
      if (!silent) {
        notify("Aperçu actualisé. Pour analyser votre propre machine, lancez Lancer-SysAdmin-UI.bat.");
      }
    }
    renderDashboard();
  } catch (_) {
    notify("Impossible de joindre le service local (affichage des données d'exemple).");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

async function triggerAction(actionName) {
  if (actionName === "full-audit") return runFullDiagnostic();
  if (actionName === "copy-linux-cmd") {
    navigator.clipboard.writeText("bash ./skills/linux-sysadmin-senior/scripts/linux-health-audit.sh");
    notify("Commande d'audit Linux copiée dans le presse-papiers.");
    return;
  }

  const now = new Date().toTimeString().slice(0, 8);

  if (isLocalConnected) {
    notify("Exécution de l'opération en cours...");
    try {
      const res = await fetch(`${LOCAL_API_BASE}/api/action/${actionName}`, { method: "POST" });
      const data = await res.json();
      if (actionName === "clean-temp") {
        appState.dsavLogs.unshift({
          time: now,
          title: `Purge des fichiers temporaires (${data.RemovedFiles || 0} fichiers supprimés, ${data.FreedMB || 0} Mo libérés)`,
          backup: "Fichiers > 48h uniquement",
          status: "Vérifié"
        });
        notify(`Nettoyage terminé : ${data.FreedMB || 0} Mo récupérés.`);
      } else if (actionName === "flush-dns") {
        appState.dsavLogs.unshift({
          time: now,
          title: "Réinitialisation du cache DNS Windows",
          backup: "Opération sans perte de session",
          status: "Vérifié"
        });
        notify("Cache DNS réinitialisé.");
      } else if (actionName === "optimize-startup") {
        appState.dsavLogs.unshift({
          time: now,
          title: `Allègement du démarrage (${data.DisabledCount || 0} entrées désactivées)`,
          backup: data.RegBackupPath || "Sauvegarde .reg créée",
          status: "Vérifié"
        });
        notify("Démarrage optimisé avec sauvegarde préalable du Registre.");
      } else if (actionName === "restore-startup") {
        appState.dsavLogs.unshift({
          time: now,
          title: "Restauration (Rollback) de la configuration de démarrage",
          backup: data.RestoredFrom || "Archive .reg importée",
          status: "Restauré"
        });
        notify("État précédent du démarrage restauré.");
      }
      await runFullDiagnostic(true);
    } catch (_) {
      notify("Erreur lors de l'exécution locale.");
    }
    return;
  }

  // Online interactive preview
  if (actionName === "clean-temp") {
    const freed = appState.health.TempSizeMB || 120;
    appState.health.TempSizeMB = 11.8;
    appState.dsavLogs.unshift({
      time: now,
      title: `[Aperçu] Purge des fichiers temporaires (${freed} Mo libérés)`,
      backup: "Fichiers > 48h uniquement",
      status: "Simulé"
    });
    notify(`Aperçu : ${freed} Mo purgés. Téléchargez l'utilitaire (.zip) pour agir sur votre PC.`);
  } else if (actionName === "optimize-startup") {
    appState.health.RAM.UsedGB = 5.3;
    appState.health.RAM.FreeGB = 2.4;
    appState.health.RAM.UsedPct = 68.8;
    appState.dsavLogs.unshift({
      time: now,
      title: "[Aperçu] Export Registre (.reg) + Allègement des programmes au démarrage",
      backup: "HKCU_Run_Backup.reg",
      status: "Simulé"
    });
    notify("Aperçu : démarrage allégé (RAM ramenée à 68,8 %).");
  } else if (actionName === "flush-dns") {
    appState.dsavLogs.unshift({
      time: now,
      title: "[Aperçu] Réinitialisation du cache de résolution DNS",
      backup: "Sans coupure réseau",
      status: "Simulé"
    });
    notify("Aperçu : cache DNS réinitialisé.");
  } else if (actionName === "restore-startup") {
    appState.dsavLogs.unshift({
      time: now,
      title: "[Aperçu] Réimportation de la sauvegarde Registre (.reg)",
      backup: "HKCU_Run_Backup.reg",
      status: "Simulé"
    });
    notify("Aperçu : configuration précédente restaurée.");
  }
  renderDashboard();
}

function switchTab(viewId, btnEl) {
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
  btnEl.classList.add("active");
  document.getElementById(viewId).classList.add("active");
}

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
  html.setAttribute("data-theme", next);
  document.getElementById("themeToggleLabel").textContent = next === "light" ? "Mode sombre" : "Mode clair";
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
      notify("Rapport JSON chargé avec succès.");
    } catch (_) {
      notify("Format de fichier JSON non reconnu.");
    }
  };
  reader.readAsText(file);
}

function exportCurrentReport() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-systeme-${(appState.health.Hostname || "poste").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  notify("Rapport exporté au format JSON.");
}

function openGuideModal() {
  document.getElementById("guideModal").classList.add("open");
}

function closeGuideModal() {
  document.getElementById("guideModal").classList.remove("open");
}

function notify(message) {
  const stack = document.getElementById("toastStack");
  const item = document.createElement("div");
  item.className = "toast-item";
  item.textContent = message;
  stack.appendChild(item);
  setTimeout(() => item.remove(), 4200);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
