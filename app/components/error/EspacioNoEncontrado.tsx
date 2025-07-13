import { Link } from "react-router-dom";
import { FaMapMarkedAlt } from "react-icons/fa";
import { useTheme } from "~/hooks/ThemeContext";

export default function EspacioNoEncontrado() {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? "text-white" : "bg-light text-dark"
  }`;

  return (
    <div className={containerClass}>
      <FaMapMarkedAlt size={70} className="text-danger mb-4" />
      <h2>Espacio no encontrado</h2>
      <p className="lead">El espacio que estás buscando no existe o ha sido eliminado.</p>
      <Link
        to="/rooms"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver a la lista de espacios
      </Link>
    </div>
  );
}
