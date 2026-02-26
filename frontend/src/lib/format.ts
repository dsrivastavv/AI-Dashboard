const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(digits)}%`;
}

export function formatBytes(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = Math.abs(value);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const signed = value < 0 ? -size : size;
  return `${numberFormatter.format(signed)} ${units[unitIndex]}`;
}

export function formatThroughput(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${formatBytes(value)}/s`;
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return value.toFixed(digits);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '-';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}

export function formatRelativeSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return '-';
  }
  if (seconds < 1) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s ago`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${Math.round(minutes)}m ago`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${Math.round(hours)}h ago`;
  }
  const days = hours / 24;
  return `${Math.round(days)}d ago`;
}

export function formatLabel(label: string | null | undefined): string {
  if (!label) {
    return 'Unknown';
  }
  return label
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
