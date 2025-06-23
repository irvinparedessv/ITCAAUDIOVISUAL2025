const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 7; hour <= 22; hour++) {
    times.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour !== 22) times.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return times;
};

export function formatTo12h(time24: string): string {
  const [hourStr, minStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minutes = minStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // Convierte 0 a 12

  return `${hour}:${minutes} ${ampm}`;
}


export const timeOptions = generateTimeOptions();
