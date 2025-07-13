import { Link } from "react-router-dom";
import { FaBan } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Forbidden() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      <div style={styles.card}>
        <FaBan size={80} style={styles.icon} />
        <h1 style={styles.title}>403 - Acceso prohibido</h1>
        <p style={styles.subtitle}>
          No tienes permisos para acceder a esta página.
        </p>
        <Link to="/" style={styles.button}>
          Volver al inicio
        </Link>
      </div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "radial-gradient(circle at center, #1f2937, #0f172a)",
    color: "#fff",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "1rem",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "1rem",
    padding: "3rem",
    textAlign: "center",
    boxShadow: "0 0 30px rgba(0, 0, 0, 0.4)",
    maxWidth: "500px",
  },
  icon: {
    color: "#ef4444",
    marginBottom: "1.5rem",
    textShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    opacity: 0.9,
    marginBottom: "2rem",
  },
  button: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    backgroundColor: "rgba(239, 68, 68, 0.7)",
    color: "#fff",
    borderRadius: "999px",
    fontSize: "1rem",
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
    transition: "transform 0.3s ease",
  },
};
