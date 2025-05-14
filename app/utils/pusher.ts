import Echo from "laravel-echo";
import Pusher from "pusher-js";

// 👉 Extiende correctamente el objeto `window`
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// 👇 Solo en cliente para evitar errores en SSR o Vite
let echo: Echo<any> | null = null;

if (typeof window !== "undefined") {
  window.Pusher = Pusher;

  echo = new Echo<any>({
    broadcaster: "pusher",
    key: "47727907193b763eb41f",
    cluster: "us2",
    forceTLS: true,
  });
}

export default echo;
