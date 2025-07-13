import { FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "~/hooks/ThemeContext";

export default function UbicacionNoEncontrada() {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? "text-white" : "text-dark bg-light"
  }`;

  return (
    <div className={containerClass}>
      <FaMapMarkerAlt size={70} className="text-danger mb-4" />
      <h2>Ubicación no encontrada</h2>
      <p className="lead">
        La ubicación que estás intentando editar no existe o ha sido eliminada.
      </p>
      <Link
        to="/ubications"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver al listado
      </Link>
    </div>
  );
}
