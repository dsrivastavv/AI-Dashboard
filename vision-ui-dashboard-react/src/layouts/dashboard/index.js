import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import ReactApexChart from "react-apexcharts";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import VuiBox from "components/VuiBox";
import VuiButton from "components/VuiButton";
import VuiTypography from "components/VuiTypography";

import {
  ApiError,
  buildLoginRedirectUrl,
  buildLogoutRedirectUrl,
  getHistoryMetrics,
  getLatestMetrics,
  getServers,
} from "services/monitoringApi";

const HISTORY_PRESETS = [15, 60, 360, 1440];
const MAX_NETWORK_METER_MBPS = 1024;
const SERIES_COLORS = [
  "#0075FF",
  "#2CD9FF",
  "#05CD99",
  "#FFB547",
  "#FF6E91",
  "#A259FF",
  "#8F9BBA",
  "#00D4AA",
];

function toNumber(value, fallback = null) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value, digits = 1) {
  const n = toNumber(value);
  return n == null ? "-" : `${n.toFixed(digits)}%`;
}

function formatInteger(value) {
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
  const digits = num >= 100 ? 0 : num >= 10 ? 1 : 2;
  return `${num.toFixed(digits)} ${units[idx]}`;
}

function formatRate(value) {
  const n = toNumber(value);
  return n == null ? "-" : `${formatBytes(n)}/s`;
}

function formatMBps(value) {
  const n = toNumber(value);
  return n == null ? null : n / (1024 * 1024);
}

function formatCompactRate(value) {
  const n = toNumber(value);
  if (n == null) return "-";
  return `${formatMBps(n)?.toFixed(1)} MB/s`;
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString();
}

function formatShortTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatAgeSeconds(ageSeconds) {
  const n = toNumber(ageSeconds);
  if (n == null) return "-";
  if (n < 60) return `${n.toFixed(n < 10 ? 1 : 0)}s`;
  if (n < 3600) return `${(n / 60).toFixed(1)}m`;
  return `${(n / 3600).toFixed(1)}h`;
}

function bottleneckChipColor(label) {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("gpu-bound") || normalized === "balanced") return "success";
  if (normalized.includes("cpu-bound")) return "info";
  if (normalized.includes("io-bound")) return "error";
  if (normalized.includes("memory")) return "warning";
  if (normalized === "idle") return "default";
  return "secondary";
}

