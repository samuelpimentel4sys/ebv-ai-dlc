import { describe, expect, it } from 'vitest';
import { sumBy, toNumber } from '@/lib/number';
import { formatCurrency } from '@/lib/format';

describe('toNumber / sumBy', () => {
  it('coage string decimal sem concatenar', () => {
    expect(toNumber('1500.00')).toBe(1500);
    expect(toNumber('320.50')).toBe(320.5);
    expect(sumBy([{ amount: '1500.00' }, { amount: '320.50' }], (row) => row.amount)).toBe(1820.5);
  });

  it('formatCurrency não exibe concatenação de strings', () => {
    const total = sumBy([{ amount: '1500.00' }, { amount: '320.50' }], (row) => row.amount);
    expect(formatCurrency(total)).toMatch(/1\.820,50|1820,50/);
    expect(formatCurrency('1500.00320.50')).toBe('—');
  });
});
