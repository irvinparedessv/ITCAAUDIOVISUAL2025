import React, { useEffect } from "react";
import { Link } from "react-router-dom";
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
import { FaComputer, FaBookmark, FaMapLocation } from "react-icons/fa6";
import { Card, Container, Row, Col } from "react-bootstrap";
import { Role } from "../types/roles";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    toast.dismiss();
  }, []);

  return (
    <Container fluid className={"dashboardContainer"}>
      <h1 className={"welcomeHeader py-3"}>
        {user?.role === Role.Prestamista
          ? "Área Personal"
          : "Centro de administración"}
      </h1>
      <p className={"welcomeText"}>
        {user?.role === Role.Prestamista &&
          `Bienvenido ${user?.first_name}, este es tu espacio personal para gestionar tus reservas.`}
        {user?.role === Role.Administrador &&
          `Bienvenido ${user?.first_name}, aquí puedes administrar todo el sistema.`}
        {user?.role === Role.Encargado &&
          `Bienvenido ${user?.first_name}, gestiona las reservas de equipos.`}
        {user?.role === Role.EspacioEncargado &&
          `Bienvenido ${user?.first_name}, gestiona las reservas de aulas y espacios.`}
      </p>
      {user?.role === Role.Administrador && (
        <div className={"roleSection"}>
          <h2 className={"roleTitle"}>Administrador</h2>
          <Row xs={1} md={2} lg={3} className="g-4">
            <DashboardCard
              title="Reservas de Equipo"
              icon={<FaComputer size={24} />}
              link="/reservations"
              description="Gestionar reserva de equipos"
            />
            <DashboardCard
              title="Reservas de Espacios"
              icon={<FaDoorOpen size={24} />}
              link="/reservations-room"
              description="Gestionar reservas de espacios físicos"
            />
            <DashboardCard
              title="Gestión de Equipos"
              icon={<FaTools size={24} />}
              link="/inventario"
              description="Administrar inventario de equipos"
            />
            <DashboardCard
              title="Gestión de Espacios"
              icon={<FaBuilding size={24} />}
              link="/rooms"
              description="Administrar espacios disponibles"
            />
            <DashboardCard
              title="Disponibilidad de Equipos"
              icon={<FaClipboardList size={24} />}
              link="/equipmentavailability"
              description="Ver reporte completo del disponibilidad de equipos"
            />
            <DashboardCard
              title="Disponibilidad de Espacios"
              icon={<FaClipboardList size={24} />}
              link="/roomsavailability"
              description="Ver reporte completo de disponibilidad de espacios"
            />
            <DashboardCard
              title="Usuarios"
              icon={<FaUsers size={24} />}
              link="/usuarios"
              description="Gestión de cuentas y permisos"
            />
            <DashboardCard
              title="Administración"
              icon={<FaUserShield size={24} />}
              link="/administracion"
              description="Configuración del sistema"
            />
          </Row>
        </div>
      )}

      {user?.role === Role.EspacioEncargado && (
        <div className={"roleSection"}>
          <h2 className={"roleTitle"}>Encargado de Espacios</h2>
          <Row xs={1} md={2} lg={3} className="g-4">
            <DashboardCard
              title="Creacion de Reservas"
              icon={<FaDoorOpen size={24} />}
              link="/reservationsroom"
              description="Gestionar reservas de espacios físicos"
            />
            <DashboardCard
              title="Gestion de Reservas"
              icon={<FaClipboardList size={24} />}
              link="/reservations-room"
              description="Revisar y aprobar reservas pendientes"
            />
            <DashboardCard
              title="Lector QR"
              icon={<FaQrcode size={24} />}
              link="/qrScan"
              description="Leer Codigo QR"
            />
            <DashboardCard
              title="Reporte de reserva de espacios"
              icon={<FaRegFileAlt size={24} />}
              link="/reporteReservasAulas"
              description="Reporte de reserva de espacios"
            />
            <DashboardCard
              title="Gestion de Conflictos y Disponibilidad"
              icon={<FaClipboardList size={24} />}
              link="/managerooms"
              description="Revisar y aprobar reservas pendientes ,conflictos"
            />
          </Row>
        </div>
      )}

      {user?.role === Role.Encargado && (
        <div className={"roleSection"}>
          <h2 className={"roleTitle"}>Encargado</h2>
          <Row xs={1} md={2} lg={3} className="g-4">
            <DashboardCard
              title="Reservar Equipo"
              icon={<FaComputer size={24} />}
              link="/addreservation"
              description="Crear nueva reserva de equipos tecnológicos"
            />
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
              title="Equipos Disponibles"
              icon={<FaComputer size={24} />}
              link="/equipmentavailability"
              description="Ver disponibilidad de equipos"
            />
            <DashboardCard
              title="Administración"
              icon={<FaUserShield size={24} />}
              link="/administracion"
              description="Configuración del sistema"
            />
          </Row>
        </div>
      )}

      {user?.role === Role.Prestamista && (
        <div className={"roleSection"}>
          <h2 className={"roleTitle"}>Prestamista</h2>
          <Row xs={1} md={2} lg={3} className="g-4">
            <DashboardCard
              title="Reservar Espacio"
              icon={<FaBookmark size={24} />}
              link="/reservationsroom"
              description="Crear nueva reserva de espacio"
            />
            <DashboardCard
              title="Reservar Equipo"
              icon={<FaComputer size={24} />}
              link="/addreservation"
              description="Solicitar préstamo de equipos"
            />
            <DashboardCard
              title="Mis Reservas Equipos"
              icon={<FaCalendarAlt size={24} />}
              link="/reservations"
              description="Ver mis reservas equipo"
            />
            <DashboardCard
              title="Mis Reservas Espacios"
              icon={<FaCalendarAlt size={24} />}
              link="/reservations-room"
              description="Ver mis reservas espacios"
            />
            <DashboardCard
              title="Disponibilidad de Equipos"
              icon={<FaClipboardList size={24} />}
              link="/equipmentavailability"
              description="Ver reporte completo del disponibilidad de equipos"
            />
            <DashboardCard
              title="Disponibilidad de Espacios"
              icon={<FaClipboardList size={24} />}
              link="/roomsavailability"
              description="Ver reporte completo de disponibilidad de espacios"
            />
          </Row>
        </div>
      )}
    </Container>
  );
}

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  description: string;
}

function DashboardCard({ title, icon, link, description }: DashboardCardProps) {
  return (
    <Col>
      <Card as={Link} to={link} className={`text-decoration-none ${"card"}`}>
        <Card.Body className="text-center p-4">
          <div className={"iconWrapper"}>{icon}</div>
          <h5 className={"cardTitle"}>{title}</h5>
          <p className={"cardDescription"}>{description}</p>
        </Card.Body>
      </Card>
    </Col>
  );
}
