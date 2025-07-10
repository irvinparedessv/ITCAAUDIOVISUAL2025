import { useNavigate } from 'react-router-dom';
import { FaUsers, FaChartLine, FaBook, FaRegFileAlt, FaLongArrowAltLeft } from 'react-icons/fa';
import { Card } from 'react-bootstrap';

const opciones = [
    {
        nombre: 'Análisis por tipo de equipo',
        descripcion: 'Predicción y estadísticas',
        ruta: '/prediccion',
        icono: <FaChartLine size={24} />,
    },
    {
        nombre: 'Análisis por equipo',
        descripcion: 'Predicción y estadísticas',
        ruta: '/prediccionPorEquipoPage',
        icono: <FaChartLine size={24} />,
    },
    {
        nombre: 'Análisis por aula',
        descripcion: 'Predicción y estadísticas',
        ruta: '/prediccionAula',
        icono: <FaChartLine size={24} />,
    },
];

const OpcionesAnalisis = () => {
    const navigate = useNavigate();

    // Estilo del borde degradado
    const cardBorderStyle = {
        border: "2px solid",
        borderImage: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20)) 1",
        boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
        cursor: "pointer"
    };

    // Estilo para los iconos (rojo)
    const getIconStyle = () => ({
        color: document.documentElement.getAttribute("data-bs-theme") === "dark"
            ? "#b1291d"
            : "#8B0000"
    });

    const handleBack = () => {
        navigate("/administracion"); // Redirige a la ruta de inicio
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Contenedor flex principal (flecha + título) */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '10px',
                        maxWidth: '800px'
                    }}
                >
                    <FaLongArrowAltLeft
                        onClick={handleBack}
                        style={{ fontSize: '2rem', cursor: 'pointer' }}
                    />
                    <h1>
                        Opciones de Análisis Predictivo
                    </h1>
                </div>

                <p style={{ marginTop: 0 }}>
                    Gestiona todas las funciones del sistema
                </p>

                <div className="d-flex flex-wrap gap-4">
                    {opciones.map((opcion) => (
                        <Card
                            key={opcion.ruta}
                            onClick={() => navigate(opcion.ruta)}
                            className="cursor-pointer transition-all"
                            style={{
                                ...cardBorderStyle,
                                width: '280px',
                                flex: '1 0 auto',
                                transform: 'translateY(0)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
                            }}
                        >
                            <Card.Body className="text-center py-4">
                                <div className="mb-3" style={getIconStyle()}>
                                    {opcion.icono}
                                </div>
                                <h5 className="mb-2">{opcion.nombre}</h5>
                                <p className="text-muted small">{opcion.descripcion}</p>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OpcionesAnalisis;