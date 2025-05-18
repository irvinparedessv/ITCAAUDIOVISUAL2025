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

    // Esta es la clave: indicar el authEndpoint hacia tu backend Laravel
    authEndpoint: "http://localhost:8000/broadcasting/auth", // Cambia el puerto y dominio si tu backend está en otro lado

    // Importante para que se envíen cookies de sesión si usas Sanctum
   auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  });
}


export default echo;
