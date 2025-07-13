import { Link } from "react-router-dom";
import { FaRegSadTear } from "react-icons/fa";import { useTheme } from "~/hooks/ThemeContext";


export default function ReservaNoEncontrada() {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? " text-white" : "bg-light text-dark"
  }`;

  return (
    <div className={containerClass}>
      <FaRegSadTear size={70} className="text-warning mb-4" />
      <h2>Reserva no encontrada</h2>
      <p className="lead">La reserva que estás buscando no existe o ha sido eliminada.</p>
      <Link
        to="/reservations-room"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver a la lista
      </Link>
    </div>
  );
}
