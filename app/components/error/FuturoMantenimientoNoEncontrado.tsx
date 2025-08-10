import { FaCalendarTimes, FaTools } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "~/hooks/ThemeContext";

export default function FuturoMantenimientoNoEncontrado() {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? "text-white" : "text-dark bg-light"
  }`;

  return (
    <div className={containerClass}>
      <FaCalendarTimes size={70} className="text-warning mb-4" />
      <h2>Futuro Mantenimiento no encontrado</h2>
      <p className="lead">
        El mantenimiento programado que estás buscando no existe o ha sido eliminado.
      </p>
      <Link
        to="/futuroMantenimiento"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver al listado de mantenimientos programados
      </Link>
    </div>
  );
}