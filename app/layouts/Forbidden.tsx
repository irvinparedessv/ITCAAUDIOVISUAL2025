import { Link } from "react-router-dom";
import { FaBan } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Forbidden() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4"
    >
      <FaBan size={80} className="text-danger mb-4" />
      <h1 className="display-4">403 - Acceso prohibido</h1>
      <p className="lead">No tienes permisos para ver esta página.</p>
      <Link to="/" className="btn btn-primary mt-4">
        Volver al inicio
      </Link>
    </motion.div>
  );
}
