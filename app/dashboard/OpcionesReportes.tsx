import { useNavigate } from 'react-router-dom';
import { FaUsers, FaChartLine, FaBook, FaRegFileAlt, FaLongArrowAltLeft } from 'react-icons/fa';
import { Card } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext'; // Asegúrate de importar tu hook de autenticación
import { Role } from '../types/roles'; // Importa los roles si es necesario

const opciones = [
  {
    nombre: 'Reporte de reservas equipo',
    descripcion: 'Reporte de reserva por fechas',
    ruta: '/reporteReservasEquipo',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado] // Especifica qué roles pueden ver esta opción
  },
  {
    nombre: 'Reporte de reservas equipo',
    descripcion: 'Reporte de reserva por usuarios',
    ruta: '/reporteReservasUsuarios',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.Encargado]
  },
  {
    nombre: 'Reporte de reservas aulas',
    descripcion: 'Reporte de uso de aulas por aulas',
    ruta: '/reporteReservasAulas',
    icono: <FaRegFileAlt size={24} />,
    roles: [Role.Administrador, Role.EspacioEncargado] // Solo admin y encargado de espacios
  },
  {
    nombre: 'Reporte de reservas aulas',
    descripcion: 'Reporte de uso de aulas por usuarios',
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
];

const OpcionesReporte = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtiene el usuario del contexto de autenticación

  // Filtra las opciones basadas en el rol del usuario
  const opcionesFiltradas = opciones.filter(opcion => 
  opcion.roles.includes(user?.role ?? Role.Prestamista) // O cualquier otro rol por defecto
);
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
    navigate("/administracion");
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
              maxWidth: '600px'
            }}
          >
            <FaLongArrowAltLeft 
              onClick={handleBack} 
              style={{ fontSize: '2rem', cursor: 'pointer' }} 
            />
            <h1>
              Opciones de Reportes
            </h1>
          </div>
    
          <p style={{ marginTop: 0 }}>
            Gestiona todas los reportes del sistema
          </p>

        <div className="d-flex flex-wrap gap-4">
          {opcionesFiltradas.map((opcion) => (
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

export default OpcionesReporte;