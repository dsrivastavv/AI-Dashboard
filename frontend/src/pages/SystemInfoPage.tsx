import { useOutletContext } from 'react-router-dom';
import {
  Cpu,
  HardDrive,
  Info,
  Monitor,
  Network,
  Server,
  Timer,
} from 'lucide-react';

import EmptyState from '../components/common/EmptyState';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import type { AgentSystemInfo, SystemInfoPartition, SystemInfoNetworkInterface } from '../types/api';
import { formatBytes, formatDateTime, formatPercent } from '../lib/format';
import { FRONTEND_VERSION } from '../version';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${days}d ${remHrs}h`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  accent?: boolean;
}

function InfoRow({ label, value, mono = false, accent = false }: InfoRowProps) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="sysinfo-row">
      <span className="sysinfo-label">{label}</span>
      <span className={`sysinfo-value${mono ? ' sysinfo-value--mono' : ''}${accent ? ' sysinfo-value--accent' : ''}`}>
        {String(value)}
      </span>
    </div>
  );
}

/** Thin labelled divider to separate sections inside a single composited card */
function SectionDivider({ label }: { label: string }) {
  return <div className="sysinfo-section-divider">{label}</div>;
}

interface SysCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  /** When true the card body grows to fill its grid cell height */
  fill?: boolean;
}

function SysCard({ title, icon, children, fill = false }: SysCardProps) {
  return (
    <div className={`panel-card sysinfo-card${fill ? ' sysinfo-card--fill' : ''}`}>
      <div className="sysinfo-card-head">
        <span className="sysinfo-card-head-icon">{icon}</span>
        <span className="sysinfo-card-head-title">{title}</span>
      </div>
      <div className={`sysinfo-card-body${fill ? ' sysinfo-card-body--fill' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function PartitionBar({ percent }: { percent: number }) {
  const color =
    percent >= 90 ? 'var(--accent-red)' :
    percent >= 75 ? 'var(--accent-yellow)' :
    'var(--entity-network)';
  return (
    <div className="sysinfo-part-bar-wrap">
      <div className="sysinfo-part-bar-track">
        <div
          className="sysinfo-part-bar-fill"
          style={{ width: `${Math.min(100, percent)}%`, background: color }}
        />
      </div>
      <span
        className="sysinfo-part-bar-pct"
        style={{ color }}
      >
        {formatPercent(percent, 0)}
      </span>
    </div>
  );
}

function PartitionsTable({ partitions }: { partitions: SystemInfoPartition[] }) {
  if (!partitions.length) {
    return <p className="sysinfo-empty">No partition data available.</p>;
  }
  return (
    <div className="table-responsive">
      <table className="table table-sm mb-0 sysinfo-table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Mount</th>
            <th>FS</th>
            <th className="text-end">Total</th>
            <th className="text-end">Used</th>
            <th className="text-end">Free</th>
            <th>Usage</th>
          </tr>
        </thead>
        <tbody>
          {partitions.map((p) => (
            <tr key={`${p.device}-${p.mountpoint}`}>
              <td><code className="sysinfo-code">{p.device || '—'}</code></td>
              <td><code className="sysinfo-code">{p.mountpoint}</code></td>
              <td>
                <span className="sysinfo-fs-badge">{p.fstype || '—'}</span>
              </td>
              <td className="text-end sysinfo-num">{p.total_bytes ? formatBytes(p.total_bytes) : '—'}</td>
              <td className="text-end sysinfo-num">{p.used_bytes ? formatBytes(p.used_bytes) : '—'}</td>
              <td className="text-end sysinfo-num">{p.free_bytes ? formatBytes(p.free_bytes) : '—'}</td>
              <td style={{ minWidth: '120px' }}>
                {p.total_bytes ? <PartitionBar percent={p.percent} /> : <span className="sysinfo-empty">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterfacesList({ interfaces }: { interfaces: SystemInfoNetworkInterface[] }) {
  const visible = interfaces.filter((i) => i.ipv4 || i.ipv6);
  if (!visible.length) {
    return <p className="sysinfo-empty">No interface data available.</p>;
  }
  return (
    <div className="sysinfo-iface-grid">
      {visible.map((iface) => (
        <div key={iface.name} className="sysinfo-iface-card">
          <div className="sysinfo-iface-name">{iface.name}</div>
          {iface.ipv4 ? (
            <div className="sysinfo-iface-addr">
              <span className="sysinfo-iface-proto">IPv4</span>
              <code className="sysinfo-iface-ip">{iface.ipv4}</code>
            </div>
          ) : null}
          {iface.ipv6 ? (
            <div className="sysinfo-iface-addr">
              <span className="sysinfo-iface-proto">IPv6</span>
              <code className="sysinfo-iface-ip sysinfo-iface-ip--v6">{iface.ipv6}</code>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SystemInfoPage() {
  const { data } = useOutletContext<AppLayoutContext>();
  const server = data.selectedServer;
  const sysInfo: AgentSystemInfo | undefined = server?.agent_info?.system_info as AgentSystemInfo | undefined;
  const backendVersion =
    data.latest.data?.backend_version ?? data.history.data?.backend_version ?? 'unknown';
  const minAgentVersion =
    data.latest.data?.min_agent_version ?? data.history.data?.min_agent_version ?? undefined;

  if (!server) {
    return (
      <EmptyState
        title="No server selected"
        message="Select a server from the sidebar to view its system information."
      />
    );
  }

  if (!sysInfo) {
    return (
      <EmptyState
        title="System information not yet available"
        message="The agent will send system information on its next heartbeat. Start the agent and refresh."
      />
    );
  }

  const uptimeStr = formatUptime(sysInfo.uptime_seconds);
  const agentVersion = server.last_agent_version || (server.agent_info?.version as string | undefined) || '—';
  const rawAgentUser = server.agent_user || (server.agent_info?.user as string | undefined) || '';
  const agentUser = rawAgentUser.trim()
    ? (rawAgentUser.trim().toLowerCase() === 'root' ? 'Administrator' : rawAgentUser.trim())
    : '—';

  return (
    <div className="app-main-inner sysinfo-page">

      {/* ── Page header ── */}
      <div className="sysinfo-page-header">
        <div className="sysinfo-page-header-icon">
          <Monitor size={18} aria-hidden="true" />
        </div>
        <div>
          <div className="sysinfo-page-header-title">{server.name}</div>
          <div className="sysinfo-page-header-sub">
            {sysInfo.hostname || server.hostname}
            <span className="sysinfo-page-header-sep" aria-hidden="true">·</span>
            {sysInfo.os_name} {sysInfo.os_release}
            <span className="sysinfo-page-header-sep" aria-hidden="true">·</span>
            {sysInfo.machine}
          </div>
        </div>
      </div>

      {/* ── Cards: OS | Hardware | Uptime | Server Record (2-per-row) ── */}
      <div className="row g-3 align-items-stretch">

        {/* Operating System */}
        <div className="col-12 col-md-6 d-flex">
          <SysCard title="Operating System" icon={<Info size={15} />} fill>
            <div className="sysinfo-grid sysinfo-grid--fill">
              <InfoRow label="OS" value={`${sysInfo.os_name} ${sysInfo.os_release}`} accent />
              <InfoRow label="Architecture" value={sysInfo.machine} />
              <InfoRow label="Kernel" value={sysInfo.os_version} mono />
              <InfoRow label="Platform" value={sysInfo.platform_full} mono />
            </div>
          </SysCard>
        </div>

        {/* Hardware: CPU + Memory combined */}
        <div className="col-12 col-md-6 d-flex">
          <SysCard title="Hardware" icon={<Cpu size={15} />} fill>
            <div className="sysinfo-grid sysinfo-grid--fill">
              <SectionDivider label="Processor" />
              <InfoRow label="Model" value={sysInfo.cpu_model || sysInfo.processor} />
              <InfoRow label="Logical cores" value={sysInfo.cpu_count_logical} accent />
              <InfoRow label="Physical cores" value={sysInfo.cpu_count_physical ?? '—'} />
              <SectionDivider label="Memory" />
              <InfoRow label="Total RAM" value={formatBytes(sysInfo.memory_total_bytes)} accent />
              <InfoRow
                label="Swap"
                value={sysInfo.swap_total_bytes ? formatBytes(sysInfo.swap_total_bytes) : 'None'}
              />
            </div>
          </SysCard>
        </div>

        {/* Uptime & Agent */}
        <div className="col-12 col-md-6 d-flex">
          <SysCard title="Uptime &amp; Agent" icon={<Timer size={15} />} fill>
            <div className="sysinfo-grid sysinfo-grid--fill">
              <InfoRow label="Uptime" value={uptimeStr} accent />
              <InfoRow label="Boot time" value={formatDateTime(sysInfo.boot_time)} />
              <InfoRow label="Last seen" value={formatDateTime(server.last_seen_at)} />
              <InfoRow label="Agent user" value={agentUser} />
              <InfoRow label="Agent version" value={agentVersion} mono />
              <InfoRow label="Backend version" value={backendVersion} mono />
              {minAgentVersion ? (
                <InfoRow label="Min supported agent" value={minAgentVersion} mono />
              ) : null}
              <InfoRow label="Frontend version" value={FRONTEND_VERSION} mono />
              <InfoRow label="Python (agent)" value={sysInfo.python_version} mono />
            </div>
          </SysCard>
        </div>

        {/* Server Record */}
        <div className="col-12 col-md-6 d-flex">
          <SysCard title="Server Record" icon={<Server size={15} />} fill>
            <div className="sysinfo-grid sysinfo-grid--fill">
              <InfoRow label="Name" value={server.name} />
              <InfoRow label="Slug" value={server.slug} mono accent />
              <InfoRow label="Hostname" value={server.hostname} mono />
              <InfoRow label="Description" value={server.description || '—'} />
              <InfoRow label="Active" value={server.is_active ? 'Yes' : 'No'} />
              <InfoRow label="Snapshots collected" value={server.snapshot_count ?? '—'} />
            </div>
          </SysCard>
        </div>

      </div>

      {/* ── Disk Partitions ── */}
      <SysCard title="Disk Partitions" icon={<HardDrive size={15} />}>
        <PartitionsTable partitions={sysInfo.partitions ?? []} />
      </SysCard>

      {/* ── Network Interfaces ── */}
      <SysCard title="Network Interfaces" icon={<Network size={15} />}>
        <InterfacesList interfaces={sysInfo.interfaces ?? []} />
      </SysCard>

    </div>
  );
}
