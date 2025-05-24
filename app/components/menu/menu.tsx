import { Navbar, Nav, Container, Dropdown, Offcanvas } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FaHome, FaPlus, FaList, FaUserCircle, FaMoon, FaSun, 
  FaCalendarAlt, FaTimes, FaBars 
} from "react-icons/fa";
import { FaBell, FaComputer } from "react-icons/fa6";
import { Role } from "../../types/roles";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/AuthContext";
import { useNotificaciones } from "~/hooks/useNotificaciones";
import React from 'react';

// Estilos CSS integrados

interface EquipoNotification {
  nombre: string;
  tipo_equipo?: string;
}

interface ReservaNotification {
  id: number;
  user?: string;
  aula: string;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: string;
  tipo_reserva?: string;
  equipos?: EquipoNotification[];
  comentario?: string;
}

interface NotificacionData {
  type: 'nueva_reserva' | 'estado_reserva';
  title: string;
  message: string;
  reserva: ReservaNotification;
}

interface Notificacion {
  id: string;
  data: NotificacionData;
  createdAt: Date;
  readAt: Date | null;
  unread: boolean;
  type: string;
}

const NotificationItem = ({ 
  noti, 
  userRole, 
  navigate, 
  removeNotification,
  markAsRead
}: {
  noti: Notificacion;
  userRole: Role;
  navigate: (path: string, options?: { state?: any }) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
}) => {
  const reservaData = noti.data.reserva || {};
  const estado = reservaData.estado?.toLowerCase() || '';
  const isPending = estado === 'pendiente';
  const isAdminOrManager = [Role.Administrador, Role.Encargado].includes(userRole);
  const reservaId = reservaData.id;
  const estadoStyle = getEstadoStyle(estado);

  const handleClick = () => {
    if (noti.unread) {
      markAsRead(noti.id);
    }

    if (!reservaId) {
      console.error('Error: ID de reserva no definido');
      navigate("/reservations");
      return;
    }

    if (noti.data.type === 'nueva_reserva' && isPending && isAdminOrManager) {
      navigate(`/actualizarEstado/${reservaId}`);
    } else {
      navigate("/reservations", { 
        state: { highlightReservaId: reservaId } 
      });
    }
  };

  return (
    <Dropdown.Item
      onClick={handleClick}
      className={`d-flex justify-content-between align-items-start py-2 ${
        noti.unread ? "bg-unreadnotification" : ""
      }`}
    >
      <div className="flex-grow-1">
        <div className="fw-bold">{noti.data.title}</div>
        <div className="small">{noti.data.message}</div>
        {reservaData && (
          <>
            <small className="d-block">
              Aula: {reservaData.aula || 'No especificada'}
              {userRole === Role.Prestamista && (
                <> - Estado: <span className={estadoStyle.className}>{estadoStyle.displayText}</span></>
              )}
            </small>
            {reservaData.equipos && (
              <small className="d-block">
                Equipos:{" "}
                {reservaData.equipos.map(e => e.nombre).join(", ")}
              </small>
            )}
          </>
        )}
        <div className="small mt-1 notification-date">
          {noti.createdAt.toLocaleString()}
        </div>
      </div>
      <button
        className="btn btn-sm btn-outline-danger ms-2"
        onClick={(e) => {
          e.stopPropagation();
          removeNotification(noti.id);
        }}
        title="Eliminar notificación"
        style={{ padding: "0.15rem 0.3rem" }}
      >
        <FaTimes size={12} />
      </button>
    </Dropdown.Item>
  );
};

const CustomToggle = React.forwardRef(({ children, onClick }: any, ref: any) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="d-flex align-items-center w-100 px-3 py-2 text-dark border-0 bg-transparent"
  >
    {children}
  </a>
));

