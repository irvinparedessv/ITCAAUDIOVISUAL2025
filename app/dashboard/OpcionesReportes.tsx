import { useNavigate } from 'react-router-dom';
import { FaRegFileAlt, FaChartLine, FaLongArrowAltLeft } from 'react-icons/fa';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import { Role } from '../types/roles';

const opciones = [
  {
    nombre: 'Reporte de reservas equipo',
    descripcion: 'Reporte de reserva por fechas',
    ruta: '/reporteReservasEquipo',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Reporte de reservas equipo',
    descripcion: 'Reporte de reserva por usuarios',
    ruta: '/reporteReservasUsuarios',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Reporte de reservas espacios',
    descripcion: 'Reporte de uso de espacios por aulas',
    ruta: '/reporteReservasAulas',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.EspacioEncargado]
  },
  {
    nombre: 'Reporte de reservas espacios',
    descripcion: 'Reporte de uso de espacios por usuarios',
    ruta: '/reporteAulas',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador]
  },
  {
    nombre: 'Reporte de horarios solicitados',
    descripcion: 'Reporte de horarios más solicitados por tipo de reserva',
    ruta: '/reporteHorarios',
    icono: <FaChartLine size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Reporte de equipos',
    descripcion: 'Reporte de uso de equipos',
    ruta: '/reporteEquipos',
    icono: <FaChartLine size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Reporte de inventario',
    descripcion: 'Reporte de inventario de equipos',
    ruta: '/reporteInventario',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Reporte de mantenimiento',
    descripcion: 'Reporte de mantenimineto de equipos',
    ruta: '/reporteMantenimientos',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
];

const OpcionesReporte = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filtra las opciones según el rol del usuario
  const opcionesFiltradas = opciones.filter(opcion => 
    user?.role && opcion.roles.includes(user.role)
  );

  const handleBack = () => {
    navigate("/administracion");
  };

  return (
    <Container fluid className={"dashboardContainer"}>
      {/* Encabezado con flecha de retroceso */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '1.5rem'
      }}>
        <FaLongArrowAltLeft 
          onClick={handleBack} 
          className={"backIcon"}
          style={{ 
            fontSize: '2rem', 
            cursor: 'pointer',
          }} 
        />
        <div>
          <h1 className={"welcomeHeader"}>Opciones de Reportes</h1>
          <p className={"welcomeText"}>
            Gestiona todos los reportes del sistema
          </p>
        </div>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {opcionesFiltradas.map((opcion) => (
          <Col key={opcion.ruta}>
            <Card 
              onClick={() => navigate(opcion.ruta)} 
              className={`text-decoration-none ${"card"}`}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="text-center p-4">
                <div className={"iconWrapper"}>
                  {opcion.icono}
                </div>
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

export default OpcionesReporte;