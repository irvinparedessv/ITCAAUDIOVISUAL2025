import { Navbar, Nav, Container, Dropdown, Offcanvas } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaPlus,
  FaList,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaCalendarAlt,
  FaTimes,
  FaBars,
  FaDoorOpen,
  FaClipboardList,
} from "react-icons/fa";
import { FaBell, FaComputer } from "react-icons/fa6";
import { Role } from "../../types/roles";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/AuthContext";
import { useNotificaciones } from "~/hooks/useNotifications";
import React from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiRefreshCcw } from "react-icons/fi";
import type { ReactNode, ElementType } from "react";
import { useTheme } from "../../hooks/ThemeContext";
import type {
  AulaNotification,
  Notificacion,
  ReservaNotification,
} from "../../types/notification";
import { APPLARAVEL } from "~/constants/constant";

interface HoverDropdownProps {
  title: ReactNode; // Change from string to ReactNode
  icon: ElementType;
  children: ReactNode;
}

// Componente NotificationItem
const NotificationItem = ({
  noti,
  userRole,
  navigate,
  removeNotification,
  markAsRead,
}: {
  noti: Notificacion;
  userRole: Role;
  navigate: (path: string, options?: { state?: any }) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
}) => {
  // Verificación segura de la existencia de noti.data
  if (!noti || !noti.data) {
    console.error("Notificación inválida:", noti);
    return null;
  }

  const reservaData = noti.data.reserva || {};
  const estado = reservaData?.estado?.toLowerCase() || "";
  const isPending = estado === "pendiente";
  const isAdminOrManager = [Role.Administrador, Role.Encargado].includes(
    userRole
  );
  const reservaId = reservaData?.id;

  // Verificación segura del tipo de notificación
  const isAulaNotification = [
    "nueva_reserva_aula",
    "estado_reserva_aula",
    "cancelacion_reserva_prestamista",
  ].includes(noti.data.type);

  const estadoStyle = getEstadoStyle(estado);

  const handleClick = () => {
    if (noti.unread) {
      markAsRead(noti.id);
    }

    if (!reservaId) {
      navigate("/reservations");
      return;
    }

    const page = noti.data.reserva.pagina || 1;
    const targetRoute = isAulaNotification
      ? "/reservations-room"
      : "/reservations";

    if (location.pathname === targetRoute) {
      window.dispatchEvent(
        new CustomEvent("force-refresh", {
          detail: { highlightReservaId: reservaId, page },
        })
      );
    } else {
      navigate(targetRoute, {
        state: { highlightReservaId: reservaId, page },
      });
    }
  };

  return (
    <Dropdown.Item
      onClick={handleClick}
      className={`${noti.unread ? "bg-unreadnotification" : ""}`}
      style={{
        maxHeight: "300px",
        overflowY: "auto",
      }}
    >
      <div className="d-flex justify-content-between align-items-start">
        {/* Contenido principal */}
        <div className="flex-grow-1 me-2">
          <div
            className={`fw-bold d-flex align-items-center gap-2 ${
              noti.unread ? "text-unread-title" : ""
            }`}
          >
            {noti.unread && <FaBell />}
            {noti.data.title}
          </div>

          <div className="small text-dark">{noti.data.message}</div>

          {isAulaNotification ? (
            <>
              <div className="d-flex align-items-center gap-1 mt-1">
                <small className="text-dark">
                  Aula:{" "}
                  {(reservaData as AulaNotification).aula || "No especificada"}
                </small>
                {userRole === Role.Prestamista && (
                  <>
                    <span className="mx-1">-</span>
                    <span
                      className={`badge ${estadoStyle.badgeClass} px-2 py-1`}
                    >
                      {estadoStyle.displayText}
                    </span>
                  </>
                )}
              </div>
              <small className="d-block text-dark">
                Fecha:{" "}
                {(reservaData as AulaNotification).fecha || "No especificada"}
              </small>
              <small className="d-block text-dark">
                Horario:{" "}
                {(reservaData as AulaNotification).horario || "No especificado"}
              </small>
            </>
          ) : (
            <>
              <div className="d-flex align-items-center gap-1 mt-1">
                <small className="text-dark">
                  Aula:{" "}
                  {(reservaData as ReservaNotification).aula ||
                    "No especificada"}
                </small>
                {userRole === Role.Prestamista && (
                  <>
                    <span className="mx-1">-</span>
                    <span
                      className={`badge ${estadoStyle.badgeClass} px-2 py-1`}
                    >
                      {estadoStyle.displayText}
                    </span>
                  </>
                )}
              </div>
              {(reservaData as ReservaNotification).equipos && (
                <small className="d-block text-dark">
                  Equipos:{" "}
                  {(() => {
                    const equipos = (reservaData as ReservaNotification).equipos;
                    const nombres = equipos?.map((e) => e.nombre).join(", ") ?? "";
                    return nombres.length > 55 ? `${nombres.slice(0, 55)}...` : nombres;
                  })()}
                </small>
              )}

            </>
          )}

          <div className="small mt-1 notification-date">
            {noti.createdAt.toLocaleString()}
          </div>
        </div>

        {/* Botón eliminar */}
        <div className="flex-shrink-0 mt-1">
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(noti.id);
            }}
            title="Eliminar notificación"
            style={{ padding: "0.15rem 0.3rem" }}
          >
            <FaTimes size={12} />
          </button>
        </div>
      </div>
    </Dropdown.Item>
  );
};

