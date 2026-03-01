export const DELIVERY_HOUR_START = 8;
export const DELIVERY_HOUR_END = 20;
const MIN_HOURS_FROM_NOW = 2;

export function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getAvailableDeliverySlots() {
  const now = new Date();
  const currentHour = now.getHours();
  const isOutsideWindow = currentHour >= DELIVERY_HOUR_END || currentHour < DELIVERY_HOUR_START;
  const slots = [];
  const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

  if (isOutsideWindow) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = formatDateKey(tomorrow);
    for (let h = DELIVERY_HOUR_START; h <= DELIVERY_HOUR_END; h++) {
      slots.push({ value: `${dateKey} ${h}`, label: `מחר ${hourLabel(h)}`, hour: h });
    }
    return slots;
  }

  const nowPlus2 = new Date(now.getTime() + MIN_HOURS_FROM_NOW * 60 * 60 * 1000);
  const h2 = nowPlus2.getHours();
  const m2 = nowPlus2.getMinutes();
  const earliest = m2 > 0 ? h2 + 1 : h2;

  if (earliest > DELIVERY_HOUR_END) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = formatDateKey(tomorrow);
    for (let h = DELIVERY_HOUR_START; h <= DELIVERY_HOUR_END; h++) {
      slots.push({ value: `${dateKey} ${h}`, label: `מחר ${hourLabel(h)}`, hour: h });
    }
    return slots;
  }

  const today = formatDateKey(now);
  const start = Math.max(DELIVERY_HOUR_START, earliest);
  for (let h = start; h <= DELIVERY_HOUR_END; h++) {
    slots.push({ value: `${today} ${h}`, label: hourLabel(h), hour: h });
  }
  return slots;
}
