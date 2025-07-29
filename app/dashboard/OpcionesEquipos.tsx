import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaChartLine,
  FaBook,
  FaRegFileAlt,
  FaLongArrowAltLeft,
  FaImage,
  FaTools,
  FaFileArchive,
  FaFile,
  FaCalendarAlt,
} from "react-icons/fa";
import { Card, Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../hooks/AuthContext";
import { Role } from "../types/roles";
import { FaComputer } from "react-icons/fa6";

const opciones = [
  {
    nombre: "Marcas",
    descripcion: "Administracion de marcas de equipo",
    ruta: "/marcas",
    icono: <FaFile size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
  {
    nombre: "Modelos",
    descripcion: "Administracion de modelo de equipo",
    ruta: "/modelos",
    icono: <FaFile size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
  {
    nombre: "Tipo Equipos",
    descripcion: "Administracion de tipo de equipos",
    ruta: "/tipoEquipo",
    icono: <FaComputer size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
  {
    nombre: "Equipos",
    descripcion: "Administracion de equipos",
    ruta: "/inventario",
    icono: <FaComputer size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
  {
    nombre: "Mantenimientos",
    descripcion: "Administracion de mantenimientos",
    ruta: "/mantenimiento",
    icono: <FaComputer size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
  {
    nombre: "Tipo de Mantenimientos",
    descripcion: "Gestión de los tipos de mantenimiento",
    ruta: "/tipoMantenimiento",
    icono: <FaFile size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
  {
    nombre: "Futuros Mantenimientos",
    descripcion: "Planificación de mantenimientos futuros",
    ruta: "/futuroMantenimiento",
    icono: <FaCalendarAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado],
  },
];

const OpcionesEquipos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filtra las opciones según el rol del usuario
  const opcionesFiltradas = opciones.filter(
    (opcion) => user?.role && opcion.roles.includes(user.role)
  );

  const handleBack = () => {
    navigate("/");
  };

  return (
    <Container fluid className={"dashboardContainer"}>
      {/* Encabezado con flecha de retroceso */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <FaLongArrowAltLeft
            onClick={handleBack}
            style={{ fontSize: "2rem", cursor: "pointer", flexShrink: 0 }} // <- Aquí
            className={"backIcon"}
          />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1 className={"welcomeHeader"}>Gestión Equipos</h1>
            <p className={"welcomeText"}>
              Administracion de Tipos,Modelos,Marcas,Equipo e Imagenes
            </p>
          </div>
        </div>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {opcionesFiltradas.map((opcion) => (
          <Col key={opcion.ruta}>
            <Card
              onClick={() => navigate(opcion.ruta)}
              className={`text-decoration-none ${"card"}`}
              style={{ cursor: "pointer" }}
            >
              <Card.Body className="text-center p-4">
                <div className={"iconWrapper"}>{opcion.icono}</div>
                <h5 className={"cardTitle"}>{opcion.nombre}</h5>
                <p className={"cardDescription"}>{opcion.descripcion}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default OpcionesEquipos;
