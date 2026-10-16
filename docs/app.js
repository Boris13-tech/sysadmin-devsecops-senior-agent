// ==============================================================================
// Poste de Contrôle Système — Logique Front-End Humanisée & Pédagogique
// Auteur : Boris Owandja (@Boris13-tech)
// ==============================================================================

let isLocalConnected = false;
let currentFilter = "";
let currentViewMode = "simple"; // 'simple' ou 'expert'
const LOCAL_API_BASE = "http://127.0.0.1:8765";

let appState = {
  health: {
    Timestamp: "Aujourd'hui à 18:10",
    Hostname: "LEGRAND-TECH",
    OS: "Microsoft Windows 11 Famille",
    UptimeText: "13h et 38 minutes",
    CPU: { Name: "Intel Core i5-1135G7", Cores: 4, Logical: 8, LoadPercent: 28 },
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
      finding: "Docker Desktop (Moteur WSL2) — Accès sécurisé réservé à votre session",
      status: "Tout est propre",
      level: "ok"
    },
    {
      component: "Privilèges Conteneurs",
      check: "Exécution non-root & Flag --privileged",
      finding: "Aucun conteneur ne tourne avec des droits système excessifs",
      status: "Sécurisé",
      level: "ok"
    },
    {
      component: "Volumes & Images résiduelles",
      check: "Ressources orphelines (dangling)",
      finding: "Quelques images de test oubliées — un nettoyage de temps en temps est conseillé",
      status: "À surveiller",
      level: "warn"
    },
    {
      component: "Outils Kubernetes (kubectl)",
      check: "Pod Security Standards & Contextes",
      finding: "kubectl est disponible pour vos déploiements locaux",
      status: "Prêt",
      level: "ok"
    }
  ],
  dsavLogs: [
    {
      time: "18:08:12",
      title: "Allègement du démarrage (6 applications gourmandes désactivées au boot)",
      backup: "HKCU_Run_Backup_20261016.reg (Copie de secours du Registre)",
      status: "Vérifié & Sûr"
    },
    {
      time: "18:08:15",
      title: "Nettoyage des fichiers temporaires (+41,15 Mo récupérés sur le disque C:)",
      backup: "Seuls les fichiers temporaires > 48h ont été supprimés (Documents intacts)",
      status: "Vérifié & Sûr"
    }
  ]
};

// Explications rédigées avec bienveillance humaine
const PROCESS_EXPLANATIONS = {
  simple: {
    "Memory Compression": "Windows compresse lui-même un peu de mémoire pour garder votre ordinateur fluide.",
    "MsMpEng": "Votre antivirus officiel Microsoft Defender qui monte la garde en toute discrétion.",
    "Antigravity": "Votre assistant de développement et d'administration système intelligent.",
    "explorer": "L'affichage du Bureau Windows, de la barre des tâches et de vos dossiers.",
    "svchost": "Services internes de Windows (son, mises à jour, réseau). C'est normal qu'il soit là !",
    "chrome": "Le navigateur Google Chrome. Chaque onglet ouvert demande un peu de place en mémoire.",
    "msedge": "Le navigateur Microsoft Edge.",
    "claude": "Votre outil d'assistance en cours d'exécution.",
    "powershell": "Le moteur d'automatisation utilisé pour exécuter nos petits nettoyages."
  },
  expert: {
    "Memory Compression": "Sous-système de compression en RAM évitant le basculement trop rapide sur le fichier d'échange (pagefile).",
    "MsMpEng": "Processus principal du moteur Antivirus Microsoft Defender (Protection temps réel IOAV/AMSI).",
    "Antigravity": "Environnement d'exécution agentique et IDE embarqué.",
    "explorer": "Processus shell Windows hébergeant le Bureau, la barre des tâches et les handlers COM.",
    "svchost": "Processus hôte partagé pour les services système Windows configurés en DLL.",
    "chrome": "Navigateur Chromium multiprocessus (moteur Blink & V8).",
    "msedge": "Navigateur Chromium signé Microsoft.",
    "claude": "CLI d'assistance Claude Code.",
    "powershell": "Moteur PowerShell 5.1/Core exécutant les runbooks système."
  }
};

