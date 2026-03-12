export const DELIVERY_HOUR_START = 8;
export const DELIVERY_HOUR_END = 19;
const MIN_HOURS_FROM_NOW = 2;

/** Tomorrow slots (משלוחים מהיום למחר): 3 ranges */
export const TOMORROW_SLOT_RANGES = [
  { value: '10-14', label: '10-14' },
  { value: '14-18', label: '14-18' },
  { value: '18-22', label: '18-22' },
];

export function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodaySlots(now) {
  const currentHour = now.getHours();
  const isOutsideWindow = currentHour >= DELIVERY_HOUR_END || currentHour < DELIVERY_HOUR_START;
  const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;
  const rangeLabel = (h) => `${hourLabel(h)}-${hourLabel(h + 1)}`;

  if (isOutsideWindow) return [];

  const nowPlus2 = new Date(now.getTime() + MIN_HOURS_FROM_NOW * 60 * 60 * 1000);
  const h2 = nowPlus2.getHours();
  const m2 = nowPlus2.getMinutes();
  const earliest = m2 > 0 ? h2 + 1 : h2;

  if (earliest > DELIVERY_HOUR_END) return [];

  const today = formatDateKey(now);
  const start = Math.max(DELIVERY_HOUR_START, earliest);
  const slots = [];
  for (let h = start; h <= DELIVERY_HOUR_END; h++) {
    slots.push({ value: `${today} ${h}`, label: rangeLabel(h), hour: h, type: 'today' });
  }
  return slots;
}

function getTomorrowSlots(now) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateKey = formatDateKey(tomorrow);
  return TOMORROW_SLOT_RANGES.map((r) => ({
    value: `${dateKey} ${r.value}`,
    label: r.label,
    slotKey: r.value,
    type: 'tomorrow',
  }));
}

/** Returns { today: slot[], tomorrow: slot[] } for the delivery dropdown. */
export function getAvailableDeliverySlots() {
  const now = new Date();
  return {
    today: getTodaySlots(now),
    tomorrow: getTomorrowSlots(now),
  };
}

/** Flat list of all slots (for admin compatibility when needed). */
export function getAvailableDeliverySlotsFlat() {
  const { today, tomorrow } = getAvailableDeliverySlots();
  return [...today, ...tomorrow];
}
