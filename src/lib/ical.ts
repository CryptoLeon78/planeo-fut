export type CalendarItem = {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string | null;
};

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
}

function toUtc(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z';
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildIcs(items: CalendarItem[], calendarName = 'PlaneoFUT') {
  const events = items.map((item) => [
    'BEGIN:VEVENT',
    `UID:${escapeIcs(item.id)}@planeofut`,
    `DTSTAMP:${toUtc(new Date().toISOString())}`,
    `DTSTART:${toUtc(item.start)}`,
    item.end ? `DTEND:${toUtc(item.end)}` : '',
    `SUMMARY:${escapeIcs(item.title)}`,
    item.description ? `DESCRIPTION:${escapeIcs(item.description)}` : '',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PlaneoFUT//Calendar//ES', `X-WR-CALNAME:${escapeIcs(calendarName)}`, 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n');
}

export function downloadIcs(items: CalendarItem[], calendarName?: string) {
  const blob = new Blob([buildIcs(items, calendarName)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'planeofut-calendario.ics';
  anchor.click();
  URL.revokeObjectURL(url);
}