const NavbarMenu = () => {
  const { user, logout, checkAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const {
    notificaciones,
    unreadCount,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useNotificaciones();

  useEffect(() => {
    // Agregar estilos al head del documento
    const styleElement = document.createElement('style');
    
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedMode ? JSON.parse(savedMode) : prefersDark;
    setDarkMode(isDark);
    updateTheme(isDark);
  }, []);

  const updateTheme = (isDark: boolean) => {
    document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
    document.body.classList.toggle("dark", isDark);
    document.body.classList.toggle("light", !isDark);
  };

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
    updateTheme(newMode);
  }, [darkMode]);

  const handleLogout = () => {
    logout();
  };

  const hideNavbarRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/forbidden",
  ];

  const shouldShowNavbar = user && !hideNavbarRoutes.includes(location.pathname);

  if (!shouldShowNavbar) return null;

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);

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
          {checkAccess("/reservations") && (
            <Nav.Link
              as={Link}
              to="/reservations"
              className="px-3 py-2 rounded text-dark"
              onClick={handleCloseSidebar}
            >
              <FaList className="me-1" /> Reservas
            </Nav.Link>
          )}

          {checkAccess("/equipo") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle
                as={CustomToggle}
                id="dropdown-equipo-sidebar"
                className="d-flex align-items-center w-100 px-3 py-2 text-dark border-0 bg-transparent"
              >
                <FaComputer className="me-1" /> Equipos
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/equipo"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaList className="me-2" />
                  Listado de Equipos
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="/formEquipo"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaPlus className="me-2" />
                  Nuevo Equipo
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {checkAccess("/formEspacio") && (
            <Nav.Link
              as={Link}
              to="/formEspacio"
              className="px-3 py-2 rounded text-dark"
              onClick={handleCloseSidebar}
            >
              <FaList className="me-1" /> Espacios
            </Nav.Link>
          )}
        </>
      )}

      {user?.role === Role.Encargado && (
        <>
          {checkAccess("/formEquipo") && (
            <Nav.Link
              as={Link}
              to="/formEquipo"
              className="px-3 py-2 rounded text-dark"
              onClick={handleCloseSidebar}
            >
              <FaPlus className="me-1" /> Equipos
            </Nav.Link>
          )}
          {checkAccess("/formEspacio") && (
            <Nav.Link
              as={Link}
              to="/formEspacio"
              className="px-3 py-2 rounded text-dark"
              onClick={handleCloseSidebar}
            >
              <FaList className="me-1" /> Reservas
            </Nav.Link>
          )}
        </>
      )}

      {user?.role === Role.Prestamista && (
        <>
          {checkAccess("/addreservation") && (
            <Nav.Link
              as={Link}
              to="/addreservation"
              className="px-3 py-2 rounded text-dark"
              onClick={handleCloseSidebar}
            >
              <FaPlus className="me-1" /> Reservar
            </Nav.Link>
          )}
          {checkAccess("/reservations") && (
            <Dropdown className="mb-2 offcanvas-dropdown">
              <Dropdown.Toggle
                as={CustomToggle}
                id="dropdown-reservas-sidebar"
                className="d-flex align-items-center w-100 px-3 py-2 text-dark border-0 bg-transparent"
              >
                <FaList className="me-1" /> Mis Reservas
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                <Dropdown.Item
                  as={Link}
                  to="/reservations-room"
                  className="d-flex align-items-center gap-2 text-dark"
                  onClick={handleCloseSidebar}
                >
                  <FaCalendarAlt className="me-2" />
                  Reservas de Aulas
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

  const renderNotificationsDropdown = () => (
    <Dropdown className="mb-3 offcanvas-dropdown">
      <Dropdown.Toggle 
        as={CustomToggle}
        id="dropdown-notifications-sidebar"
        className="d-flex align-items-center w-100 px-3 py-2 text-dark border-0 bg-transparent"
      >
        <FaBell className="me-2" />
        <span>Notificaciones</span>
        {unreadCount > 0 && (
          <span className="badge rounded-pill bg-danger ms-2">
            {unreadCount}
          </span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="w-100">
        <Dropdown.Header className="d-flex justify-content-between align-items-center fw-bold">
          <span>Notificaciones ({notificaciones.length})</span>
          <div>
            {notificaciones.length > 0 && (
              <>
                <button
                  className="btn btn-sm btn-outline-danger me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllNotifications();
                  }}
                >
                  Limpiar
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/notifications");
                  }}
                >
                  Ver todas
                </button>
              </>
            )}
          </div>
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

  const renderUserDropdown = () => (
    <Dropdown className="mb-3 offcanvas-dropdown">
      <Dropdown.Toggle
        as={CustomToggle}
        id="dropdown-user-sidebar"
        className="d-flex align-items-center w-100 px-3 py-2 text-dark border-0 bg-transparent"
      >
        {user?.image ? (
          <img
            src={`http://localhost:8000/storage/${user.image}`}
            alt="User"
            className="rounded-circle me-2"
            style={{
              width: "30px",
              height: "30px",
              objectFit: "cover",
            }}
          />
        ) : (
          <FaUserCircle className="me-2" />
        )}
        <span>{user?.first_name} {user?.last_name}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="w-100">
        <Dropdown.Item
          as={Link}
          to="/perfil"
          className="d-flex align-items-center gap-2 text-dark"
          onClick={handleCloseSidebar}
        >
          Ver Perfil
        </Dropdown.Item>

        <Dropdown.ItemText className="px-3 py-2 text-dark">
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

  return (
    <>
      <Navbar
        expand="xxl"
        className="px-4 border-bottom"
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(245, 195, 92))",
        }}
      >
        <Container fluid>
          <div className="d-flex align-items-center">
            <button 
              className="navbar-toggler me-2 border-0" 
              onClick={handleShowSidebar}
              style={{ background: 'transparent' }}
            >
              <FaBars size={24} className="text-dark" />
            </button>
            
            <Navbar.Brand as={Link} to="/" className="fw-bold">
              <img
                src="/images/logo.png"
                alt="Logo ReservasTI"
                style={{ height: "50px" }}
              />
            </Navbar.Brand>
          </div>

          <Navbar.Collapse id="navbar-main-menu" className="justify-content-center">
            <Nav className="ms-auto align-items-center gap-2 flex-column flex-lg-row navbar-nav">
              <Nav.Link 
                as={Link} 
                to="/" 
                className="px-3 py-2 rounded text-dark" 
              >
                <FaHome className="me-1" /> Inicio
              </Nav.Link>

              {user?.role === Role.Administrador && (
                <>
                  {checkAccess("/reservations") && (
                    <Nav.Link
                      as={Link}
                      to="/reservations"
                      className="px-3 py-2 rounded text-dark"
                    >
                      <FaList className="me-1" /> Reservas
                    </Nav.Link>
                  )}

                  {checkAccess("/equipo") && (
                    <Dropdown className="mx-1">
                      <Dropdown.Toggle
                        variant="link"
                        id="dropdown-equipo"
                        className="nav-dropdown-toggle px-3 py-2 rounded text-dark d-flex align-items-center"
                      >
                        <FaComputer className="me-1" /> Equipos
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        style={{
                          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                        }}
                      >
                        <Dropdown.Item
                          as={Link}
                          to="/equipo"
                          className="d-flex align-items-start py-2 text-dark"
                        >
                          <FaList className="me-2" />
                          <div>
                            <div className="fw-bold">Listado de Equipos</div>
                            <small>Ver todos los equipos</small>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to="/formEquipo"
                          className="d-flex align-items-start py-2 text-dark"
                        >
                          <FaPlus className="me-2" />
                          <div>
                            <div className="fw-bold">Nuevo Equipo</div>
                            <small>Agregar un nuevo equipo</small>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  )}

                  {checkAccess("/formEspacio") && (
                    <Nav.Link
                      as={Link}
                      to="/formEspacio"
                      className="px-3 py-2 rounded text-dark"
                    >
                      <FaList className="me-1" /> Espacios
                    </Nav.Link>
                  )}
                </>
              )}

              {user?.role === Role.Encargado && (
                <>
                  {checkAccess("/formEquipo") && (
                    <Nav.Link
                      as={Link}
                      to="/formEquipo"
                      className="px-3 py-2 rounded text-dark"
                    >
                      <FaPlus className="me-1" /> Equipos
                    </Nav.Link>
                  )}
                  {checkAccess("/formEspacio") && (
                    <Nav.Link
                      as={Link}
                      to="/formEspacio"
                      className="px-3 py-2 rounded text-dark"
                    >
                      <FaList className="me-1" /> Reservas
                    </Nav.Link>
                  )}
                </>
              )}

              {user?.role === Role.Prestamista && (
                <>
                  {checkAccess("/addreservation") && (
                    <Nav.Link
                      as={Link}
                      to="/addreservation"
                      className="px-3 py-2 rounded text-dark"
                    >
                      <FaPlus className="me-1" /> Reservar
                    </Nav.Link>
                  )}
                  {checkAccess("/reservations") && (
                    <Dropdown className="mx-1">
                      <Dropdown.Toggle
                        variant="link"
                        id="dropdown-reservas"
                        className="nav-dropdown-toggle px-3 py-2 rounded text-dark d-flex align-items-center"
                      >
                        <FaList className="me-1" /> Mis Reservas
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        style={{
                          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                        }}
                      >
                        <Dropdown.Item
                          as={Link}
                          to="/reservations-room"
                          className="d-flex align-items-start py-2 text-dark"
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
                          className="d-flex align-items-start py-2 text-dark"
                        >
                          <FaComputer className="me-2" />
                          <div>
                            <div className="fw-bold">Reservas de Equipos</div>
                            <small>Ver o gestionar equipos reservados</small>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </>
              )}
            </Nav>
          </Navbar.Collapse>

          <div className="d-flex align-items-center ms-auto">
            <Dropdown align="end" className="me-2 d-none d-xxl-block">
              <Dropdown.Toggle
                variant="link"
                id="dropdown-notifications-desktop"
                className="position-relative d-flex align-items-center justify-content-start px-3 py-2 border-0 text-dark"
                style={{ background: "transparent" }}
              >
                <FaBell size={20} className="me-2" />
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
                          className="btn btn-sm btn-outline-danger me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllNotifications();
                          }}
                        >
                          Limpiar todas
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/notifications");
                          }}
                        >
                          Ver todas
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
                    No hay notificaciones
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

            <Dropdown align="end" className="d-none d-xxl-block">
              <Dropdown.Toggle
                id="dropdown-user-desktop"
                className="d-flex align-items-center justify-content-start gap-2 px-3 py-2 text-dark"
                style={{
                  background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                  border: "none",
                }}
              >
                {user?.image ? (
                  <img
                    src={`http://localhost:8000/storage/${user.image}`}
                    alt="User"
                    className="rounded-circle"
                    style={{
                      width: "30px",
                      height: "30px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <FaUserCircle size={24} />
                )}
                <span>
                  {user?.first_name} {user?.last_name}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu
                style={{
                  background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                }}
              >
                <Dropdown.Item
                  as={Link}
                  to="/perfil"
                  className="px-3 py-2 d-flex align-items-center gap-2 text-dark"
                >
                  Ver Perfil
                </Dropdown.Item>

                <Dropdown.ItemText className="px-3 py-2 text-dark">
                  <div className="fw-bold">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <small>{user?.email}</small>
                </Dropdown.ItemText>
                <Dropdown.Divider />

                <Dropdown.Item
                  onClick={toggleDarkMode}
                  className="px-3 py-2 d-flex align-items-center gap-2 text-dark"
                >
                  {darkMode ? <FaSun /> : <FaMoon />}
                  {darkMode ? "Modo Claro" : "Modo Oscuro"}
                </Dropdown.Item>

                <Dropdown.Item onClick={handleLogout} className="px-3 py-2 text-dark">
                  Cerrar Sesión
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      <Offcanvas 
        show={showSidebar} 
        onHide={handleCloseSidebar}
        placement="start"
        style={{
          width: '280px',
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
          {renderNotificationsDropdown()}
          {renderMainMenu()}
          {renderUserDropdown()}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

function getEstadoStyle(estado: string): { className: string, displayText: string } {
  const estadoLower = estado.toLowerCase();
  
  switch(estadoLower) {
    case 'pendiente':
      return { 
        className: 'text-warning', 
        displayText: 'Pendiente' 
      };
    case 'approved':
    case 'aprobado':
      return { 
        className: 'text-success', 
        displayText: 'Aprobado' 
      };
    case 'rejected':
    case 'rechazado':
      return { 
        className: 'text-danger', 
        displayText: 'Rechazado' 
      };
    case 'returned':
    case 'devuelto':
      return { 
        className: 'text-info', 
        displayText: 'Devuelto' 
      };
    default:
      return { 
        className: '', 
        displayText: estado 
      };
  }
}

export default NavbarMenu;