const millisecondsPerDay = 1000 * 60 * 60 * 24;

export function formatDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getAttendanceDate(date = new Date(), attendanceDayStartHour: number): string {
  const attendanceDate = new Date(date);

  if (attendanceDate.getHours() < attendanceDayStartHour) {
    attendanceDate.setDate(attendanceDate.getDate() - 1);
  }

  return formatDate(attendanceDate);
}

function parseDateParts(date: string): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);

  return [year, month, day];
}

export function getYesterday(today: string): string {
  const [year, month, day] = parseDateParts(today);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  return formatDate(date);
}

function getDateTime(date: string): number {
  const [year, month, day] = parseDateParts(date);

  return Date.UTC(year, month - 1, day);
}

export function getAttendanceDays(checkStartDate: string, today: string): number {
  const days = Math.floor((getDateTime(today) - getDateTime(checkStartDate)) / millisecondsPerDay) + 1;

  return Math.max(days, 1);
}
