import { describe, expect, it } from 'vitest';
import { buildIcs } from '@/lib/ical';

describe('iCalendar export', () => {
  it('genera un calendario válido con eventos escapados', () => {
    const ics = buildIcs([{ id: '1', title: 'Entreno, ataque; transición', start: '2026-09-03T09:00:00', description: 'Bloque 1\nRPE' }]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Entreno\\, ataque\\; transición');
    expect(ics).toContain('DESCRIPTION:Bloque 1\\nRPE');
    expect(ics).toContain('END:VEVENT');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