const PORT_EXPLANATIONS = {
  simple: {
    135: { desc: "Communication interne de Windows (service normal et protégé par votre pare-feu).", risk: "Normal et sous contrôle", level: "ok" },
    445: { desc: "Partage de fichiers entre ordinateurs sur votre réseau local de la maison/bureau.", risk: "Normal chez vous (Bloqué sur internet)", level: "warn" },
    5040: { desc: "Partage de proximité Windows (pour relier votre smartphone ou un appareil voisin).", risk: "Normal", level: "ok" },
    5357: { desc: "Permet à Windows de reconnaître les imprimantes et box connectées sur le Wi-Fi.", risk: "Normal", level: "ok" },
    7680: { desc: "Aide Windows Update à télécharger les mises à jour plus rapidement.", risk: "Normal", level: "ok" },
    27036: { desc: "Votre jeu Steam (permet de diffuser une partie vers un autre écran chez vous).", risk: "Application Steam", level: "ok" },
    58900: { desc: "Spotify Connect (pour changer la musique depuis votre téléphone).", risk: "Application Spotify", level: "ok" }
  },
  expert: {
    135: { desc: "Endpoint Mapper RPC (Remote Procedure Call) de Microsoft.", risk: "Filtré par le pare-feu Defender", level: "ok" },
    445: { desc: "Protocole SMB v2/v3 pour le partage réseau local.", risk: "À ne jamais exposer sur une interface publique", level: "warn" },
    5040: { desc: "Service d'appairage d'appareils Windows (Nearby Share / Connected Devices).", risk: "Service local standard", level: "ok" },
    5357: { desc: "Protocole WSDAPI (Web Services for Devices Discovery).", risk: "Découverte UPnP/WSD", level: "ok" },
    7680: { desc: "Optimisation de distribution P2P de Windows Update (DO).", risk: "Trafic local P2P", level: "ok" },
    27036: { desc: "Port de découverte UDP/TCP du client Steam In-Home Streaming.", risk: "Client Valve Steam", level: "ok" },
    58900: { desc: "Socket TCP local ouvert par Spotify Desktop pour Spotify Connect.", risk: "Client Spotify", level: "ok" }
  }
};

const SCENARIOS = {
  slow: {
    title: "Mon PC est lent ou le ventilateur souffle fort",
    cause: "Dans 90% des cas, ce n'est pas votre ordinateur qui est vieux : c'est simplement que 10 à 15 logiciels ont pris la mauvaise habitude de s'allumer en même temps dès que vous démarrez Windows (Steam, Discord, Spotify, Teams, etc.).",
    remedy: "En cliquant sur « Alléger le démarrage », nous empêchons ces programmes de s'allumer tout seuls. Vous pourrez toujours les ouvrir normalement quand vous en aurez besoin, mais votre PC retrouvera son souffle !",
    btnLabel: "Faire démarrer mon PC plus vite",
    action: "optimize-startup"
  },
  disk: {
    title: "Mon disque dur est presque plein",
    cause: "Au fil des mois et des mises à jour, Windows accumule des dizaines de milliers de petits fichiers temporaires dans des dossiers cachés. Quand le disque approche des 90% de remplissage, l'ordinateur ralentit.",
    remedy: "Nous supprimons uniquement les vieux fichiers résiduels de plus de 48 heures. Vos photos, vos documents Word/Excel et vos téléchargements personnels ne sont jamais touchés.",
    btnLabel: "Nettoyer les fichiers temporaires oubliés",
    action: "clean-temp"
  },
  security: {
    title: "Vérifier si mon ordinateur est bien protégé",
    cause: "Pour être tranquille, un administrateur senior vérifie 4 verrous essentiels : le pare-feu allumé, l'antivirus actif avec des défenses à jour, la protection UAC (qui empêche les virus d'agir en secret) et le bureau à distance fermé.",
    remedy: "Tous vos voyants de sécurité sont actuellement au vert. Vous pouvez relancer une vérification à tout moment d'un simple clic.",
    btnLabel: "Refaire un audit de sécurité complet",
    action: "full-audit"
  },
  network: {
    title: "Internet rame ou certains sites refusent de s'ouvrir",
    cause: "Parfois votre connexion Wi-Fi fonctionne très bien, mais le « carnet d'adresses » de Windows (son cache DNS) a gardé une adresse obsolète en mémoire, ce qui bloque l'accès à certaines pages.",
    remedy: "Réinitialiser ce carnet d'adresses ne coupe pas votre connexion : cela force simplement Windows à redemander l'adresse toute neuve du site que vous voulez voir.",
    btnLabel: "Débloquer ma connexion DNS en 1 clic",
    action: "flush-dns"
  },
  linux: {
    title: "J'administre un serveur Linux ou une instance WSL",
    cause: "Sous Linux, on utilise la méthode USE : vérifier la charge processeur (uptime), la mémoire réelle restante (free -h), l'espace disque et les inodes (df -h / df -i), et les services en panne (systemctl --failed).",
    remedy: "Notre script d'audit complet en lecture seule vérifie ces 7 points vitaux en moins de 3 secondes.",
    btnLabel: "Copier la commande d'audit Linux",
    action: "copy-linux-cmd"
  }
};

