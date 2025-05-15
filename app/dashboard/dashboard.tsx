import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import {
  FaCalendarAlt,
  FaClipboardList,
  FaTools,
  FaBuilding,
  FaUserShield,
  FaQrcode,
} from "react-icons/fa";
import { FaComputer, FaRestroom } from "react-icons/fa6";
import { Card, Container, Row, Col } from "react-bootstrap";
import { Role } from "~/types/roles";

export default function Dashboard() {
  const { user } = useAuth();

  // Estilo para los iconos basado en el tema
  const getIconStyle = () => {
    const isDarkMode =
      document.documentElement.getAttribute("data-bs-theme") === "dark";
    return { color: isDarkMode ? "#b1291d" : "#8B0000" };
  };

  // Estilo para el borde con gradiente
  const cardBorderStyle = {
    border: "2px solid",
    borderImage: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20)) 1",
    boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Panel de Control</h1>
      <p className="text-muted mb-5">
        Bienvenido, {user?.first_name}. Selecciona una opción:
      </p>

      {user?.role === Role.Administrador && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Reservar Equipo"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/addreservation"
            description="Crear nueva reserva de equipos tecnológicos"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Todas las Reservas"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/reservations"
            description="Ver historial completo de reservaciones"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Gestión de Equipos"
            icon={<FaTools size={24} style={getIconStyle()} />}
            link="/formEquipo"
            description="Administrar inventario de equipos"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Gestión de Espacios"
            icon={<FaBuilding size={24} style={getIconStyle()} />}
            link="/formEspacio"
            description="Administrar espacios disponibles"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Inventario"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/inventario"
            description="Ver reporte completo del inventario"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Administración"
            icon={<FaUserShield size={24} style={getIconStyle()} />}
            link="/usuarios" 
            description="Configuración del sistema"
            borderStyle={cardBorderStyle}
          />
        </Row>
      )}

      {user?.role === Role.Encargado && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Aprobar Reservas"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/reservations"
            description="Revisar y aprobar reservas pendientes"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Lector QR"
            icon={<FaQrcode size={24} style={getIconStyle()} />}
            link="/qrScan"
            description="Leer Codigo QR"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Reservas de Espacios"
            icon={<FaBuilding size={24} style={getIconStyle()} />}
            link="/reservationsroom"
            description="Gestionar reservas de espacios físicos"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Equipos Disponibles"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/formEquipo"
            description="Ver disponibilidad de equipos"
            borderStyle={cardBorderStyle}
          />
        </Row>
      )}

      {user?.role === Role.Prestamista && (
        <Row xs={1} md={2} className="g-4">
          <DashboardCard
            title="Reservar Espacio"
            icon={<FaRestroom size={24} />}
            link="/reservationsroom"
            description="Crear nueva reserva de espacio"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Nueva Reserva"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/addreservation"
            description="Solicitar préstamo de equipos"
            borderStyle={cardBorderStyle}
          />
          <DashboardCard
            title="Mis Reservas"
            icon={<FaCalendarAlt size={24} style={getIconStyle()} />}
            link="/reservations"
            description="Ver mis reservas activas"
            borderStyle={cardBorderStyle}
          />
        </Row>
      )}
    </Container>
  );
}

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  description: string;
  borderStyle: React.CSSProperties;
}

function DashboardCard({
  title,
  icon,
  link,
  description,
  borderStyle,
}: DashboardCardProps) {
  return (
    <Col>
      <Card
        as={Link}
        to={link}
        className="h-100 text-decoration-none hover-shadow"
        style={borderStyle}
      >
        <Card.Body className="text-center py-4">
          <div className="mb-3">{icon}</div>
          <h5 className="mb-2">{title}</h5>
          <p className="text-muted small mb-0">{description}</p>
        </Card.Body>
      </Card>
    </Col>
  );
}
