import { FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "~/hooks/ThemeContext";

export default function EquipoNoEncontrado() {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? "text-white" : "text-dark bg-light"
  }`;

  return (
    <div className={containerClass}>
      <FaExclamationTriangle size={70} className="text-warning mb-4" />
      <h2>Equipo no encontrado</h2>
      <p className="lead">El equipo que estás buscando no existe o ha sido eliminado.</p>
      <Link
        to="/equipolist"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver al listado de equipos
      </Link>
    </div>
  );
}