// Componentes CustomToggle
const CustomToggle = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    show?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  }
>(({ children, onClick, show }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick?.(e);
    }}
    className="d-flex align-items-center justify-content-between w-100 px-3 py-2 text-dark border-0 bg-transparent"
  >
    <div className="d-flex align-items-center">{children}</div>
    {show ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
  </button>
));

const CustomUserToggle = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props} className="custom-user-toggle">
    {children}
  </button>
));

const DesktopToggle = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }
>(({ children, onClick }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className="d-flex align-items-center justify-content-start gap-2 px-3 py-2 text-dark"
    style={{
      background: "transparent",
      border: "none",
      cursor: "pointer",
    }}
  >
    {children}
  </div>
));

// Componente para el dropdown que se activa con hover
const HoverDropdown = ({ title, icon: Icon, children }: HoverDropdownProps) => {
  const [show, setShow] = useState(false);

  return (
    <Dropdown
      show={show}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      className="mx-1 hover-dropdown"
    >
      <Dropdown.Toggle
        as={DesktopToggle}
        id={`dropdown-${
          typeof title === "string"
            ? title.toLowerCase().replace(" ", "-")
            : "dropdown"
        }`}
      >
        <Icon className="me-1" /> {title}
      </Dropdown.Toggle>
      <Dropdown.Menu
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </Dropdown.Menu>
    </Dropdown>
  );
};