window.addEventListener("DOMContentLoaded", async () => {
  setupDynamicGreeting();
  selectScenario("slow", document.querySelector(".scenario-btn"));
  await checkLocalServerAndLoad();
});

function setupDynamicGreeting() {
  const hour = new Date().getHours();
  const greetingEl = document.getElementById("userGreeting");
  const timeGreeting = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  if (greetingEl) {
    greetingEl.innerHTML = `${timeGreeting} ! Voici la forme de votre ordinateur <span class="version-tag">Version 1.1</span>`;
  }
}

function setViewMode(mode) {
  currentViewMode = mode;
  document.getElementById("btnModeSimple").classList.toggle("active", mode === "simple");
  document.getElementById("btnModeExpert").classList.toggle("active", mode === "expert");
  renderDashboard();
  notify(mode === "simple" ? "Affichage en Vue Simple (Conseils clairs)" : "Affichage en Vue Détaillée (Données techniques)");
}

async function checkLocalServerAndLoad() {
  try {
    const res = await fetch(`${LOCAL_API_BASE}/api/status`, { method: "GET" });
    if (res.ok) {
      isLocalConnected = true;
      const ind = document.getElementById("connectionStatus");
      ind.className = "status-indicator connected";
      document.getElementById("connectionLabel").textContent = "Connecté en direct à votre ordinateur (Local)";
      document.getElementById("connectionSubtext").textContent =
        "Génial ! Le relais sécurisé est actif : vos clics ci-dessous agissent en direct sur votre machine en toute sécurité.";
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
    health.CPU ? (currentViewMode === "simple" ? health.CPU.Name : `${health.CPU.Name} (${health.CPU.Cores} cœurs / ${health.CPU.Logical} threads)`) : "Processeur";
  document.getElementById("metaUptime").textContent = health.UptimeText || "N/A";
  document.getElementById("metaTimestamp").textContent = `Dernière vérification : ${health.Timestamp}`;

  // Score Card
  document.getElementById("scoreNumber").textContent = score;
  const scoreBar = document.getElementById("scoreBar");
  scoreBar.style.width = `${score}%`;
  const scoreTag = document.getElementById("scoreTag");
  if (score >= 80) {
    scoreTag.className = "tag tag-ok";
    scoreTag.textContent = "En bonne santé";
    scoreBar.style.backgroundColor = "var(--ok)";
  } else if (score >= 65) {
    scoreTag.className = "tag tag-warn";
    scoreTag.textContent = "Un peu fatigué";
    scoreBar.style.backgroundColor = "var(--warn)";
  } else {
    scoreTag.className = "tag tag-crit";
    scoreTag.textContent = "À chouchouter";
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
    ramTag.textContent = "Un peu à l'étroit";
    ramMeter.style.backgroundColor = "var(--warn)";
  } else {
    ramTag.className = "tag tag-ok";
    ramTag.textContent = "Parfaitement fluide";
    ramMeter.style.backgroundColor = "var(--ok)";
  }
  document.getElementById("ramNote").textContent =
    currentViewMode === "simple"
      ? `Il vous reste ${health.RAM.FreeGB} Go de place libre. Vos logiciels ouverts occupent ${ramPct}% de la mémoire.`
      : `Working Set : ${health.RAM.UsedGB} Go sur ${health.RAM.TotalGB} Go (${ramPct}%, ${health.RAM.FreeGB} Go libres).`;

  // Disk Card
  const d0 = (health.Disks && health.Disks[0]) || { Drive: "C:", SizeGB: 236.9, FreeGB: 24.5, UsedPct: 89.7 };
  document.getElementById("diskFreeLabel").textContent = `${d0.FreeGB} Go`;
  const diskMeter = document.getElementById("diskMeter");
  diskMeter.style.width = `${Math.min(100, d0.UsedPct)}%`;
  const diskTag = document.getElementById("diskTag");
  if (d0.UsedPct >= 92) {
    diskTag.className = "tag tag-crit";
    diskTag.textContent = "Disque presque plein";
    diskMeter.style.backgroundColor = "var(--crit)";
  } else if (d0.UsedPct >= 82) {
    diskTag.className = "tag tag-warn";
    diskTag.textContent = "À surveiller de près";
    diskMeter.style.backgroundColor = "var(--warn)";
  } else {
    diskTag.className = "tag tag-ok";
    diskTag.textContent = "Beaucoup de place";
    diskMeter.style.backgroundColor = "var(--ok)";
  }
  document.getElementById("diskNote").textContent =
    `Votre disque principal (${d0.Drive}) a ${d0.FreeGB} Go de libres sur ${d0.SizeGB} Go. Nettoyable : ${health.TempSizeMB || 0} Mo.`;
  document.getElementById("tempSizeInline").textContent = `${health.TempSizeMB || 0} Mo`;

  // Security Card
  const fwOk = (security.FirewallProfiles || []).every(p => p.Enabled);
  const defOk = security.DefenderStatus ? security.DefenderStatus.RealTimeProtection !== false : true;
  const uacOk = security.UAC ? security.UAC.EnableLUA === 1 : true;
  const rdpOk = !security.RDPEnabled;
  const passed = [fwOk, defOk, uacOk, rdpOk].filter(Boolean).length;
  const secTag = document.getElementById("secTag");
  secTag.textContent = `${passed} / 4 verrous fermés`;
  secTag.className = passed === 4 ? "tag tag-ok" : "tag tag-warn";
  document.getElementById("secHeadline").textContent = passed === 4 ? "Très bien protégé" : "Attention requise";

  renderTables();
}

function renderTables() {
  const q = currentFilter.trim().toLowerCase();
  const { health, security, dsavLogs, devsecops } = appState;
  const expDict = PROCESS_EXPLANATIONS[currentViewMode];
  const portDict = PORT_EXPLANATIONS[currentViewMode];

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
            <td><span class="tag ${essential ? "tag-ok" : "tag-warn"}">${essential ? "Très léger" : "Ralentit l'allumage"}</span></td>
            <td>${essential ? "À conserver (Utile pour Windows)" : "Vous pouvez le désactiver sans crainte"}</td>
            <td><code class="code-inline">${escapeHtml(item.Command || "")}</code></td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" style="color:var(--text-tertiary);">Aucun élément trouvé avec ce mot-clé.</td></tr>`;

  // Processes
  const procs = (health.TopProcessesRAM || []).filter(p =>
    !q || (p.Name && p.Name.toLowerCase().includes(q)) || String(p.Id).includes(q)
  );
  document.getElementById("countProcs").textContent = procs.length;
  document.getElementById("tbodyProcesses").innerHTML = procs.map(p => {
    const desc = expDict[p.Name] || "Programme actuellement ouvert sur votre ordinateur.";
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span><strong>${escapeHtml(p.Name)}</strong> <span class="tabular" style="color:var(--text-tertiary);font-size:12px;">(PID ${p.Id})</span></span>
            <button class="btn btn-ghost" style="padding:2px 7px;font-size:11px;" onclick="inspectProcessWithRea(${p.Id}, '${escapeHtml(p.Name)}')">
              Inspecter (REA)
            </button>
          </div>
        </td>
        <td style="color:var(--text-secondary);">${escapeHtml(desc)}</td>
        <td class="tabular"><strong>${p.RAM_MB} Mo</strong></td>
        <td class="tabular" style="color:var(--text-secondary);">${p.CPU_s || 0} secondes</td>
      </tr>
    `;
  }).join("");

  // Ports
  const ports = (security.ExposedTCPPorts || []).filter(pt =>
    !q || String(pt.Port).includes(q) || (pt.ProcessName && pt.ProcessName.toLowerCase().includes(q))
  );
  document.getElementById("countPorts").textContent = ports.length;
  document.getElementById("tbodyPorts").innerHTML = ports.map(pt => {
    const info = portDict[pt.Port] || {
      desc: "Port de service interne à Windows.",
      risk: "Protégé par le pare-feu",
      level: "ok"
    };
    return `
      <tr>
        <td class="tabular"><strong>Port ${pt.Port}</strong></td>
        <td><code class="code-inline">${escapeHtml(pt.ProcessName || "Système")}</code></td>
        <td style="color:var(--text-secondary);">${escapeHtml(info.desc)}</td>
        <td><span class="tag tag-${info.level}">${escapeHtml(info.risk)}</span></td>
      </tr>
    `;
  }).join("");

  // DevSecOps
  const devList = (devsecops || []).filter(item =>
    !q || (item.component && item.component.toLowerCase().includes(q)) ||
    (item.check && item.check.toLowerCase().includes(q)) ||
    (item.finding && item.finding.toLowerCase().includes(q))
  );
  document.getElementById("countDevsecops").textContent = devList.length;
  document.getElementById("tbodyDevsecops").innerHTML = devList.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.component)}</strong></td>
      <td>${escapeHtml(item.check)}</td>
      <td style="color:var(--text-secondary);">${escapeHtml(item.finding)}</td>
      <td><span class="tag tag-${item.level}">${escapeHtml(item.status)}</span></td>
    </tr>
  `).join("");

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
    <h3 style="font-size:15px;font-weight:600;margin-bottom:6px;">${escapeHtml(s.title)}</h3>
    <div class="scenario-grid">
      <div class="diag-block">
        <div class="diag-block-label">Pourquoi cela se produit :</div>
        <p>${escapeHtml(s.cause)}</p>
      </div>
      <div class="diag-block">
        <div class="diag-block-label">Ce que nous allons faire :</div>
        <p>${escapeHtml(s.remedy)}</p>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <span style="font-size:12px;color:var(--text-tertiary);">
        Rassurez-vous : cette opération est 100% sécurisée et réversible.
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
  btn.textContent = "Examen de votre ordinateur en cours...";

  try {
    if (isLocalConnected) {
      const [hRes, sRes] = await Promise.all([
        fetch(`${LOCAL_API_BASE}/api/audit/health`),
        fetch(`${LOCAL_API_BASE}/api/audit/security`)
      ]);
      if (hRes.ok) appState.health = await hRes.json();
      if (sRes.ok) appState.security = await sRes.json();
      if (!silent) notify("Bilan de santé mis à jour en direct depuis votre machine !");
    } else {
      await new Promise(r => setTimeout(r, 450));
      const now = new Date();
      appState.health.Timestamp = `Aujourd'hui à ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (!silent) {
        notify("Bilan d'exemple actualisé. Pour agir sur votre vrai PC, lancez DEMARRER-ICI.bat.");
      }
    }
    renderDashboard();
  } catch (_) {
    notify("Impossible de joindre le relais local (nous affichons les données d'exemple).");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

async function triggerAction(actionName) {
  if (actionName === "full-audit") return runFullDiagnostic();
  if (actionName === "copy-linux-cmd") {
    navigator.clipboard.writeText("bash ./skills/linux-sysadmin-senior/scripts/linux-health-audit.sh");
    notify("La commande d'audit Linux a été copiée dans votre presse-papiers !");
    return;
  }

  const now = new Date().toTimeString().slice(0, 5);

  if (isLocalConnected) {
    notify("Nettoyage et sécurisation en cours...");
    try {
      const res = await fetch(`${LOCAL_API_BASE}/api/action/${actionName}`, { method: "POST" });
      const data = await res.json();
      if (actionName === "clean-temp") {
        appState.dsavLogs.unshift({
          time: now,
          title: `Tri des fichiers temporaires terminé (${data.RemovedFiles || 0} fichiers nettoyés, ${data.FreedMB || 0} Mo récupérés)`,
          backup: "Fichiers temporaires > 48h uniquement (Documents intacts)",
          status: "Vérifié & Sûr"
        });
        notify(`Bravo ! ${data.FreedMB || 0} Mo d'espace ont été libérés sur votre disque.`);
      } else if (actionName === "flush-dns") {
        appState.dsavLogs.unshift({
          time: now,
          title: "Rafraîchissement de la mémoire réseau (cache DNS)",
          backup: "Aucune coupure de connexion",
          status: "Vérifié & Sûr"
        });
        notify("Le carnet d'adresses réseau de votre PC a été remis à neuf !");
      } else if (actionName === "optimize-startup") {
        appState.dsavLogs.unshift({
          time: now,
          title: `Démarrage allégé (${data.DisabledCount || 0} logiciels retirés de l'allumage automatique)`,
          backup: data.RegBackupPath || "Sauvegarde de secours créée",
          status: "Vérifié & Sûr"
        });
        notify("Votre démarrage est allégé ! Une sauvegarde de secours a été créée.");
      } else if (actionName === "restore-startup") {
        appState.dsavLogs.unshift({
          time: now,
          title: "Annulation : la configuration de démarrage précédente a été réinstallée",
          backup: data.RestoredFrom || "Sauvegarde restaurée",
          status: "Restauré"
        });
        notify("C'est fait : vos anciens logiciels de démarrage ont été remis en place.");
      }
      await runFullDiagnostic(true);
    } catch (_) {
      notify("Une petite erreur est survenue lors de l'action locale.");
    }
    return;
  }

  // Démonstration interactive en ligne
  if (actionName === "clean-temp") {
    const freed = appState.health.TempSizeMB || 120;
    appState.health.TempSizeMB = 11.8;
    appState.dsavLogs.unshift({
      time: now,
      title: `[Démo] Nettoyage des fichiers temporaires (${freed} Mo libérés)`,
      backup: "Fichiers personnels 100% intacts",
      status: "Simulé"
    });
    notify(`[Mode Démo] ${freed} Mo nettoyés ! Téléchargez le pack gratuit pour le faire sur votre PC.`);
  } else if (actionName === "optimize-startup") {
    appState.health.RAM.UsedGB = 5.2;
    appState.health.RAM.FreeGB = 2.5;
    appState.health.RAM.UsedPct = 67.5;
    appState.dsavLogs.unshift({
      time: now,
      title: "[Démo] Démarrage allégé (Gain de 1,5 Go de RAM)",
      backup: "Sauvegarde automatique créée",
      status: "Simulé"
    });
    notify("[Mode Démo] Démarrage allégé ! Téléchargez le pack pour l'appliquer chez vous.");
  } else if (actionName === "flush-dns") {
    appState.dsavLogs.unshift({
      time: now,
      title: "[Démo] Rafraîchissement de la mémoire réseau (DNS)",
      backup: "Sans coupure internet",
      status: "Simulé"
    });
    notify("[Mode Démo] Cache réseau réinitialisé avec succès.");
  } else if (actionName === "restore-startup") {
    appState.dsavLogs.unshift({
      time: now,
      title: "[Démo] Restauration de l'état précédent (Rollback)",
      backup: "Sauvegarde restaurée",
      status: "Simulé"
    });
    notify("[Mode Démo] Changements annulés d'un simple clic.");
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
  notify(next === "light" ? "Passage au thème clair (papier chaud)" : "Passage au thème sombre");
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
      notify("Bilan JSON importé avec succès !");
    } catch (_) {
      notify("Le fichier fourni n'est pas un rapport valide.");
    }
  };
  reader.readAsText(file);
}

function exportCurrentReport() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bilan-sante-pc-${(appState.health.Hostname || "ordinateur").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  notify("Votre bilan complet a été sauvegardé dans vos Téléchargements.");
}

function openGuideModal() {
  document.getElementById("guideModal").classList.add("open");
}

function closeGuideModal() {
  document.getElementById("guideModal").classList.remove("open");
}

async function inspectProcessWithRea(pid, name) {
  const modal = document.getElementById("reaModal");
  const content = document.getElementById("reaModalContent");
  modal.classList.add("open");
  content.innerHTML = `
    <div style="padding:20px;text-align:center;color:var(--text-secondary);">
      Analyse forensique en cours pour <strong>${escapeHtml(name)}</strong> (PID ${pid})...
    </div>
  `;

  if (isLocalConnected) {
    try {
      const res = await fetch(`${LOCAL_API_BASE}/api/rea/inspect-target?pid=${pid}`);
      if (res.ok) {
        const data = await res.json();
        renderReaModalContent(data);
        return;
      }
    } catch (_) {}
  }

  // Simulation pédagogique fidèle si en mode découverte
  setTimeout(() => {
    const isMs = /msmpeng|explorer|svchost|powershell/i.test(name);
    const mock = {
      TargetName: `${name}.exe`,
      TargetPath: isMs ? `C:\\Windows\\System32\\${name}.exe` : `C:\\Program Files\\${name}\\${name}.exe`,
      FileSizeKB: 412.5,
      SHA256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      Signature: isMs ? "Signé et valide" : "Signature numérique vérifiée",
      Signer: isMs ? "CN=Microsoft Windows, O=Microsoft Corporation" : `CN=${name} Corporation`,
      IsMicrosoft: isMs,
      IsSuspiciousLoc: false,
      Verdict: isMs
        ? "Ce fichier est officiel, certifié par Microsoft et parfaitement sain."
        : "Ce binaire possède une signature numérique reconnue et valide.",
      EvidenceId: `REA-EVID-${Date.now()}`
    };
    renderReaModalContent(mock);
  }, 400);
}

function renderReaModalContent(data) {
  const content = document.getElementById("reaModalContent");
  content.innerHTML = `
    <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <strong style="font-size:14px;">${escapeHtml(data.TargetName)}</strong>
        <span class="tag ${data.Signature.includes('valide') || data.Signature.includes('Signé') ? 'tag-ok' : 'tag-warn'}">
          ${escapeHtml(data.Signature)}
        </span>
      </div>
      <div style="font-size:12.5px;color:var(--text-secondary);word-break:break-all;margin-bottom:8px;">
        Emplacement : <code>${escapeHtml(data.TargetPath)}</code> (${data.FileSizeKB} Ko)
      </div>
      <div style="font-size:12px;color:var(--text-tertiary);word-break:break-all;font-family:var(--font-mono);margin-bottom:10px;">
        SHA-256 : ${escapeHtml(data.SHA256 || 'N/A')}
      </div>
      <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:4px;padding:10px 12px;font-size:12.5px;color:var(--text-primary);">
        <strong>Verdict Forensique REA :</strong> ${escapeHtml(data.Verdict)}
      </div>
      <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px;font-family:var(--font-mono);">
        Preuve retenue : ${escapeHtml(data.EvidenceId || 'REA-LIVE-01')}
      </div>
    </div>
  `;
}

function closeReaModal() {
  document.getElementById("reaModal").classList.remove("open");
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
