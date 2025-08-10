import { FaTools, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "~/hooks/ThemeContext";

interface Props {
  isEditing?: boolean;
}

export default function MantenimientoNoEncontrado({ isEditing = false }: Props) {
  const { darkMode } = useTheme();

  const containerClass = `d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 ${
    darkMode ? "text-white" : "text-dark bg-light"
  }`;

  return (
    <div className={containerClass}>
      {isEditing ? (
        <FaTools size={70} className="text-warning mb-4" />
      ) : (
        <FaExclamationTriangle size={70} className="text-warning mb-4" />
      )}
      <h2>Mantenimiento no encontrado</h2>
      <p className="lead">
        {isEditing
          ? "El mantenimiento que intentas editar no existe o ha sido eliminado."
          : "No se pudo crear el mantenimiento. El equipo especificado no existe."}
      </p>
      <Link
        to="/mantenimiento"
        className={`btn ${darkMode ? "btn-light" : "btn-dark"} mt-3`}
      >
        Volver al listado de mantenimientos
      </Link>
    </div>
  );
}