// Componente principal NavbarMenu
const NavbarMenu = () => {
  const { user, logout, checkAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const {
    notificaciones,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useNotificaciones();

  const handleLogout = () => {
    logout();
  };

  const hideNavbarRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/forbidden",
  ];

  useEffect(() => {
    const handleNotificationUpdate = () => {
      refreshNotifications(); // recarga automáticamente
    };

    window.addEventListener("notification-updated", handleNotificationUpdate);

    return () => {
      window.removeEventListener(
        "notification-updated",
        handleNotificationUpdate
      );
    };
  }, []);

  const { darkMode, toggleDarkMode } = useTheme();

  const shouldShowNavbar =
    user && !hideNavbarRoutes.includes(location.pathname);

  if (!shouldShowNavbar) return null;

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => {
    setShowSidebar(true);
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show");
    });
  };

  // Funciones de renderizado Mobile
  const renderMainMenu = () => (
    <>
      <Nav.Link
        as={Link}
        to="/"
        className="px-3 py-2 rounded text-dark"
        onClick={handleCloseSidebar}
      >
        <FaHome className="me-1" /> Inicio
      </Nav.Link>

      {user?.role === Role.Administrador && (
        <>
          {/* Menu admin mobile */}
          {checkAccess("/reservations") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle as={CustomToggle} id="dropdown-reservas-sidebar">
                <FaComputer className="me-2" /> Reservas
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/addreservation"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaComputer className="me-2" /> Reserva de Equipos
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  to="/reservationsroom"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaDoorOpen className="me-2" /> Reserva de Espacios
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  to="/reservations"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaClipboardList className="me-2" /> Aprobar reservas
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {checkAccess("/equipo") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle as={CustomToggle} id="dropdown-equipo-sidebar">
                <FaComputer className="me-2" /> Equipos
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/equipolist"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaList className="me-2" /> Listado de Tipo de Equipos
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="/tipoEquipo"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaList className="me-2" /> Listado de Equipos
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="/equipo"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaPlus className="me-2" /> Nuevo Equipo
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {checkAccess("/createRoom") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle as={CustomToggle} id="dropdown-equipo-sidebar">
                <FaComputer className="me-2" /> Espacios
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/rooms"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaList className="me-2" /> Listado de Espacios
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="/createRoom"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaPlus className="me-2" /> Nuevo Espacio
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </>
      )}

      {/* Menu encargado mobile */}
      {user?.role === Role.Encargado && (
        <>
          {checkAccess("/reservations") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle as={CustomToggle} id="dropdown-reservas-sidebar">
                <FaComputer className="me-2" /> Reservas
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/addreservation"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaComputer className="me-2" /> Reserva de Equipos
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  to="/reservations"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaClipboardList className="me-2" /> Aprobar reservas
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </>
      )}

      {user?.role === Role.Prestamista && (
        <>
          {checkAccess("/addreservation") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle
                as={CustomToggle}
                id="dropdown-nueva-reserva-sidebar"
              >
                <FaPlus className="me-1" /> Nueva Reserva
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/addreservation"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaComputer className="me-2" /> Reservar Equipos
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="/reservationsroom"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaCalendarAlt className="me-2" /> Reservar Aula
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {checkAccess("/reservations") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle as={CustomToggle} id="dropdown-reservas-sidebar">
                <FaList className="me-1" /> Mis Reservas
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/reservations-room"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaCalendarAlt className="me-2" /> Reservas de Espacios
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="/reservations"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaComputer className="me-2" />
                  Reservas de Equipos
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </>
      )}
    </>
  );

  const renderNotificationsDropdown = (isMobile = false) => {
    if (isMobile) {
      return (
        <Dropdown className="mb-3 offcanvas-dropdown">
          <Dropdown.Toggle
            as={CustomToggle}
            id="dropdown-notifications-sidebar"
          >
            <div className="position-relative">
              <FaBell className="me-2" size={16} />
              {unreadCount > 0 && (
                <span
                  className={`badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle-custom-mobile ${
                    unreadCount > 9 ? "px-1" : ""
                  }`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span>Notificaciones</span>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="w-100"
            style={{
              background:
                "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
            }}
          >
            <Dropdown.Header className="fw-bold">
              <div>Notificaciones ({notificaciones.length})</div>

              {notificaciones.length > 0 && (
                <div className="mt-2 d-flex gap-2">
                  <button
                    className="btn btn-sm bg-transparent border-0 text-dark me-2"
                    title="Actualizar"
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshNotifications();
                    }}
                  >
                    <FiRefreshCcw size={18} />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </Dropdown.Header>

            {notificaciones.length > 0 ? (
              <>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {notificaciones.slice(0, 5).map((noti) => (
                    <NotificationItem
                      key={noti.id}
                      noti={noti}
                      userRole={user?.role || Role.Prestamista}
                      navigate={navigate}
                      removeNotification={removeNotification}
                      markAsRead={markAsRead}
                    />
                  ))}
                </div>
                <Dropdown.Item
                  className="text-center py-3 border-top"
                  onClick={() => navigate("/notifications")}
                >
                  <button className="btn btn-sm btn-notification-link">
                    Ver todas las notificaciones
                  </button>
                </Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item className="text-center py-3">
                No hay notificaciones
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      );
    }

    return (
      <Dropdown align="end" className="w-200">
        <Dropdown.Toggle
          variant="link"
          id="dropdown-notifications"
          className="position-relative w-200 d-flex align-items-center justify-content-start px-3 py-2 border-0"
          style={{ background: "transparent", color: "#000" }}
        >
          <FaBell size={20} className="me-2 text-dark" />
          Notificaciones
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadCount}
              <span className="visually-hidden">notificaciones no leídas</span>
            </span>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu
          style={{
            background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
            minWidth: "300px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <Dropdown.Header className="d-flex justify-content-between align-items-center fw-bold">
            <span>Notificaciones ({notificaciones.length})</span>
            <div>
              {notificaciones.length > 0 && (
                <>
                  <button
                    className="btn btn-sm bg-transparent border-0 text-dark me-2"
                    title="Actualizar"
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshNotifications();
                    }}
                  >
                    <FiRefreshCcw size={18} />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                  >
                    Limpiar todas
                  </button>
                </>
              )}
            </div>
          </Dropdown.Header>
          <Dropdown.Divider />

          {notificaciones.length > 0 ? (
            <>
              {notificaciones.slice(0, 5).map((noti) => (
                <NotificationItem
                  key={noti.id}
                  noti={noti}
                  userRole={user?.role || Role.Prestamista}
                  navigate={navigate}
                  removeNotification={removeNotification}
                  markAsRead={markAsRead}
                />
              ))}

              <Dropdown.Item
                className="text-center py-3 border-top notification-footer"
                onClick={() => navigate("/notifications")}
              >
                <button className="btn btn-sm btn-notification-link">
                  Ver todas las notificaciones
                </button>
              </Dropdown.Item>
            </>
          ) : (
            <Dropdown.Item className="text-center py-3">
              No hay notificaciones 🔕
              <br />
              <button
                className="btn btn-sm btn-primary mt-2 w-100"
                onClick={() => navigate("/notifications")}
              >
                Ir a notificaciones
              </button>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderUserDropdown = (isMobile = false) => {
    if (isMobile) {
      return (
        <Dropdown className="mb-3 offcanvas-dropdown">
          <Dropdown.Toggle as={CustomToggle} id="dropdown-user-sidebar">
            {user?.image ? (
              <img
                src={`${APPLARAVEL}/storage/${user.image}`}
                alt="User"
                className="rounded-circle me-2"
                style={{ width: "30px", height: "30px", objectFit: "cover" }}
              />
            ) : (
              <FaUserCircle size={20} />
            )}
            <span className="user-name-ellipsis">
              {user?.first_name} {user?.last_name}
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="w-100"
            style={{
              background:
                "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
            }}
          >
            <Dropdown.Item
              as={Link}
              to="/perfil"
              className="d-flex align-items-center gap-2 text-dark"
              onClick={handleCloseSidebar}
            >
              Ver Perfil
            </Dropdown.Item>

            <Dropdown.ItemText className="px-3 text-dark">
              <div className="fw-bold">
                {user?.first_name} {user?.last_name}
              </div>
              <small>{user?.email}</small>
            </Dropdown.ItemText>
            <Dropdown.Divider />

            <Dropdown.Item
              onClick={() => {
                toggleDarkMode();
                handleCloseSidebar();
              }}
              className="d-flex align-items-center gap-2 text-dark"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
              {darkMode ? "Modo Claro" : "Modo Oscuro"}
            </Dropdown.Item>

            <Dropdown.Item
              onClick={() => {
                handleLogout();
                handleCloseSidebar();
              }}
              className="text-dark"
            >
              Cerrar Sesión
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      );
    }

    // Para desktop, mantenemos el hover
    return (
      <Dropdown align="end">
        <Dropdown.Toggle as={CustomUserToggle} id="dropdown-user">
          <div className="custom-user-icon">
            {user?.image ? (
              <img
                src={`${APPLARAVEL}/storage/${user.image}`}
                alt="User"
                className="rounded-circle"
                style={{ width: "30px", height: "30px", objectFit: "cover" }}
              />
            ) : (
              <FaUserCircle size={30} />
            )}
          </div>

          <span className="custom-user-name">
            {user?.first_name} {user?.last_name}
          </span>

          <FaChevronDown size={14} style={{ transition: "transform 0.2s" }} />
        </Dropdown.Toggle>

        <Dropdown.Menu
          style={{
            background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
            color: "#000",
          }}
        >
          <Dropdown.Item
            as={Link}
            to="/perfil"
            className="px-3 py-2 d-flex align-items-center gap-2"
          >
            Ver Perfil
          </Dropdown.Item>

          <Dropdown.ItemText className="px-3 py-2" style={{ color: "#000" }}>
            <div className="fw-bold">
              {user?.first_name} {user?.last_name}
            </div>
            <small style={{ color: "#000" }}>{user?.email}</small>
          </Dropdown.ItemText>
          <Dropdown.Divider />

          <Dropdown.Item
            onClick={toggleDarkMode}
            className="px-3 py-2 d-flex align-items-center gap-2"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
            {darkMode ? "Modo Claro" : "Modo Oscuro"}
          </Dropdown.Item>

          <Dropdown.Item onClick={handleLogout} className="px-3 py-2">
            Cerrar Sesión
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  // Funciones de renderizado Desktop con hover
  const renderDesktopMenu = () => (
    <Nav className="ms-auto align-items-center gap-1 flex-row navbar-nav">
      <Nav.Link as={Link} to="/" className="px-3 py-2 rounded text-dark">
        <FaHome className="me-1" /> Inicio
      </Nav.Link>

      {user?.role === Role.Administrador && (
        <>
          {checkAccess("/reservations") && (
            <HoverDropdown
              title={
                <span className="d-flex align-items-center">
                  Reservas <FaChevronDown className="ms-1" size={12} />
                </span>
              }
              icon={FaComputer}
            >
              <Dropdown.Item
                as={Link}
                to="/reservations"
                className="d-flex align-items-start text-dark"
              >
                <FaComputer className="me-2" />
                <div>
                  <div className="fw-bold">Reserva de Equipos</div>
                  <small>Ver o gestionar equipos reservados</small>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                as={Link}
                to="/reservations-room"
                className="d-flex align-items-start text-dark"
              >
                <FaDoorOpen className="me-2" />
                <div>
                  <div className="fw-bold">Reserva de Espacios</div>
                  <small>Ver o gestionar aulas reservadas</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}

          {checkAccess("/equipo") && (
            <HoverDropdown
              title={
                <span className="d-flex align-items-center">
                  Equipos <FaChevronDown className="ms-1" size={12} />
                </span>
              }
              icon={FaComputer}
            >
              <Dropdown.Item
                as={Link}
                to="/equipolist"
                className="d-flex align-items-start text-dark"
              >
                <FaList className="me-2" />
                <div>
                  <div className="fw-bold">Listado de Equipos</div>
                  <small>Ver todos los equipos</small>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                as={Link}
                to="/tipoEquipo"
                className="d-flex align-items-start text-dark"
              >
                <FaList className="me-2" />
                <div>
                  <div className="fw-bold">Listado de Tipo de Equipos</div>
                  <small>Ver todos los tipos de equipos</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}

          {checkAccess("/createRoom") && (
            <HoverDropdown
              title={
                <span className="d-flex align-items-center">
                  Espacios <FaChevronDown className="ms-1" size={12} />
                </span>
              }
              icon={FaList}
            >
              <Dropdown.Item
                as={Link}
                to="/rooms"
                className="d-flex align-items-center gap-2 text-dark"
                onClick={handleCloseSidebar}
              >
                <FaList className="me-2" />
                <div>
                  <div className="fw-bold">Listado de Espacios</div>
                  <small>Ver listado de espacios</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}
        </>
      )}
      {/* Menu encargado desktop */}
      {user?.role === Role.Encargado && (
        <>
          {checkAccess("/reservations") && (
            <HoverDropdown
              title={
                <span className="d-flex align-items-center">
                  Reservas <FaChevronDown className="ms-1" size={12} />
                </span>
              }
              icon={FaComputer}
            >
              <Dropdown.Item
                as={Link}
                to="/addreservation"
                className="d-flex align-items-start text-dark"
              >
                <FaComputer className="me-2" />
                <div>
                  <div className="fw-bold">Reserva de Equipos</div>
                  <small>Ver o gestionar equipos reservados</small>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                as={Link}
                to="/reservations"
                className="d-flex align-items-start text-dark"
                onClick={handleCloseSidebar}
              >
                <FaClipboardList className="me-2" />
                <div>
                  <div className="fw-bold">Aprobar reservas</div>
                  <small>Gestionar reservas</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}
        </>
      )}

      {user?.role === Role.EspacioEncargado && (
        <>
          {checkAccess("/reservations-room") && (
            <HoverDropdown title="Reservas" icon={FaPlus}>
              <Dropdown.Item
                as={Link}
                to="/reservations-room"
                className="d-flex align-items-start text-dark"
              >
                <FaComputer className="me-2" />
                <div>
                  <div className="fw-bold">Gestionar Reservas</div>
                  <small>Aprobar/Rechazar reservas</small>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                as={Link}
                to="/reservationsroom"
                className="d-flex align-items-start text-dark"
              >
                <FaCalendarAlt className="me-2" />
                <div>
                  <div className="fw-bold">Reservar Espacio</div>
                  <small>Solicitar reserva para espacio físico</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}
        </>
      )}
      {user?.role === Role.Prestamista && (
        <>
          {checkAccess("/addreservation") && (
            <HoverDropdown title="Nueva Reserva" icon={FaPlus}>
              <Dropdown.Item
                as={Link}
                to="/addreservation"
                className="d-flex align-items-start text-dark"
              >
                <FaComputer className="me-2" />
                <div>
                  <div className="fw-bold">Reservar Equipos</div>
                  <small>Solicitar equipos tecnológicos</small>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                as={Link}
                to="/reservationsroom"
                className="d-flex align-items-start text-dark"
              >
                <FaCalendarAlt className="me-2" />
                <div>
                  <div className="fw-bold">Reservar Aula</div>
                  <small>Solicitar espacio físico</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}

          {checkAccess("/reservations") && (
            <HoverDropdown title="Mis Reservas" icon={FaList}>
              <Dropdown.Item
                as={Link}
                to="/reservations-room"
                className="d-flex align-items-start text-dark"
              >
                <FaCalendarAlt className="me-2" />
                <div>
                  <div className="fw-bold">Reservas de Aulas</div>
                  <small>Ver o gestionar aulas reservadas</small>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                as={Link}
                to="/reservations"
                className="d-flex align-items-start text-dark"
              >
                <FaComputer className="me-2" />
                <div>
                  <div className="fw-bold">Reservas de Equipos</div>
                  <small>Ver o gestionar equipos reservados</small>
                </div>
              </Dropdown.Item>
            </HoverDropdown>
          )}
        </>
      )}

      {renderNotificationsDropdown()}
      {renderUserDropdown()}
    </Nav>
  );

  return (
    <>
      <Navbar
        expand="xl"
        className="px-4 border-bottom"
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(245, 195, 92))",
        }}
      >
        <Container fluid>
          <div className="d-flex align-items-center">
            <button
              className="navbar-toggler me-2 border-0 d-xl-none"
              onClick={handleShowSidebar}
              style={{ background: "transparent" }}
            >
              <FaBars size={24} className="text-dark" />
            </button>

            <Navbar.Brand as={Link} to="/" className="fw-bold me-4">
              <img
                src="/images/logo.png"
                alt="Logo ReservasTI"
                style={{ height: "50px" }}
              />
            </Navbar.Brand>
          </div>

          <Navbar.Collapse id="basic-navbar-nav">
            {renderDesktopMenu()}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Offcanvas
        show={showSidebar}
        onHide={handleCloseSidebar}
        placement="start"
        className="d-xl-none"
        backdrop={false}
        style={{
          width: "280px",
          background: "linear-gradient(rgb(245, 195, 92), rgb(245, 195, 92))",
        }}
      >
        <Offcanvas.Header closeButton closeVariant="black">
          <Offcanvas.Title>
            <img
              src="/images/logo.png"
              alt="Logo ReservasTI"
              style={{ height: "40px" }}
            />
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {renderMainMenu()}
          {renderNotificationsDropdown(true)}
          {renderUserDropdown(true)}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

// Función auxiliar para estilos de estado
function getEstadoStyle(estado: string): {
  className: string;
  displayText: string;
  badgeClass: string; // Nueva propiedad para las clases del badge
} {
  const estadoLower = estado.toLowerCase();

  switch (estadoLower) {
    case "pendiente":
      return {
        className: "text-warning",
        displayText: "Pendiente",
        badgeClass: "bg-warning text-dark",
      };
    case "approved":
    case "aprobado":
    case "confirmada":
      return {
        className: "text-success",
        displayText: "Aprobado",
        badgeClass: "bg-primary text-white",
      };
    case "rejected":
    case "rechazado":
      return {
        className: "text-danger",
        displayText: "Rechazado",
        badgeClass: "bg-danger text-white",
      };
    case "returned":
    case "devuelto":
    case "completada":
      return {
        className: "text-info",
        displayText: "Completada",
        badgeClass: "bg-success text-white",
      };
    case "cancelado":
      return {
        className: "text-secondary",
        displayText: "Cancelado",
        badgeClass: "bg-secondary text-white",
      };
    default:
      return {
        className: "",
        displayText: estado,
        badgeClass: "bg-secondary text-white",
      };
  }
}

export default NavbarMenu;
