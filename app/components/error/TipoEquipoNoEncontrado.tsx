import { Link } from "react-router-dom";
import { FaRegSadTear } from "react-icons/fa";
import { useTheme } from "~/hooks/ThemeContext";

export default function TipoEquipoNoEncontrado() {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? " text-white" : "bg-light text-dark"
  }`;

  return (
    <div className={containerClass}>
      <FaRegSadTear size={70} className="text-warning mb-4" />
      <h2>Tipo de equipo no encontrado</h2>
      <p className="lead">
        El tipo de equipo que estás buscando no existe o ha sido eliminado.
      </p>
      <Link
        to="/tipoEquipo"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver a la lista de tipos
      </Link>
    </div>
  );
}