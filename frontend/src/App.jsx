import { useState, useRef, useEffect } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const P = {
  bg:   "#05070A",
  card: "#1A1F26",
  green:"#00FF41",
  blue: "#5D81FF",
  white:"#F0F2F5",
  dim:  "#4A5568",
  red:  "#FF4560",
};

// ── Platform list (mirrors backend TARGETS order) ──────────────────────────────
const SITES = [
  { name: "Instagram",   url: u => `https://www.instagram.com/${u}`,                 icon: "📸" },
  { name: "GitHub",      url: u => `https://github.com/${u}`,                        icon: "🐙" },
  { name: "TikTok",      url: u => `https://www.tiktok.com/@${u}`,                   icon: "🎵" },
  { name: "YouTube",     url: u => `https://www.youtube.com/@${u}`,                  icon: "▶"  },
  { name: "Reddit",      url: u => `https://www.reddit.com/user/${u}`,               icon: "👾" },
  { name: "Twitter/X",   url: u => `https://twitter.com/${u}`,                       icon: "𝕏"  },
  { name: "LinkedIn",    url: u => `https://www.linkedin.com/in/${u}`,               icon: "💼" },
  { name: "Pinterest",   url: u => `https://www.pinterest.com/${u}`,                 icon: "📌" },
  { name: "Snapchat",    url: u => `https://www.snapchat.com/add/${u}`,              icon: "👻" },
  { name: "Facebook",    url: u => `https://www.facebook.com/${u}`,                  icon: "👥" },
  { name: "Twitch",      url: u => `https://www.twitch.tv/${u}`,                     icon: "🎮" },
  { name: "SoundCloud",  url: u => `https://soundcloud.com/${u}`,                    icon: "🎧" },
  { name: "Spotify",     url: u => `https://open.spotify.com/user/${u}`,             icon: "🎵" },
  { name: "Medium",      url: u => `https://medium.com/@${u}`,                       icon: "✍️" },
  { name: "Dribbble",    url: u => `https://dribbble.com/${u}`,                      icon: "🏀" },
  { name: "Behance",     url: u => `https://www.behance.net/${u}`,                   icon: "🎨" },
  { name: "Vimeo",       url: u => `https://vimeo.com/${u}`,                         icon: "🎬" },
  { name: "Steam",       url: u => `https://steamcommunity.com/id/${u}`,             icon: "🕹️" },
  { name: "Imgur",       url: u => `https://imgur.com/user/${u}`,                    icon: "🖼️" },
  { name: "Flickr",      url: u => `https://www.flickr.com/people/${u}`,             icon: "📷" },
  { name: "Etsy",        url: u => `https://www.etsy.com/shop/${u}`,                 icon: "🛍️" },
  { name: "Pastebin",    url: u => `https://pastebin.com/u/${u}`,                    icon: "📋" },
  { name: "About.me",    url: u => `https://about.me/${u}`,                          icon: "🪪" },
  { name: "Dailymotion", url: u => `https://www.dailymotion.com/${u}`,               icon: "📹" },
  { name: "Codecademy",  url: u => `https://www.codecademy.com/profiles/${u}`,       icon: "💻" },
  { name: "Roblox",      url: u => `https://www.roblox.com/user.aspx?username=${u}`, icon: "🧱" },
  { name: "Canva",       url: u => `https://www.canva.com/${u}`,                     icon: "🖌️" },
  { name: "Wikipedia",   url: u => `https://en.wikipedia.org/wiki/User:${u}`,        icon: "📖" },
  { name: "Meetup",      url: u => `https://www.meetup.com/members/${u}`,            icon: "🤝" },
  { name: "Flipboard",   url: u => `https://flipboard.com/@${u}`,                    icon: "📰" },
  { name: "Substack",    url: u => `https://${u}.substack.com`,                      icon: "📰" },
  { name: "Linktree",    url: u => `https://linktr.ee/${u}`,                         icon: "🌿" },
  { name: "Mastodon",    url: u => `https://mastodon.social/@${u}`,                  icon: "🐘" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

const confToStatus = c => ({
  FOUND: "found", POSSIBLE: "possible",
  NOT_FOUND: "not_found", BLOCKED: "blocked",
  TIMEOUT: "not_found", ERROR: "not_found",
}[c] || "not_found");

// ── Simulated scan — runs standalone with no backend ──────────────────────────
async function simulateScan(username, onResult) {
  const results = [];
  for (let i = 0; i < SITES.length; i++) {
    const site = SITES[i];
    await delay(55 + Math.random() * 85);
    const roll = Math.random();
    const confidence = roll > 0.6 ? "FOUND" : roll > 0.42 ? "POSSIBLE" : "NOT_FOUND";
    const r = {
      platform: site.name,
      url: site.url(username),
      confidence,
      elapsed_ms: Math.round(300 + Math.random() * 900),
    };
    results.push(r);
    onResult(r, i);
  }
  return {
    username, scanned: results.length, results,
    found:    results.filter(r => r.confidence === "FOUND").length,
    possible: results.filter(r => r.confidence === "POSSIBLE").length,
    elapsed_ms: Math.round(1400 + Math.random() * 500),
  };
}

// ── API scan — requires FastAPI backend running on localhost:8000 ──────────────
async function apiScan(username, onResult) {
  const res = await fetch(`/scan/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  for (let i = 0; i < data.results.length; i++) {
    await delay(28);
    onResult(data.results[i], i);
  }
  return data;
}

// ── Glitch title hook ──────────────────────────────────────────────────────────
const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#________";
function useGlitch(text, active) {
  const [display, setDisplay] = useState(text);
  const iter = useRef(0);
  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    iter.current = 0;
    const iv = setInterval(() => {
      setDisplay(
        text.split("").map((c, i) =>
          i < iter.current
            ? text[i]
            : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        ).join("")
      );
      iter.current += 0.4;
      if (iter.current >= text.length) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [active, text]);
  return display;
}

// ── TerminalLine ───────────────────────────────────────────────────────────────
function TerminalLine({ line }) {
  const colors = { green: P.green, blue: P.blue, red: P.red, dim: P.dim, white: P.white };
  return (
    <div className="terminal-line" style={{ color: colors[line.color] || P.white }}>
      <span className="terminal-id">{String(line.id).padStart(4, "0")} ›</span>
      {line.text}
    </div>
  );
}

// ── ResultCard ─────────────────────────────────────────────────────────────────
function ResultCard({ site, status, resolvedUrl }) {
  const isFound    = status === "found";
  const isPossible = status === "possible";
  const isScanning = status === "scanning";
  const isDark     = status === "not_found" || status === "blocked";
  const displayUrl = resolvedUrl || (typeof site.url === "function" ? site.url("…") : site.url);
  const borderColor = isFound ? P.green : isPossible ? P.blue : P.dim + "44";

  return (
    <div
      className="result-card"
      style={{
        border: `1px solid ${borderColor}`,
        opacity: isDark ? 0.4 : 1,
        boxShadow: isFound
          ? `0 0 12px ${P.green}33`
          : isPossible
          ? `0 0 8px ${P.blue}22`
          : "none",
      }}
    >
      {(isFound || isPossible) && (
        <div
          className="card-glow"
          style={{ background: `linear-gradient(90deg, ${isFound ? P.green : P.blue}08, transparent)` }}
        />
      )}
      <span className="card-icon">{site.icon}</span>
      <div className="card-body">
        <div
          className="card-name"
          style={{ color: isFound ? P.green : isPossible ? P.blue : P.white }}
        >
          {site.name}
        </div>
        <div className="card-url">{displayUrl}</div>
      </div>
      <div className="card-action">
        {isScanning && <span className="badge-scanning">SCANNING</span>}
        {isFound && (
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="badge-link badge-found">
            OPEN ↗
          </a>
        )}
        {isPossible && (
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="badge-link badge-possible">
            CHECK ↗
          </a>
        )}
        {isDark && <span className="badge-dark">—</span>}
      </div>
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onClick }) {
  return (
    <div className="toggle" onClick={onClick} style={{ background: on ? P.blue : P.dim + "66" }}>
      <div className="toggle-knob" style={{ left: on ? 17 : 2 }} />
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [input,     setInput]     = useState("");
  const [scanning,  setScanning]  = useState(false);
  const [results,   setResults]   = useState({});
  const [urlMap,    setUrlMap]    = useState({});
  const [logs,      setLogs]      = useState([]);
  const [done,      setDone]      = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [activeTab, setActiveTab] = useState("grid");
  const [useApi,    setUseApi]    = useState(false);

  const logRef   = useRef(null);
  const logIdRef = useRef(0);
  const title    = useGlitch("SOCIAL SCOUT", glitching);

  // Derived counts
  const foundCount    = Object.values(results).filter(v => v === "found").length;
  const possibleCount = Object.values(results).filter(v => v === "possible").length;
  const darkCount     = Object.values(results).filter(v => v === "not_found" || v === "blocked").length;
  const totalScanned  = Object.values(results).filter(v => v !== "pending" && v !== "scanning").length;

  const addLog = (text, color = "white") => {
    const id = ++logIdRef.current;
    setLogs(l => [...l.slice(-150), { id, text, color }]);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleResult = (r, i) => {
    const status = confToStatus(r.confidence);
    setResults(prev => ({ ...prev, [r.platform]: status }));
    setUrlMap(prev => ({ ...prev, [r.platform]: r.url }));
    const badge = {
      found:     "✓ FOUND   ",
      possible:  "~ POSSIBLE",
      not_found: "✗ DARK    ",
      blocked:   "⊘ BLOCKED ",
    }[status] || "✗ DARK    ";
    const color = { found: "green", possible: "blue", not_found: "dim", blocked: "dim" }[status] || "dim";
    addLog(
      `[${String(i + 1).padStart(2, "0")}/${SITES.length}] ${badge}  ${r.platform.padEnd(13)} ${r.elapsed_ms ?? "—"}ms`,
      color
    );
  };

  const handleSearch = async () => {
    const u = input.trim();
    if (!u || scanning) return;
    setGlitching(true);
    setTimeout(() => setGlitching(false), 900);
    setScanning(true);
    setDone(false);
    setLogs([]);
    setUrlMap({});
    logIdRef.current = 0;

    const init = {};
    SITES.forEach(s => { init[s.name] = "scanning"; });
    setResults(init);

    addLog("INITIALIZING SCAN SEQUENCE...", "dim");
    await delay(250);
    addLog(`TARGET ACQUIRED: [ ${u.toUpperCase()} ]`, "blue");
    await delay(180);
    addLog(
      useApi
        ? `DISPATCHING ASYNC GATHER → ${SITES.length} CONCURRENT PROBES...`
        : `PROBING ${SITES.length} NODES ACROSS THE NETWORK...`,
      "dim"
    );
    await delay(200);

    try {
      const data = useApi
        ? await apiScan(u, handleResult)
        : await simulateScan(u, handleResult);

      await delay(150);
      addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "dim");
      addLog(
        `SCAN COMPLETE IN ${data.elapsed_ms}ms — ${data.found} CONFIRMED / ${data.possible} POSSIBLE / ${data.scanned - data.found - data.possible} DARK`,
        "green"
      );
      addLog(`QUERY: "${u}" — ${new Date().toISOString()}`, "blue");
    } catch (err) {
      addLog(`CONNECTION ERROR: ${err.message}`, "red");
      addLog("IS THE FASTAPI SERVER RUNNING? → uvicorn main:app --reload", "dim");
    }

    setScanning(false);
    setDone(true);
  };

  const handleReset = () => {
    setInput(""); setResults({}); setUrlMap({});
    setLogs([]); setDone(false); setScanning(false);
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-top-bar" />
        <div className="header-scanlines" />
        <div className="header-inner">
          <div className="header-title-row">
            <h1 className="header-title">{title}</h1>
            <span className="version-badge">v3.0</span>
          </div>
          <p className="header-sub">SOCIAL NETWORK USERNAME RECONNAISSANCE TOOL</p>
        </div>
      </header>

      <main className="main">
        {/* ── Search bar ── */}
        <div
          className="search-card"
          style={{
            borderColor: scanning ? P.blue : "#1A1F2699",
            animation: scanning ? "borderGlow 2s infinite" : "none",
          }}
        >
          <div className="search-row">
            <div className="input-wrap">
              <span className="input-prompt">›_</span>
              <input
                className="search-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="enter username to recon..."
                disabled={scanning}
              />
            </div>
            <button
              className="btn-scan"
              onClick={handleSearch}
              disabled={scanning || !input.trim()}
              style={{ background: scanning ? P.dim : `linear-gradient(135deg, ${P.blue}, #3D61DF)` }}
            >
              {scanning ? "SCANNING..." : "SCAN"}
            </button>
            {(done || Object.keys(results).length > 0) && (
              <button className="btn-reset" onClick={handleReset}>RESET</button>
            )}
          </div>

          {/* Progress bar */}
          {scanning && (
            <div className="progress-row">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${(totalScanned / SITES.length) * 100}%` }}
                />
              </div>
              <span className="progress-label">{totalScanned}/{SITES.length}</span>
            </div>
          )}

          {/* Mode toggle */}
          <div className="toggle-row">
            <Toggle on={useApi} onClick={() => !scanning && setUseApi(v => !v)} />
            <span className="toggle-label">
              {useApi
                ? "API MODE — requires FastAPI on localhost:8000"
                : "DEMO MODE — simulated scan"}
            </span>
          </div>
        </div>

        {/* ── Stats ── */}
        {Object.keys(results).length > 0 && (
          <div className="stats-grid">
            {[
              { label: "CONFIRMED FOUND", val: foundCount,    color: P.green },
              { label: "POSSIBLE MATCH",  val: possibleCount, color: P.blue  },
              { label: "DARK / NO HIT",   val: darkCount,     color: P.dim   },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderColor: s.color + "22" }}>
                <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        {Object.keys(results).length > 0 && (
          <>
            <div className="tab-bar">
              {["grid", "terminal"].map(tab => (
                <button
                  key={tab}
                  className="tab-btn"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    borderBottomColor: activeTab === tab ? P.blue : "transparent",
                    color: activeTab === tab ? P.white : P.dim,
                  }}
                >
                  {tab === "grid" ? "◫  GRID VIEW" : "⬛ TERMINAL LOG"}
                </button>
              ))}
            </div>

            {activeTab === "grid" && (
              <div className="results-grid">
                {SITES.map(site => (
                  <ResultCard
                    key={site.name}
                    site={site}
                    status={results[site.name] || "pending"}
                    resolvedUrl={urlMap[site.name]}
                  />
                ))}
              </div>
            )}

            {activeTab === "terminal" && (
              <div ref={logRef} className="terminal">
                <div className="terminal-scanlines" />
                {logs.map(l => <TerminalLine key={l.id} line={l} />)}
                {scanning && <div className="terminal-cursor">▌</div>}
              </div>
            )}
          </>
        )}

        {/* ── Empty state ── */}
        {Object.keys(results).length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <div className="empty-title">AWAITING RECON TARGET</div>
            <div className="empty-sub">ENTER A USERNAME TO BEGIN NETWORK SWEEP</div>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>SOCIAL SCOUT v3.0 // RECON ENGINE</span>
        <span>{SITES.length} PLATFORMS INDEXED</span>
      </footer>
    </div>
  );
}
