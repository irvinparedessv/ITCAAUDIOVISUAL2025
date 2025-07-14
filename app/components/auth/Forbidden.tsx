import { Link } from "react-router-dom";
import { FaBan } from "react-icons/fa";

export default function Forbidden() {
  return (
    <div className="forbidden-container">
      <div className="forbidden-card">
        <FaBan size={80} className="forbidden-icon" />
        <h1 className="forbidden-title">403 - Acceso prohibido</h1>
        <p className="forbidden-subtitle">
          No tienes permisos para acceder a esta página.
        </p>
        <Link to="/" className="forbidden-button">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
