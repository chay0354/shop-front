// Three time windows: 10-14, 14-18, 18-22. Hide a window only when its end hour has passed.
export const DELIVERY_SLOT_RANGES = [
  { value: '10-14', label: '10-14', endHour: 14 },
  { value: '14-18', label: '14-18', endHour: 18 },
  { value: '18-22', label: '18-22', endHour: 22 },
];

export function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getAvailableDeliverySlots() {
  const now = new Date();
  const currentHour = now.getHours();
  const today = formatDateKey(now);

  const slots = [];
  for (const range of DELIVERY_SLOT_RANGES) {
    if (currentHour >= range.endHour) continue;
    slots.push({
      value: `${today} ${range.value}`,
      label: range.label,
      slotKey: range.value,
    });
  }

  if (slots.length > 0) return slots;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);
  return DELIVERY_SLOT_RANGES.map((range) => ({
    value: `${tomorrowKey} ${range.value}`,
    label: range.label,
    slotKey: range.value,
  }));
}
