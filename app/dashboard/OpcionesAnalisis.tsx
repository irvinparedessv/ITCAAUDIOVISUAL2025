import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaLongArrowAltLeft } from 'react-icons/fa';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import { Role } from '../types/roles';

const opciones = [
    {
        nombre: 'Análisis por tipo de equipo',
        descripcion: 'Predicción y estadísticas',
        ruta: '/prediccion',
        icono: <FaChartLine size={24} />,
        roles: [Role.Administrador, Role.Encargado]
    },
    {
        nombre: 'Análisis por equipo',
        descripcion: 'Predicción y estadísticas',
        ruta: '/prediccionPorEquipoPage',
        icono: <FaChartLine size={24} />,
        roles: [Role.Administrador, Role.Encargado]
    },
    {
        nombre: 'Análisis por espacio',
        descripcion: 'Predicción y estadísticas',
        ruta: '/prediccionAula',
        icono: <FaChartLine size={24} />,
        roles: [Role.Administrador]
    },
];

const OpcionesAnalisis = () => {
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
                    <h1 className={"welcomeHeader"}>Opciones de Análisis Predictivo</h1>
                    <p className={"welcomeText"}>
                        Gestiona todas las funciones de análisis del sistema
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

export default OpcionesAnalisis;