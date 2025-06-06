import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: Echo<any>;
  }
}

const initializeEcho = (token: string) => {
  if (typeof window === "undefined") return;

  window.Pusher = Pusher;

  if (!window.Echo) {
    window.Echo = new Echo<any>({
      broadcaster: "pusher",
      key: "47727907193b763eb41f",
      cluster: "us2",
      forceTLS: true,
      authEndpoint: "http://localhost:8000/broadcasting/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  return window.Echo;
};

// Exporta initializeEcho como named export
export { initializeEcho };

// Exporta también como default para compatibilidad
export default initializeEcho;