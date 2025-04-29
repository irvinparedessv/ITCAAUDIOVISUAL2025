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
import { FaComputer } from "react-icons/fa6";
import { Card, Container, Row, Col } from "react-bootstrap";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Container className="py-5">
      <h1 className="mb-4">Panel de Control</h1>
      <p className="text-muted mb-5">
        Bienvenido, {user?.name}. Selecciona una opción:
      </p>

      {user?.role === "Administrador" && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Reservar Equipo"
            icon={<FaComputer size={24} />}
            link="/addreservation"
            description="Crear nueva reserva de equipos tecnológicos"
          />
          <DashboardCard
            title="Todas las Reservas"
            icon={<FaClipboardList size={24} />}
            link="/reservations"
            description="Ver historial completo de reservaciones"
          />
          <DashboardCard
            title="Gestión de Equipos"
            icon={<FaTools size={24} />}
            link="/formEquipo"
            description="Administrar inventario de equipos"
          />
          <DashboardCard
            title="Gestión de Espacios"
            icon={<FaBuilding size={24} />}
            link="/formEspacio"
            description="Administrar espacios disponibles"
          />
          <DashboardCard
            title="Inventario"
            icon={<FaClipboardList size={24} />}
            link="/inventario"
            description="Ver reporte completo del inventario"
          />
          <DashboardCard
            title="Administración"
            icon={<FaUserShield size={24} />}
            link="/"
            description="Configuración del sistema"
          />
        </Row>
      )}

      {user?.role === "Encargado" && (
        <Row xs={1} md={2} lg={3} className="g-4">
          <DashboardCard
            title="Aprobar Reservas"
            icon={<FaClipboardList size={24} />}
            link="/reservations"
            description="Revisar y aprobar reservas pendientes"
          />
          <DashboardCard
            title="Lector QR"
            icon={<FaQrcode size={24} />}
            link="/qrScan"
            description="Leer Codigo QR"
          />
          <DashboardCard
            title="Reservas de Espacios"
            icon={<FaBuilding size={24} />}
            link="/reservationsroom"
            description="Gestionar reservas de espacios físicos"
          />
          <DashboardCard
            title="Equipos Disponibles"
            icon={<FaComputer size={24} />}
            link="/formEquipo"
            description="Ver disponibilidad de equipos"
          />
        </Row>
      )}

      {user?.role === "Prestamista" && (
        <Row xs={1} md={2} className="g-4">
          <DashboardCard
            title="Nueva Reserva"
            icon={<FaComputer size={24} />}
            link="/addreservation"
            description="Solicitar préstamo de equipos"
          />
          <DashboardCard
            title="Mis Reservas"
            icon={<FaCalendarAlt size={24} />}
            link="/reservations"
            description="Ver mis reservas activas"
          />
        </Row>
      )}
    </Container>
  );
}

function DashboardCard({
  title,
  icon,
  link,
  description,
}: {
  title: string;
  icon: React.ReactNode;
  link: string;
  description: string;
}) {
  return (
    <Col>
      <Card
        as={Link}
        to={link}
        className="h-100 text-decoration-none hover-shadow"
      >
        <Card.Body className="text-center py-4">
          <div className="text-primary mb-3">{icon}</div>
          <h5 className="mb-2">{title}</h5>
          <p className="text-muted small mb-0">{description}</p>
        </Card.Body>
      </Card>
    </Col>
  );
}
