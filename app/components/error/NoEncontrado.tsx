import React from "react";
import { Link } from "react-router-dom";

const NoEncontrado = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>404</h1>
        <h2 style={styles.subtitle}>¡Ups! Página no encontrada</h2>
        <p style={styles.text}>
          Parece que te has perdido en el espacio digital...
        </p>

        <div style={styles.astronautContainer}>
          <div style={styles.astronaut}>
            <div style={styles.helmet}></div>
            <div style={styles.visor}></div>
            <div style={styles.body}></div>
            <div style={styles.armLeft}></div>
            <div style={styles.armRight}></div>
            <div style={styles.legLeft}></div>
            <div style={styles.legRight}></div>
            <div style={styles.backpack}></div>
          </div>
        </div>

        <Link to="/" style={styles.button}>
          Volver a Inicio
        </Link>
      </div>
    </div>
  );
};

export default NoEncontrado;

// 👇 Tipamos el objeto de estilos
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "radial-gradient(circle at center, #0f172a 0%, #000 100%)",
    color: "#ffffff",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  content: {
    textAlign: "center",
    maxWidth: "700px",
  },
  title: {
    fontSize: "7rem",
    fontWeight: 900,
    margin: "0",
    background: "linear-gradient(45deg, #ff0000ff, rgb(139, 0, 0))",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
  },
  subtitle: {
    fontSize: "2rem",
    margin: "0.5rem 0 1rem",
    color: "#e0e0e0",
  },
  text: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
    opacity: 0.9,
  },
  button: {
    display: "inline-block",
    padding: "12px 30px",
    backgroundColor: "rgb(139, 0, 0)",
    color: "white",
    borderRadius: "50px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "1rem",
    transition: "all 0.3s ease",
    marginTop: "2rem",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(58, 123, 213, 0.6)",
  },
  astronautContainer: {
    position: "relative",
    width: "220px",
    height: "220px",
    margin: "2rem auto",
    animation: "float 3s ease-in-out infinite",
  },
  astronaut: {
    position: "relative",
    width: "120px",
    height: "180px",
    margin: "0 auto",
    transform: "scale(1.1)",
  },
  helmet: {
    position: "absolute",
    width: "80px",
    height: "80px",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    top: "20px",
    left: "20px",
    boxShadow: "0 0 15px rgba(255, 255, 255, 0.4)",
  },
  visor: {
    position: "absolute",
    width: "60px",
    height: "30px",
    backgroundColor: "#3a7bd5",
    borderRadius: "30px 30px 0 0",
    top: "40px",
    left: "30px",
  },
  body: {
    position: "absolute",
    width: "70px",
    height: "80px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    top: "90px",
    left: "25px",
  },
  armLeft: {
    position: "absolute",
    width: "20px",
    height: "50px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    top: "100px",
    left: "5px",
    transform: "rotate(30deg)",
  },
  armRight: {
    position: "absolute",
    width: "20px",
    height: "50px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    top: "100px",
    left: "95px",
    transform: "rotate(-30deg)",
  },
  legLeft: {
    position: "absolute",
    width: "20px",
    height: "50px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    top: "160px",
    left: "35px",
  },
  legRight: {
    position: "absolute",
    width: "20px",
    height: "50px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    top: "160px",
    left: "65px",
  },
  backpack: {
    position: "absolute",
    width: "30px",
    height: "50px",
    backgroundColor: "#3a7bd5",
    borderRadius: "10px",
    top: "100px",
    left: "95px",
  },
};

// 👇 Inyectar animación global en el documento (solo si no usas Tailwind o CSS externo)
if (typeof window !== "undefined") {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
  @keyframes float {
    0% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0); }
  }`;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    console.warn("No se pudo insertar la animación 'float'.", e);
  }
}
