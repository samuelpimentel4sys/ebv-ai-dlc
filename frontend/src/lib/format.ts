import { toNumber } from '@/lib/number';

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

const dateOnly = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return dateTime.format(parsed);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return dateOnly.format(parsed);
}

export function formatNumber(value: unknown, digits = 0): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'number' ? value : toNumber(value, Number.NaN);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: unknown, digits = 1): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'number' ? value : toNumber(value, Number.NaN);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatCurrency(value: unknown, digits = 2): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'number' ? value : toNumber(value, Number.NaN);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatSigned(value: unknown, digits = 0): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'number' ? value : toNumber(value, Number.NaN);
  if (Number.isNaN(n)) return '—';
  const formatted = formatNumber(Math.abs(n), digits);
  if (n > 0) return `+${formatted}`;
  if (n < 0) return `−${formatted}`;
  return formatted;
}

export function maskDocument(documento: string): string {
  const digits = documento.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.***.**${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.***.***/${digits.slice(8, 12)}-**`;
  }
  return documento;
}

export function relativeFromNow(iso: string): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return '—';
  const diffMs = target - Date.now();
  const minutes = Math.round(diffMs / 60000);
  const abs = Math.abs(minutes);
  if (abs < 60) return minutes >= 0 ? `em ${abs} min` : `há ${abs} min`;
  const hours = Math.round(abs / 60);
  if (hours < 48) return minutes >= 0 ? `em ${hours} h` : `há ${hours} h`;
  const days = Math.round(hours / 24);
  return minutes >= 0 ? `em ${days} d` : `há ${days} d`;
}
