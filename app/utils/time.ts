const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 7; hour <= 22; hour++) {
    times.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour !== 22) times.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return times;
};

export function formatOnlyDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTo12h(time24: string): string {
  const [hourStr, minStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minutes = minStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // Convierte 0 a 12

  return `${hour}:${minutes} ${ampm}`;
}

export function formatDateTimeTo12h(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return "—";

  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return "—";

  // Fecha en formato DD/MM/YYYY
  const formattedDate = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Hora en formato 12h
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");

  const formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;

  return `${formattedDate} ${formattedTime}`;
}



export function formatTimeRangeTo12h(range24: string): string {
  const [start, end] = range24.split(" - ");
  return `${formatTo12h(start)} - ${formatTo12h(end)}`;
}




export const timeOptions = generateTimeOptions();