function chartOptions({ categories, yAxisTitle, maxY, valueSuffix = "", formatter } = {}) {
  return {
    chart: {
      toolbar: { show: false },
      animations: { enabled: false },
      foreColor: "#A0AEC0",
      zoom: { enabled: false },
    },
    tooltip: {
      theme: "dark",
      x: { formatter: (value) => formatDateTime(value) },
      y: {
        formatter: (value) => {
          const n = toNumber(value);
          if (n == null) return "-";
          if (formatter) return formatter(n);
          return `${n.toFixed(1)}${valueSuffix}`;
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      type: "datetime",
      categories,
      labels: {
        style: { colors: "#A0AEC0", fontSize: "10px" },
        datetimeUTC: false,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      max: maxY ?? undefined,
      min: 0,
      tickAmount: 4,
      labels: {
        style: { colors: "#A0AEC0", fontSize: "10px" },
        formatter: (value) => {
          const n = toNumber(value);
          if (n == null) return "-";
          if (formatter) return formatter(n);
          return `${Math.round(n)}${valueSuffix}`;
        },
      },
      title: yAxisTitle
        ? {
            text: yAxisTitle,
            style: { color: "#A0AEC0", fontSize: "11px", fontWeight: 500 },
          }
        : undefined,
    },
    legend: {
      show: true,
      labels: { colors: "#A0AEC0" },
      position: "top",
      horizontalAlign: "left",
      fontSize: "12px",
    },
    grid: {
      borderColor: "#2D2E5F",
      strokeDashArray: 4,
    },
    colors: SERIES_COLORS,
  };
}

function summarizeHistory(points) {
  const safePoints = Array.isArray(points) ? points : [];
  const categories = safePoints.map((p) => p.collected_at);
  const pipeline = [
    { name: "CPU", data: safePoints.map((p) => toNumber(p.cpu_usage_percent)) },
    { name: "GPU (max)", data: safePoints.map((p) => toNumber(p.gpu_top_util_percent)) },
    { name: "Memory", data: safePoints.map((p) => toNumber(p.memory_percent)) },
    { name: "Disk util", data: safePoints.map((p) => toNumber(p.disk_util_percent)) },
  ];

  const throughput = [
    {
      name: "Disk Read",
      data: safePoints.map((p) => formatMBps(p.disk_read_bps)),
    },
    {
      name: "Disk Write",
      data: safePoints.map((p) => formatMBps(p.disk_write_bps)),
    },
    {
      name: "Net RX",
      data: safePoints.map((p) => formatMBps(p.network_rx_bps)),
    },
    {
      name: "Net TX",
      data: safePoints.map((p) => formatMBps(p.network_tx_bps)),
    },
  ];

  const gpuSeriesMap = new Map();
  const diskSeriesMap = new Map();
  safePoints.forEach((point, index) => {
    (point.gpus || []).forEach((gpu) => {
      const key = `GPU ${gpu.gpu_index}`;
      if (!gpuSeriesMap.has(key)) gpuSeriesMap.set(key, new Array(safePoints.length).fill(null));
      gpuSeriesMap.get(key)[index] = toNumber(gpu.utilization_gpu_percent);
    });
    (point.disks || []).forEach((disk) => {
      const key = disk.device || "disk";
      if (!diskSeriesMap.has(key)) diskSeriesMap.set(key, new Array(safePoints.length).fill(null));
      diskSeriesMap.get(key)[index] = toNumber(disk.util_percent);
    });
  });

  const gpuSeries =
    gpuSeriesMap.size > 0
      ? Array.from(gpuSeriesMap.entries()).map(([name, data]) => ({ name, data }))
      : [{ name: "No GPU data", data: new Array(safePoints.length).fill(null) }];

  const diskSeries =
    diskSeriesMap.size > 0
      ? Array.from(diskSeriesMap.entries()).map(([name, data]) => ({ name, data }))
      : [{ name: "No disk data", data: new Array(safePoints.length).fill(null) }];

  return { categories, pipeline, throughput, gpuSeries, diskSeries };
}

function HealthMetricCard({ title, value, subtitle, progress, icon, accent = "info" }) {
  return (
    <Card sx={{ p: 2.2, height: "100%" }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
        <VuiBox>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            {title}
          </VuiTypography>
          <VuiTypography variant="h5" color="white" fontWeight="bold" mt={0.5}>
            {value}
          </VuiTypography>
        </VuiBox>
        <VuiBox
          bgColor={accent}
          color="white"
          width="42px"
          height="42px"
          borderRadius="lg"
          display="flex"
          justifyContent="center"
          alignItems="center"
          shadow="md"
          sx={{ opacity: 0.95 }}
        >
          {icon}
        </VuiBox>
      </Stack>
      <VuiTypography variant="caption" color="text" mt={1.5} display="block">
        {subtitle}
      </VuiTypography>
      <LinearProgress
        variant="determinate"
        value={clamp(toNumber(progress, 0) || 0, 0, 100)}
        sx={{
          mt: 1.5,
          height: 7,
          borderRadius: 999,
          backgroundColor: "#1A1F37",
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
          },
        }}
        color={accent}
      />
    </Card>
  );
}

function ChartCard({ title, subtitle, chartType = "area", series, options, height = 300 }) {
  return (
    <Card sx={{ p: 2.2, height: "100%" }}>
      <VuiTypography variant="lg" color="white" fontWeight="bold">
        {title}
      </VuiTypography>
      <VuiTypography variant="button" color="text" display="block" mb={2}>
        {subtitle}
      </VuiTypography>
      <Box sx={{ height }}>
        <ReactApexChart type={chartType} series={series} options={options} height={height} width="100%" />
      </Box>
    </Card>
  );
}

function tableCellSx() {
  return {
    borderColor: "#2D2E5F",
    color: "#fff",
    fontSize: "0.82rem",
    py: 1.1,
    whiteSpace: "nowrap",
  };
}

function headerCellSx() {
  return {
    borderColor: "#2D2E5F",
    color: "#A0AEC0",
    fontSize: "0.7rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    py: 1,
  };
}

function Dashboard() {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("server") || "").trim();
  });
  const [selectedServerMeta, setSelectedServerMeta] = useState(null);
  const [latestSnapshot, setLatestSnapshot] = useState(null);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [historyMinutes, setHistoryMinutes] = useState(60);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedServerDetails = useMemo(() => {
    if (selectedServerMeta?.slug) return selectedServerMeta;
    return servers.find((server) => server.slug === selectedServer) || null;
  }, [servers, selectedServer, selectedServerMeta]);

  const historySummary = useMemo(() => summarizeHistory(historyPoints), [historyPoints]);

  const syncServersFromPayload = (payload) => {
    if (!payload || !Array.isArray(payload.servers)) return;

    setServers(payload.servers);

    const selectedFromPayload =
      payload.selected_server?.slug ||
      payload.snapshot?.server?.slug ||
      "";

    setSelectedServer((current) => {
      const currentExists = current && payload.servers.some((server) => server.slug === current);
      if (currentExists && !selectedFromPayload) return current;
      if (selectedFromPayload) return selectedFromPayload;
      const fallback =
        payload.servers.find((server) => Number(server.snapshot_count || 0) > 0) || payload.servers[0];
      return fallback?.slug || "";
    });

    const selectedMeta =
      payload.selected_server ||
      payload.snapshot?.server ||
      payload.servers.find((server) => server.slug === selectedServer) ||
      null;
    if (selectedMeta) {
      setSelectedServerMeta(selectedMeta);
    }
  };

  const handleApiError = (error, { clearLatest = false } = {}) => {
    if (error instanceof ApiError && error.authRedirect) {
      const accessDenied = new URLSearchParams(window.location.search).get("access_denied") === "1";
      if (accessDenied) {
        setErrorMessage("Access denied: your Google account is not in the backend allowlist.");
        return;
      }
      window.location.assign(error.loginUrl || buildLoginRedirectUrl("/dashboard"));
      return;
    }

    if (error?.payload) {
      syncServersFromPayload(error.payload);
    }
    if (clearLatest) {
      setLatestSnapshot(null);
    }
    setErrorMessage(error?.message || "Request failed.");
  };

  const refreshServers = async () => {
    setIsLoadingServers((current) => current && servers.length === 0);
    try {
      const data = await getServers();
      syncServersFromPayload(data);
      setErrorMessage("");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoadingServers(false);
    }
  };

  const refreshLatest = async () => {
    setIsLoadingLatest((current) => current && !latestSnapshot);
    try {
      const data = await getLatestMetrics(selectedServer);
      syncServersFromPayload(data);
      setLatestSnapshot(data.snapshot || null);
      setErrorMessage("");
    } catch (error) {
      handleApiError(error, { clearLatest: true });
    } finally {
      setIsLoadingLatest(false);
    }
  };

  const refreshHistory = async () => {
    setIsLoadingHistory((current) => current && historyPoints.length === 0);
    try {
      const data = await getHistoryMetrics({ server: selectedServer, minutes: historyMinutes });
      syncServersFromPayload(data);
      setHistoryPoints(Array.isArray(data.points) ? data.points : []);
      setErrorMessage("");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshServers(), refreshLatest(), refreshHistory()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedServer) {
      url.searchParams.set("server", selectedServer);
    } else {
      url.searchParams.delete("server");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [selectedServer]);

  useEffect(() => {
    refreshServers();
  }, []);

  useEffect(() => {
    refreshLatest();
    refreshHistory();

    const latestTimer = window.setInterval(refreshLatest, 4000);
    const historyTimer = window.setInterval(refreshHistory, 20000);

    return () => {
      window.clearInterval(latestTimer);
      window.clearInterval(historyTimer);
    };
  }, [selectedServer, historyMinutes]);

  useEffect(() => {
    const serverTimer = window.setInterval(refreshServers, 30000);
    return () => window.clearInterval(serverTimer);
  }, [selectedServer]);

  const cpuUsage = latestSnapshot?.cpu?.usage_percent;
  const gpuTopUtil = latestSnapshot?.gpu?.top_util_percent;
  const memoryPct = latestSnapshot?.memory?.percent;
  const diskUtil = latestSnapshot?.disk?.util_percent;
  const netRx = latestSnapshot?.network?.rx_bps;
  const netTx = latestSnapshot?.network?.tx_bps;
  const iowait = latestSnapshot?.cpu?.iowait_percent;
  const gpuDevices = latestSnapshot?.gpu?.devices || [];
  const diskDevices = [...(latestSnapshot?.disk?.devices || [])].sort(
    (a, b) => (b.util_percent || 0) - (a.util_percent || 0)
  );
  const bottleneck = latestSnapshot?.bottleneck || null;
  const networkMeterValue = clamp(
    (((toNumber(netRx, 0) || 0) + (toNumber(netTx, 0) || 0)) / (1024 * 1024)) / MAX_NETWORK_METER_MBPS * 100,
    0,
    100
  );

  const pipelineChartOptions = useMemo(
    () =>
      chartOptions({
        categories: historySummary.categories,
        yAxisTitle: "Percent",
        maxY: 100,
        valueSuffix: "%",
      }),
    [historySummary.categories]
  );

  const throughputChartOptions = useMemo(
    () =>
      chartOptions({
        categories: historySummary.categories,
        yAxisTitle: "MB/s",
        formatter: (value) => `${value.toFixed(value >= 100 ? 0 : 1)} MB/s`,
      }),
    [historySummary.categories]
  );

  const deviceUtilChartOptions = useMemo(
    () =>
      chartOptions({
        categories: historySummary.categories,
        yAxisTitle: "Percent",
        maxY: 100,
        valueSuffix: "%",
      }),
    [historySummary.categories]
  );

  const selectedHasData = !!latestSnapshot;
  const noServersRegistered = !isLoadingServers && servers.length === 0;
  const logoutUrl = buildLogoutRedirectUrl("/authentication/sign-in");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <Card sx={{ p: 2.5, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} lg={7}>
              <VuiTypography variant="h4" color="white" fontWeight="bold">
                AI Workload System Health
              </VuiTypography>
              <VuiTypography variant="button" color="text" display="block" mt={1}>
                Multi-server CPU / GPU / memory / disk I/O telemetry with bottleneck heuristics.
              </VuiTypography>
              <Stack direction="row" spacing={1} alignItems="center" mt={2} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<RouterRoundedIcon />}
                  label={
                    selectedServerDetails
                      ? `${selectedServerDetails.name}${selectedServerDetails.hostname ? ` (${selectedServerDetails.hostname})` : ""}`
                      : "No server selected"
                  }
                  sx={{ color: "#fff", background: "#1A1F37" }}
                />
                {selectedServerDetails?.last_seen_at && (
                  <Chip
                    icon={<AccessTimeRoundedIcon />}
                    label={`Last seen ${formatDateTime(selectedServerDetails.last_seen_at)}`}
                    variant="outlined"
                    sx={{ color: "#A0AEC0", borderColor: "#2D2E5F" }}
                  />
                )}
                {selectedServerDetails?.last_agent_version && (
                  <Chip
                    label={`Agent ${selectedServerDetails.last_agent_version}`}
                    variant="outlined"
                    sx={{ color: "#A0AEC0", borderColor: "#2D2E5F" }}
                  />
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedServer}
                      onChange={(event) => {
                        setSelectedServer(event.target.value);
                        setSelectedServerMeta(
                          servers.find((server) => server.slug === event.target.value) || null
                        );
                        setLatestSnapshot(null);
                        setHistoryPoints([]);
                        setErrorMessage("");
                      }}
                      displayEmpty
                      disabled={isLoadingServers || servers.length === 0}
                      sx={{
                        color: "#fff",
                        minHeight: "42px",
                        ".MuiOutlinedInput-notchedOutline": { borderColor: "#2D2E5F" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#4A4D78" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0075FF" },
                        ".MuiSvgIcon-root": { color: "#A0AEC0" },
                        background: "#0F1535",
                      }}
                    >
                      {servers.length === 0 && <MenuItem value="">No servers registered</MenuItem>}
                      {servers.map((server) => (
                        <MenuItem key={server.slug} value={server.slug}>
                          {server.name}
                          {server.hostname ? ` (${server.hostname})` : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="Refresh now">
                    <span>
                      <IconButton
                        onClick={refreshAll}
                        disabled={isRefreshing}
                        sx={{
                          color: "#fff",
                          background: "#0075FF",
                          "&:hover": { background: "#0060D0" },
                        }}
                      >
                        {isRefreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshRoundedIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Log out">
                    <IconButton
                      component="a"
                      href={logoutUrl}
                      sx={{
                        color: "#A0AEC0",
                        border: "1px solid #2D2E5F",
                        borderRadius: "12px",
                      }}
                    >
                      <LogoutRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {HISTORY_PRESETS.map((minutes) => (
                    <VuiButton
                      key={minutes}
                      size="small"
                      variant={historyMinutes === minutes ? "contained" : "outlined"}
                      color={historyMinutes === minutes ? "info" : "white"}
                      onClick={() => setHistoryMinutes(minutes)}
                    >
                      {minutes < 60
                        ? `${minutes}m`
                        : minutes < 1440
                        ? `${Math.round(minutes / 60)}h`
                        : `${Math.round(minutes / 1440)}d`}
                    </VuiButton>
                  ))}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {errorMessage && (
          <Alert
            severity="warning"
            icon={<WarningAmberRoundedIcon fontSize="inherit" />}
            sx={{ mb: 3, color: "#fff", background: "rgba(255, 181, 71, 0.12)", border: "1px solid rgba(255,181,71,0.25)" }}
          >
            {errorMessage}
          </Alert>
        )}

        {noServersRegistered && (
          <Card sx={{ p: 2.5, mb: 3 }}>
            <VuiTypography variant="lg" color="white" fontWeight="bold">
              No monitored servers registered yet
            </VuiTypography>
            <VuiTypography variant="button" color="text" display="block" mt={1}>
              Create a server entry and start the agent on your training host.
            </VuiTypography>
            <VuiBox mt={2} p={2} borderRadius="lg" sx={{ background: "#0F1535", border: "1px solid #2D2E5F" }}>
              <VuiTypography
                variant="caption"
                color="white"
                component="pre"
                sx={{ m: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}
              >
{`python3 manage.py register_server gpu-box-01 --name "GPU Box 01"
cd agent_service && pip install .
ai-dashboard-agent --host http://<webapp-host>:8000 --server-slug gpu-box-01 --token '<INGEST_TOKEN>' --interval 2`}
              </VuiTypography>
            </VuiBox>
          </Card>
        )}

        {selectedHasData && (
          <Card sx={{ p: 2.2, mb: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <VuiBox>
                <VuiTypography variant="button" color="text">
                  Training bottleneck
                </VuiTypography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.8}>
                  <Chip
                    label={bottleneck?.title || "Unknown"}
                    color={bottleneckChipColor(bottleneck?.label)}
                    sx={{ color: "#fff", fontWeight: 600 }}
                  />
                  <VuiTypography variant="caption" color="text">
                    {bottleneck?.confidence != null ? `confidence ${Math.round(bottleneck.confidence * 100)}%` : ""}
                  </VuiTypography>
                </Stack>
                <VuiTypography variant="caption" color="text" display="block" mt={1}>
                  {bottleneck?.reason || "No reason available"}
                </VuiTypography>
              </VuiBox>
              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Processes ${formatInteger(latestSnapshot?.process_count)}`}
                  sx={{ color: "#fff", background: "#1A1F37" }}
                />
                <Chip
                  label={`GPUs ${formatInteger(latestSnapshot?.gpu?.count || 0)}`}
                  sx={{ color: "#fff", background: "#1A1F37" }}
                />
                <Chip
                  label={`Disks ${formatInteger(latestSnapshot?.disk?.devices?.length || 0)}`}
                  sx={{ color: "#fff", background: "#1A1F37" }}
                />
                <Chip
                  label={`Sample ${formatShortTime(latestSnapshot?.collected_at)} (${formatAgeSeconds(
                    latestSnapshot?.age_seconds
                  )})`}
                  icon={<AccessTimeRoundedIcon />}
                  variant="outlined"
                  sx={{ color: "#A0AEC0", borderColor: "#2D2E5F" }}
                />
              </Stack>
            </Stack>
          </Card>
        )}

        <Grid container spacing={3} mb={0.5}>
          <Grid item xs={12} md={6} xl={4}>
            <HealthMetricCard
              title="CPU Usage"
              value={formatPercent(cpuUsage)}
              subtitle={`load ${toNumber(latestSnapshot?.cpu?.load_1) != null ? latestSnapshot.cpu.load_1.toFixed(2) : "-"} / ${
                toNumber(latestSnapshot?.cpu?.load_5) != null ? latestSnapshot.cpu.load_5.toFixed(2) : "-"
              } / ${toNumber(latestSnapshot?.cpu?.load_15) != null ? latestSnapshot.cpu.load_15.toFixed(2) : "-"}`}
              progress={cpuUsage || 0}
              icon={<MemoryRoundedIcon fontSize="small" />}
              accent="info"
            />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <HealthMetricCard
              title="GPU Utilization"
              value={latestSnapshot?.gpu?.present ? formatPercent(gpuTopUtil) : "No GPU"}
              subtitle={`avg ${formatPercent(latestSnapshot?.gpu?.avg_util_percent)} | mem ${formatPercent(
                latestSnapshot?.gpu?.top_memory_percent
              )}`}
              progress={gpuTopUtil || 0}
              icon={<GraphicEqRoundedIcon fontSize="small" />}
              accent="success"
            />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <HealthMetricCard
              title="Memory"
              value={formatPercent(memoryPct)}
              subtitle={`${formatBytes(latestSnapshot?.memory?.used_bytes)} / ${formatBytes(
                latestSnapshot?.memory?.total_bytes
              )} | swap ${formatPercent(latestSnapshot?.memory?.swap_percent)}`}
              progress={memoryPct || 0}
              icon={<DonutLargeRoundedIcon fontSize="small" />}
              accent="warning"
            />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <HealthMetricCard
              title="Disk I/O Util"
              value={formatPercent(diskUtil)}
              subtitle={`read ${formatRate(latestSnapshot?.disk?.read_bps)} | write ${formatRate(
                latestSnapshot?.disk?.write_bps
              )}`}
              progress={diskUtil || 0}
              icon={<StorageRoundedIcon fontSize="small" />}
              accent="error"
            />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <HealthMetricCard
              title="Network"
              value={`RX ${formatCompactRate(netRx)}`}
              subtitle={`TX ${formatCompactRate(netTx)}`}
              progress={networkMeterValue}
              icon={<PublicRoundedIcon fontSize="small" />}
              accent="secondary"
            />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <HealthMetricCard
              title="CPU IOWait"
              value={formatPercent(iowait)}
              subtitle="High iowait can indicate dataloader / storage bottlenecks"
              progress={iowait || 0}
              icon={<AccessTimeRoundedIcon fontSize="small" />}
              accent="warning"
            />
          </Grid>
        </Grid>

        {(isLoadingLatest || isLoadingHistory) && (
          <LinearProgress sx={{ my: 2, borderRadius: 999, background: "#1A1F37" }} />
        )}

        <Grid container spacing={3} mt={0.5}>
          <Grid item xs={12} xl={6}>
            <ChartCard
              title="Pipeline Saturation"
              subtitle={`CPU vs GPU vs memory vs disk util (${historyMinutes}m window)`}
              chartType="area"
              series={historySummary.pipeline}
              options={pipelineChartOptions}
              height={320}
            />
          </Grid>
          <Grid item xs={12} xl={6}>
            <ChartCard
              title="Throughput"
              subtitle="Disk and network throughput (MB/s)"
              chartType="line"
              series={historySummary.throughput}
              options={throughputChartOptions}
              height={320}
            />
          </Grid>
          <Grid item xs={12} xl={6}>
            <ChartCard
              title="GPU Timeline"
              subtitle="Per-GPU utilization (%)"
              chartType="line"
              series={historySummary.gpuSeries}
              options={deviceUtilChartOptions}
              height={320}
            />
          </Grid>
          <Grid item xs={12} xl={6}>
            <ChartCard
              title="Disk Timeline"
              subtitle="Per-disk utilization (%)"
              chartType="line"
              series={historySummary.diskSeries}
              options={deviceUtilChartOptions}
              height={320}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} mt={0.5}>
          <Grid item xs={12} xl={6}>
            <Card sx={{ p: 2.2, height: "100%" }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold">
                Latest GPU Metrics
              </VuiTypography>
              <VuiTypography variant="button" color="text" display="block" mb={2}>
                Spot underfed GPUs, memory pressure, temperature and power ceilings
              </VuiTypography>
              <Divider sx={{ borderColor: "#2D2E5F", mb: 2 }} />
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>GPU</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Util</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Mem</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Temp</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Power</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gpuDevices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ ...tableCellSx(), color: "#A0AEC0" }}>
                          No GPU samples available for this server.
                        </TableCell>
                      </TableRow>
                    )}
                    {gpuDevices.map((gpu) => (
                      <TableRow key={`${gpu.gpu_index}-${gpu.uuid || gpu.name}`}>
                        <TableCell sx={tableCellSx()}>
                          {gpu.gpu_index}: {gpu.name || "GPU"}
                        </TableCell>
                        <TableCell sx={tableCellSx()}>{formatPercent(gpu.utilization_gpu_percent)}</TableCell>
                        <TableCell sx={tableCellSx()}>
                          {gpu.memory_total_bytes
                            ? `${formatPercent(gpu.memory_percent)} (${formatBytes(gpu.memory_used_bytes)} / ${formatBytes(
                                gpu.memory_total_bytes
                              )})`
                            : formatPercent(gpu.memory_percent)}
                        </TableCell>
                        <TableCell sx={tableCellSx()}>
                          {toNumber(gpu.temperature_c) == null ? "-" : `${gpu.temperature_c.toFixed(0)} C`}
                        </TableCell>
                        <TableCell sx={tableCellSx()}>
                          {toNumber(gpu.power_w) == null
                            ? "-"
                            : `${gpu.power_w.toFixed(0)}W${
                                toNumber(gpu.power_limit_w) == null ? "" : ` / ${gpu.power_limit_w.toFixed(0)}W`
                              }`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          <Grid item xs={12} xl={6}>
            <Card sx={{ p: 2.2, height: "100%" }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold">
                Latest Disk Metrics
              </VuiTypography>
              <VuiTypography variant="button" color="text" display="block" mb={2}>
                Track dataset loader pressure and NVMe saturation per device
              </VuiTypography>
              <Divider sx={{ borderColor: "#2D2E5F", mb: 2 }} />
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Device</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Util</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Read</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>Write</TableCell>
                      <TableCell sx={{ ...headerCellSx(), background: "#0F1535" }}>IOPS (R/W)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diskDevices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ ...tableCellSx(), color: "#A0AEC0" }}>
                          No disk samples available for this server.
                        </TableCell>
                      </TableRow>
                    )}
                    {diskDevices.map((disk) => (
                      <TableRow key={disk.device}>
                        <TableCell sx={tableCellSx()}>{disk.device}</TableCell>
                        <TableCell sx={tableCellSx()}>{formatPercent(disk.util_percent)}</TableCell>
                        <TableCell sx={tableCellSx()}>{formatRate(disk.read_bps)}</TableCell>
                        <TableCell sx={tableCellSx()}>{formatRate(disk.write_bps)}</TableCell>
                        <TableCell sx={tableCellSx()}>
                          {`${Math.round(toNumber(disk.read_iops, 0) || 0)} / ${Math.round(
                            toNumber(disk.write_iops, 0) || 0
                          )}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} mt={0.5}>
          <Grid item xs={12}>
            <Card sx={{ p: 2.2 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1.5}
              >
                <VuiBox>
                  <VuiTypography variant="button" color="white" fontWeight="bold">
                    Central dashboard / agent mode
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" display="block" mt={0.5}>
                    Register servers in Django and run `ai-dashboard-agent` on each host. Local Django collector still works for the dashboard host.
                  </VuiTypography>
                </VuiBox>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<RouterRoundedIcon />}
                    label={`Servers ${servers.length}`}
                    sx={{ color: "#fff", background: "#1A1F37" }}
                  />
                  <Chip
                    icon={<WarningAmberRoundedIcon />}
                    label={errorMessage ? "Needs attention" : "Healthy"}
                    color={errorMessage ? "warning" : "success"}
                    sx={{ color: "#fff" }}
                  />
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
