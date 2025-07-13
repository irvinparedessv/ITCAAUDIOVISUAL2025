import { useNavigate } from 'react-router-dom';
import { FaUsers, FaChartLine, FaBook, FaRegFileAlt, FaLongArrowAltLeft } from 'react-icons/fa';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import { Role } from '../types/roles';

const opciones = [
  {
    nombre: 'Reportes',
    descripcion: 'Reportes generales del sistema',
    ruta: '/opcionesReportes',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado, Role.EspacioEncargado]
  },
  {
    nombre: 'Análisis',
    descripcion: 'Predicción y estadísticas',
    ruta: '/opcionesAnalisis',
    icono: <FaChartLine size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Bitácora',
    descripcion: 'Historial de acciones del sistema',
    ruta: '/bitacora',
    icono: <FaBook size={24} />,
    roles: [Role.Administrador]
  },
];

const OpcionesAdministrativas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filtra las opciones según el rol del usuario
  const opcionesFiltradas = opciones.filter(opcion => 
    user?.role && opcion.roles.includes(user.role)
  );

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Container fluid className={"dashboardContainer"}>
      {/* Encabezado con flecha de retroceso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <FaLongArrowAltLeft 
          onClick={handleBack} 
          style={{ fontSize: '2rem', cursor: 'pointer' }} 
          className={"backIcon"}
        />
        <div>
          <h1 className={"welcomeHeader"}>Opciones Administrativas</h1>
          <p className={"welcomeText"}>
            Gestiona todas las funciones del sistema
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

export default OpcionesAdministrativas;