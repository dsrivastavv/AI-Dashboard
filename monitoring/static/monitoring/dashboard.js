(() => {
  const root = document.querySelector("[data-dashboard-root]");
  if (!root) return;

  const serversUrl = root.dataset.serversUrl;
  const latestUrl = root.dataset.latestUrl;
  const historyUrl = root.dataset.historyUrl;
  const maxMinutes = Number(root.dataset.maxMinutes || 1440);
  let currentMinutes = Math.min(maxMinutes, Number(root.dataset.defaultMinutes || 60));
  let currentServer = "";
  let knownServers = [];
  let latestPollHandle = null;
  let historyPollHandle = null;
  let serversPollHandle = null;
  let loadingLatest = false;
  let loadingHistory = false;
  let loadingServers = false;
  const charts = {};

  const palette = [
    "#5bb4ff",
    "#33e0a1",
    "#ffbf5f",
    "#ff6f91",
    "#a98cff",
    "#ff8b3d",
    "#76e3ff",
    "#9af0a8",
  ];

  function setError(message) {
    const banner = document.getElementById("error-banner");
    if (!banner) return;
    if (message) {
      banner.textContent = message;
      banner.classList.remove("hidden");
    } else {
      banner.textContent = "";
      banner.classList.add("hidden");
    }
  }

  function buildApiUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      url.searchParams.set(key, String(value));
    });
    if (currentServer) {
      url.searchParams.set("server", currentServer);
    }
    return url.toString();
  }

  function setSelectedServerMeta(server) {
    if (!server) {
      setText("selected-server-meta", "No server selected");
      return;
    }
    const hostPart = server.hostname ? ` (${server.hostname})` : "";
    const seenPart = server.last_seen_at ? ` | seen ${formatTime(server.last_seen_at)}` : " | no samples yet";
    setText("selected-server-meta", `${server.name}${hostPart}${seenPart}`);
  }

  function renderServerSelector(servers, selectedServer) {
    const select = document.getElementById("server-selector");
    if (!select) return;
    knownServers = Array.isArray(servers) ? servers : [];

    if (knownServers.length === 0) {
      currentServer = "";
      select.innerHTML = '<option value="">No servers registered</option>';
      select.disabled = true;
      setSelectedServerMeta(null);
      return;
    }

    select.disabled = false;
    const selectedValue = String(
      selectedServer?.slug || currentServer || knownServers[0]?.slug || ""
    );
    select.innerHTML = knownServers
      .map((server) => {
        const latest = server.latest_snapshot_at ? ` • ${formatShortTime(server.latest_snapshot_at)}` : "";
        const hostname = server.hostname ? ` (${server.hostname})` : "";
        return `<option value="${escapeHtml(server.slug)}">${escapeHtml(server.name)}${escapeHtml(hostname)}${escapeHtml(latest)}</option>`;
      })
      .join("");
    if (selectedValue) {
      select.value = selectedValue;
      currentServer = select.value;
    }
    const selected = knownServers.find((s) => s.slug === currentServer) || knownServers[0] || null;
    if (selected && currentServer !== selected.slug) {
      currentServer = selected.slug;
      select.value = selected.slug;
    }
    setSelectedServerMeta(selected);
  }

  function syncServerStateFromResponse(data) {
    if (Array.isArray(data?.servers)) {
      renderServerSelector(data.servers, data.selected_server || data?.snapshot?.server || null);
    } else if (data?.selected_server) {
      setSelectedServerMeta(data.selected_server);
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toNumber(value, fallback = null) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  function formatPct(value) {
    const n = toNumber(value);
    return n == null ? "-" : `${n.toFixed(1)}%`;
  }

  function formatInt(value) {
    const n = toNumber(value);
    return n == null ? "-" : new Intl.NumberFormat().format(Math.round(n));
  }

  function formatBytes(value) {
    const n = toNumber(value);
    if (n == null) return "-";
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let num = Math.max(0, n);
    let idx = 0;
    while (num >= 1024 && idx < units.length - 1) {
      num /= 1024;
      idx += 1;
    }
    return `${num.toFixed(num >= 100 ? 0 : num >= 10 ? 1 : 2)} ${units[idx]}`;
  }

  function formatRate(bytesPerSec) {
    const n = toNumber(bytesPerSec);
    return n == null ? "-" : `${formatBytes(n)}/s`;
  }

  function formatIOPS(readIops, writeIops) {
    const r = toNumber(readIops, 0);
    const w = toNumber(writeIops, 0);
    return `${Math.round(r)} / ${Math.round(w)}`;
  }

  function formatTime(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return date.toLocaleString();
  }

  function formatShortTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setMeter(id, percent) {
    const el = document.getElementById(id);
    if (!el) return;
    const n = toNumber(percent, 0);
    el.style.width = `${clamp(n, 0, 100)}%`;
  }

  function bottleneckClass(label) {
    return `state-${String(label || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  function updateBottleneck(bottleneck) {
    const pill = document.getElementById("bottleneck-pill");
    if (!pill) return;
    const label = bottleneck?.title || "Unknown";
    const rawLabel = bottleneck?.label || "unknown";
    pill.className = `status-pill ${bottleneckClass(rawLabel)}`;
    pill.textContent = label;
    const confidence = toNumber(bottleneck?.confidence);
    setText("bottleneck-confidence", confidence == null ? "-" : `confidence ${Math.round(confidence * 100)}%`);
    setText("bottleneck-reason", bottleneck?.reason || "No explanation available.");
  }

  function renderGpuTable(gpus) {
    const tbody = document.getElementById("gpu-table-body");
    if (!tbody) return;
    if (!Array.isArray(gpus) || gpus.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No GPU samples yet</td></tr>';
      return;
    }

    tbody.innerHTML = gpus.map((gpu) => {
      const name = `${gpu.gpu_index}: ${gpu.name || "GPU"}`;
      const mem = gpu.memory_total_bytes
        ? `${formatPct(gpu.memory_percent)} (${formatBytes(gpu.memory_used_bytes)} / ${formatBytes(gpu.memory_total_bytes)})`
        : formatPct(gpu.memory_percent);
      const power = toNumber(gpu.power_w) == null
        ? "-"
        : `${gpu.power_w.toFixed(0)}W${toNumber(gpu.power_limit_w) == null ? "" : ` / ${gpu.power_limit_w.toFixed(0)}W`}`;
      return `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td class="table-number">${formatPct(gpu.utilization_gpu_percent)}</td>
          <td class="table-number">${escapeHtml(mem)}</td>
          <td class="table-number">${toNumber(gpu.temperature_c) == null ? "-" : `${gpu.temperature_c.toFixed(0)} C`}</td>
          <td class="table-number">${escapeHtml(power)}</td>
        </tr>
      `;
    }).join("");
  }

  function renderDiskTable(disks) {
    const tbody = document.getElementById("disk-table-body");
    if (!tbody) return;
    if (!Array.isArray(disks) || disks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No disk samples yet</td></tr>';
      return;
    }

    const sorted = [...disks].sort((a, b) => (b.util_percent ?? 0) - (a.util_percent ?? 0));
    tbody.innerHTML = sorted.map((disk) => `
      <tr>
        <td class="table-number">${escapeHtml(disk.device || "-")}</td>
        <td class="table-number">${formatPct(disk.util_percent)}</td>
        <td class="table-number">${formatRate(disk.read_bps)}</td>
        <td class="table-number">${formatRate(disk.write_bps)}</td>
        <td class="table-number">${formatIOPS(disk.read_iops, disk.write_iops)}</td>
      </tr>
    `).join("");
  }

  function renderLatest(snapshot) {
    if (!snapshot) return;
    if (snapshot.server?.slug) {
      currentServer = snapshot.server.slug;
      setSelectedServerMeta(snapshot.server);
    }

    setText("last-sample-time", formatTime(snapshot.collected_at));
    const age = toNumber(snapshot.age_seconds);
    setText("sample-age", age == null ? "-" : `${age.toFixed(age < 10 ? 1 : 0)}s`);

    setText("process-count", formatInt(snapshot.process_count));
    setText("gpu-count", formatInt(snapshot.gpu?.count ?? 0));
    setText("disk-count", formatInt(snapshot.disk?.devices?.length ?? 0));

    const cpuUsage = snapshot.cpu?.usage_percent;
    setText("cpu-value", formatPct(cpuUsage));
    setMeter("cpu-bar", cpuUsage);
    setText(
      "cpu-detail",
      `load: ${fmt(snapshot.cpu?.load_1)} / ${fmt(snapshot.cpu?.load_5)} / ${fmt(snapshot.cpu?.load_15)}`
    );

    const gpuTop = snapshot.gpu?.top_util_percent;
    const gpuAvg = snapshot.gpu?.avg_util_percent;
    const gpuMem = snapshot.gpu?.top_memory_percent;
    setText("gpu-value", snapshot.gpu?.present ? formatPct(gpuTop) : "No GPU");
    setMeter("gpu-bar", gpuTop ?? 0);
    setText("gpu-detail", `avg: ${formatPct(gpuAvg)} | mem: ${formatPct(gpuMem)}`);

    setText("memory-value", formatPct(snapshot.memory?.percent));
    setMeter("memory-bar", snapshot.memory?.percent);
    setText(
      "memory-detail",
      `${formatBytes(snapshot.memory?.used_bytes)} / ${formatBytes(snapshot.memory?.total_bytes)} | swap ${formatPct(snapshot.memory?.swap_percent)}`
    );

    setText("disk-util-value", formatPct(snapshot.disk?.util_percent));
    setMeter("disk-bar", snapshot.disk?.util_percent);
    setText(
      "disk-detail",
      `read: ${formatRate(snapshot.disk?.read_bps)} | write: ${formatRate(snapshot.disk?.write_bps)}`
    );

    const rx = snapshot.network?.rx_bps ?? 0;
    const tx = snapshot.network?.tx_bps ?? 0;
    setText("network-value", `rx ${formatRate(rx)}`);
    setMeter("network-bar", clamp(((rx + tx) / (1024 * 1024 * 1024)) * 100, 0, 100));
    setText("network-detail", `tx: ${formatRate(tx)}`);

    const iowait = snapshot.cpu?.iowait_percent;
    setText("iowait-value", formatPct(iowait));
    setMeter("iowait-bar", iowait ?? 0);

    updateBottleneck(snapshot.bottleneck);
    renderGpuTable(snapshot.gpu?.devices || []);
    renderDiskTable(snapshot.disk?.devices || []);
  }

  function fmt(value) {
    const n = toNumber(value);
    return n == null ? "-" : n.toFixed(2);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildHistorySeries(points) {
    const labels = points.map((p) => formatShortTime(p.collected_at));
    const out = {
      labels,
      cpu: new Array(points.length).fill(null),
      gpuTop: new Array(points.length).fill(null),
      gpuAvg: new Array(points.length).fill(null),
      mem: new Array(points.length).fill(null),
      swap: new Array(points.length).fill(null),
      diskUtil: new Array(points.length).fill(null),
      diskReadMBs: new Array(points.length).fill(null),
      diskWriteMBs: new Array(points.length).fill(null),
      netRxMBs: new Array(points.length).fill(null),
      netTxMBs: new Array(points.length).fill(null),
      gpuLines: {},
      diskLines: {},
    };

    function ensureLine(map, key) {
      if (!map[key]) {
        map[key] = new Array(points.length).fill(null);
      }
      return map[key];
    }

    points.forEach((p, i) => {
      out.cpu[i] = toNumber(p.cpu_usage_percent);
      out.gpuTop[i] = toNumber(p.gpu_top_util_percent);
      out.gpuAvg[i] = toNumber(p.gpu_avg_util_percent);
      out.mem[i] = toNumber(p.memory_percent);
      out.swap[i] = toNumber(p.swap_percent);
      out.diskUtil[i] = toNumber(p.disk_util_percent);
      out.diskReadMBs[i] = toNumber(p.disk_read_bps) == null ? null : p.disk_read_bps / 1024 / 1024;
      out.diskWriteMBs[i] = toNumber(p.disk_write_bps) == null ? null : p.disk_write_bps / 1024 / 1024;
      out.netRxMBs[i] = toNumber(p.network_rx_bps) == null ? null : p.network_rx_bps / 1024 / 1024;
      out.netTxMBs[i] = toNumber(p.network_tx_bps) == null ? null : p.network_tx_bps / 1024 / 1024;

      if (Array.isArray(p.gpus)) {
        p.gpus.forEach((gpu) => {
          const key = `GPU ${gpu.gpu_index}`;
          ensureLine(out.gpuLines, key)[i] = toNumber(gpu.utilization_gpu_percent);
        });
      }
      if (Array.isArray(p.disks)) {
        p.disks.forEach((disk) => {
          const key = disk.device || "disk";
          ensureLine(out.diskLines, key)[i] = toNumber(disk.util_percent);
        });
      }
    });

    return out;
  }

  function chartOptions({ yTitle, maxY = null }) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          grid: { color: "rgba(151, 179, 206, 0.08)" },
          ticks: { color: "#9cb2ca", maxTicksLimit: 8 },
        },
        y: {
          beginAtZero: true,
          max: maxY,
          grid: { color: "rgba(151, 179, 206, 0.08)" },
          ticks: { color: "#9cb2ca" },
          title: { display: !!yTitle, text: yTitle, color: "#9cb2ca" },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#d9e7f5",
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: "rgba(8, 16, 24, 0.92)",
          borderColor: "rgba(151, 179, 206, 0.18)",
          borderWidth: 1,
          titleColor: "#ecf5ff",
          bodyColor: "#d7e8fa",
        },
      },
      elements: {
        line: { tension: 0.25, borderWidth: 2 },
        point: { radius: 0, hitRadius: 8, hoverRadius: 3 },
      },
    };
  }

  function renderChart(key, canvasId, labels, datasets, optionsConfig) {
    if (typeof Chart === "undefined") return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[key]) {
      charts[key].destroy();
    }
    charts[key] = new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: chartOptions(optionsConfig),
    });
  }

  function seriesDataset(label, data, color, extras = {}) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      spanGaps: true,
      ...extras,
    };
  }

  function renderHistory(points) {
    const series = buildHistorySeries(points || []);
    const labels = series.labels;

    renderChart(
      "pipeline",
      "pipeline-chart",
      labels,
      [
        seriesDataset("CPU", series.cpu, "#5bb4ff"),
        seriesDataset("GPU (max)", series.gpuTop, "#33e0a1"),
        seriesDataset("Memory", series.mem, "#ffbf5f"),
        seriesDataset("Disk util (max)", series.diskUtil, "#ff6f91"),
      ],
      { yTitle: "Percent", maxY: 100 }
    );

    renderChart(
      "throughput",
      "throughput-chart",
      labels,
      [
        seriesDataset("Disk Read MB/s", series.diskReadMBs, "#ff6f91"),
        seriesDataset("Disk Write MB/s", series.diskWriteMBs, "#ff9bb3"),
        seriesDataset("Net RX MB/s", series.netRxMBs, "#a98cff"),
        seriesDataset("Net TX MB/s", series.netTxMBs, "#cdb8ff"),
      ],
      { yTitle: "MB/s" }
    );

    const gpuLineEntries = Object.entries(series.gpuLines);
    const gpuDatasets = gpuLineEntries.length
      ? gpuLineEntries.map(([label, data], idx) =>
          seriesDataset(label, data, palette[idx % palette.length]))
      : [seriesDataset("No GPU data", new Array(labels.length).fill(null), "#56728f", { borderDash: [6, 6] })];

    renderChart("gpu", "gpu-chart", labels, gpuDatasets, { yTitle: "Percent", maxY: 100 });

    const diskLineEntries = Object.entries(series.diskLines);
    const diskDatasets = diskLineEntries.length
      ? diskLineEntries.map(([label, data], idx) =>
          seriesDataset(label, data, palette[idx % palette.length]))
      : [seriesDataset("No disk data", new Array(labels.length).fill(null), "#56728f", { borderDash: [6, 6] })];

    renderChart("disk", "disk-chart", labels, diskDatasets, { yTitle: "Percent", maxY: 100 });
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = data?.error || `${response.status} ${response.statusText}`;
      const err = new Error(error);
      err.status = response.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function refreshLatest() {
    if (loadingLatest) return;
    loadingLatest = true;
    try {
      const data = await fetchJson(buildApiUrl(latestUrl));
      syncServerStateFromResponse(data);
      renderLatest(data.snapshot);
      setError("");
    } catch (error) {
      if (error.payload) {
        syncServerStateFromResponse(error.payload);
      }
      setError(`Latest metrics request failed: ${error.message}`);
    } finally {
      loadingLatest = false;
    }
  }

  async function refreshHistory() {
    if (loadingHistory) return;
    loadingHistory = true;
    try {
      const data = await fetchJson(buildApiUrl(historyUrl, { minutes: currentMinutes }));
      syncServerStateFromResponse(data);
      renderHistory(data.points || []);
      setError("");
    } catch (error) {
      if (error.payload) {
        syncServerStateFromResponse(error.payload);
      }
      setError(`History request failed: ${error.message}`);
    } finally {
      loadingHistory = false;
    }
  }

  function setRange(minutes) {
    currentMinutes = clamp(Number(minutes) || 60, 1, maxMinutes);
    document.querySelectorAll(".range-btn").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.minutes) === currentMinutes);
    });
    refreshHistory();
  }

  function setupRangeButtons() {
    const buttons = document.getElementById("history-range-buttons");
    if (!buttons) return;
    buttons.addEventListener("click", (event) => {
      const btn = event.target.closest(".range-btn");
      if (!btn) return;
      setRange(btn.dataset.minutes);
    });

    const matching = [...buttons.querySelectorAll(".range-btn")]
      .map((btn) => Number(btn.dataset.minutes))
      .includes(currentMinutes);
    if (!matching) {
      currentMinutes = Math.min(maxMinutes, 60);
    }
    setRange(currentMinutes);
  }

  async function refreshServers() {
    if (loadingServers || !serversUrl) return;
    loadingServers = true;
    try {
      const data = await fetchJson(serversUrl);
      const selectedFromList = data.servers.find((s) => s.slug === currentServer) || null;
      renderServerSelector(data.servers || [], selectedFromList);
      setError("");
    } catch (error) {
      setError(`Server list request failed: ${error.message}`);
    } finally {
      loadingServers = false;
    }
  }

  function setupServerSelector() {
    const select = document.getElementById("server-selector");
    if (!select) return;
    select.addEventListener("change", () => {
      const nextServer = (select.value || "").trim();
      if (nextServer === currentServer) return;
      currentServer = nextServer;
      const selected = knownServers.find((s) => s.slug === currentServer) || null;
      setSelectedServerMeta(selected);
      Promise.all([refreshLatest(), refreshHistory()]);
    });
  }

  function startPolling() {
    clearInterval(latestPollHandle);
    clearInterval(historyPollHandle);
    clearInterval(serversPollHandle);
    latestPollHandle = setInterval(refreshLatest, 4000);
    historyPollHandle = setInterval(refreshHistory, 20000);
    serversPollHandle = setInterval(refreshServers, 30000);
  }

  async function init() {
    if (typeof Chart !== "undefined") {
      Chart.defaults.color = "#d9e7f5";
      Chart.defaults.font.family = '"Space Grotesk", sans-serif';
      Chart.defaults.plugins.legend.display = true;
    }

    setupServerSelector();
    setupRangeButtons();
    await refreshServers();
    await Promise.all([refreshLatest(), refreshHistory()]);
    startPolling();
  }

  init();
})();
