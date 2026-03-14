export function formatDateDdMmYyyy(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

export function formatDateTimeDdMmYyyy(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

export function parseDateInputToIso(value: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00.000Z`).toISOString();
}