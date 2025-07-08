import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import {
  FaCalendarAlt,
  FaClipboardList,
  FaTools,
  FaBuilding,
  FaUserShield,
  FaQrcode,
  FaDoorOpen,
  FaRegFileAlt,
  FaUsers,
} from "react-icons/fa";
import { FaComputer, FaBookmark } from "react-icons/fa6";
import { Card, Container, Row, Col } from "react-bootstrap";
import { Role } from "../types/roles";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-5px)";
    e.currentTarget.style.boxShadow = "0 0.5rem 1rem rgba(0, 0, 0, 0.15)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)";
  };

  useEffect(() => {
    toast.dismiss(); // limpia cualquier confirmación colgada
  }, []);

  return (
    <Container>
      <h1 className="mb-4">Panel de Control</h1>
      <p className="text-muted mb-5">
        Bienvenido, {user?.first_name}. Selecciona una opción:
      </p>

      {user?.role === Role.Administrador && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Reservas de Equipo"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/reservations"
            description="Gestionar reserva de equipos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Reservas de Espacios"
            icon={<FaDoorOpen size={24} style={getIconStyle()} />}
            link="/reservations-room"
            description="Gestionar reservas de espacios físicos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Gestión de Equipos"
            icon={<FaTools size={24} style={getIconStyle()} />}
            link="/equipolist"
            description="Administrar inventario de equipos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Gestión de Espacios"
            icon={<FaBuilding size={24} style={getIconStyle()} />}
            link="/rooms"
            description="Administrar espacios disponibles"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Disponibilidad de Equipos"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/equipmentavailability"
            description="Ver reporte completo del disponibilidad de equipos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Usuarios"
            icon={<FaUsers size={24} style={getIconStyle()} />}
            link="/usuarios"
            description="Gestión de cuentas y permisos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Administración"
            icon={<FaUserShield size={24} style={getIconStyle()} />}
            link="/administracion"
            description="Configuración del sistema"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </Row>
      )}

      {user?.role === Role.EspacioEncargado && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Gestion de Reservas"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/reservations-room"
            description="Revisar y aprobar reservas pendientes"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Creacion de Reservas"
            icon={<FaDoorOpen size={24} style={getIconStyle()} />}
            link="/reservationsroom"
            description="Gestionar reservas de espacios físicos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Lector QR"
            icon={<FaQrcode size={24} style={getIconStyle()} />}
            link="/qrScan"
            description="Leer Codigo QR"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </Row>
      )}

      {user?.role === Role.Encargado && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Reservar Equipo"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/addreservation"
            description="Crear nueva reserva de equipos tecnológicos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />

          <DashboardCard
            title="Aprobar Reservas"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/reservations"
            description="Revisar y aprobar reservas pendientes"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />

          <DashboardCard
            title="Lector QR"
            icon={<FaQrcode size={24} style={getIconStyle()} />}
            link="/qrScan"
            description="Leer Codigo QR"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />

          <DashboardCard
            title="Equipos Disponibles"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/equipmentavailability"
            description="Ver disponibilidad de equipos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </Row>
      )}

      {user?.role === Role.Prestamista && (
        <Row xs={1} md={2} className="g-4">
          <DashboardCard
            title="Reservar Espacio"
            icon={<FaBookmark size={24} style={getIconStyle()} />}
            link="/reservationsroom"
            description="Crear nueva reserva de espacio"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Nueva Reserva"
            icon={<FaComputer size={24} style={getIconStyle()} />}
            link="/addreservation"
            description="Solicitar préstamo de equipos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Mis Reservas Equipos"
            icon={<FaCalendarAlt size={24} style={getIconStyle()} />}
            link="/reservations"
            description="Ver mis reservas equipo"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Mis Reservas Espacios"
            icon={<FaCalendarAlt size={24} style={getIconStyle()} />}
            link="/reservations-room"
            description="Ver mis reservas espacios"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <DashboardCard
            title="Disponibilidad de Equipos"
            icon={<FaClipboardList size={24} style={getIconStyle()} />}
            link="/equipmentavailability"
            description="Ver reporte completo del disponibilidad de equipos"
            borderStyle={cardBorderStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function DashboardCard({
  title,
  icon,
  link,
  description,
  borderStyle,
  onMouseEnter,
  onMouseLeave,
}: DashboardCardProps) {
  return (
    <Col>
      <Card
        as={Link}
        to={link}
        className="h-100 text-decoration-none"
        style={borderStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
