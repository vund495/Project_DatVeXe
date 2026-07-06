export function currency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
}

export function minutesToText(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function timeText(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(value));
}

export function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export function getSeatList(busType) {
  let count = 24;
  if (busType.includes('34')) count = 34;
  else if (busType.includes('22')) count = 22;
  else if (busType.includes('18')) count = 18;
  else if (busType.includes('9')) count = 9;
  else if (busType.includes('24')) count = 24;

  const seats = [];
  for (let i = 1; i <= count; i++) {
    const code = i <= count / 2 ? `A${String(i).padStart(2, '0')}` : `B${String(i - count / 2).padStart(2, '0')}`;
    seats.push(code);
  }
  return seats;
}
