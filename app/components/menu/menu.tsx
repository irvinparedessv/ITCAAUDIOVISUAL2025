// components/NavbarMenu.tsx
import {
    Navbar,
    Nav,
    Container,
    Dropdown,
  } from "react-bootstrap";
  import { Link, useLocation } from "react-router-dom";
  import {
    FaHome,
    FaPlus,
    FaList,
    FaUserCircle,
    FaMoon,
    FaSun,
    FaCalendarAlt,
  } from "react-icons/fa";
  import { FaBell, FaComputer } from "react-icons/fa6";
  import { Role } from "../../types/roles";
  import { useState, useEffect, useCallback } from "react";
  import { useAuth } from "../../hooks/AuthContext";
  
  const NavbarMenu = () => {
    const { user, logout, checkAccess } = useAuth();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(false);
  
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
  
    return (
      <Navbar
        expand="lg"
        className="px-4 border-bottom"
        style={{
          background: "linear-gradient(rgb(245, 195, 92), rgb(245, 195, 92))",
        }}
      >
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="fw-bold">
            <img
              src="/images/logo.png"
              alt="Logo ReservasTI"
              style={{ height: "50px" }}
            />
          </Navbar.Brand>
  
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="custom-toggler">
            <span className="navbar-toggler-icon"><div /></span>
          </Navbar.Toggle>
  
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-2 flex-column flex-lg-row">
  
              {/* Inicio */}
              <Nav.Link as={Link} to="/" className="px-3 py-2 rounded w-200">
                <FaHome className="me-1" /> Inicio
              </Nav.Link>
  
              {/* ADMINISTRADOR */}
              {user?.role === Role.Administrador && (
                <>
                  {checkAccess("/reservations") && (
                    <Nav.Link as={Link} to="/reservations" className="px-3 py-2 rounded nav-hover-white w-200">
                      <FaList className="me-1" /> Reservas
                    </Nav.Link>
                  )}
  
                  {checkAccess("/equipo") && (
                    <Dropdown className="w-200">
                      <Dropdown.Toggle variant="link" id="dropdown-equipo" className="nav-dropdown-toggle px-3 py-2 rounded w-200 d-flex align-items-center">
                        <FaComputer className="me-1" /> Equipos
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        style={{
                          background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                          minWidth: "300px",
                        }}
                      >
                        <Dropdown.Item as={Link} to="/equipo" className="d-flex align-items-start py-2">
                          <FaList className="me-2" />
                          <div>
                            <div className="fw-bold">Listado de Equipos</div>
                            <small>Ver todos los equipos</small>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/formEquipo" className="d-flex align-items-start py-2">
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
                    <Nav.Link as={Link} to="/formEspacio" className="px-3 py-2 rounded nav-hover-white w-200">
                      <FaList className="me-1" /> Espacios
                    </Nav.Link>
                  )}
                </>
              )}
  
              {/* ENCARGADO */}
              {user?.role === Role.Encargado && (
                <>
                  {checkAccess("/formEquipo") && (
                    <Nav.Link as={Link} to="/formEquipo" className="px-3 py-2 rounded nav-hover-white w-200">
                      <FaPlus className="me-1" /> Equipos
                    </Nav.Link>
                  )}
                  {checkAccess("/formEspacio") && (
                    <Nav.Link as={Link} to="/formEspacio" className="px-3 py-2 rounded nav-hover-white w-200">
                      <FaList className="me-1" /> Reservas
                    </Nav.Link>
                  )}
                </>
              )}
  
              {/* PRESTAMISTA */}
              {user?.role === Role.Prestamista && (
                <>
                  {checkAccess("/addreservation") && (
                    <Nav.Link as={Link} to="/addreservation" className="px-3 py-2 rounded nav-hover-white w-200">
                      <FaPlus className="me-1" /> Reservar
                    </Nav.Link>
                  )}
                  {checkAccess("/reservations") && (
                    <Nav.Link as={Link} to="/reservations" className="px-3 py-2 rounded nav-hover-white w-200">
                      <FaList className="me-1" /> Mis Reservas
                    </Nav.Link>
                  )}
                </>
              )}
  
              {/* 🔔 Notificaciones */}
              <Dropdown align="end" className="w-200">
                <Dropdown.Toggle
                  variant="link"
                  id="dropdown-notifications"
                  className="position-relative w-200 d-flex align-items-center justify-content-start px-3 py-2 border-0"
                  style={{ background: "transparent", color: "#000" }}
                >
                  <FaBell size={20} className="me-2 text-dark" />
                  Notificaciones
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    3
                    <span className="visually-hidden">notificaciones no leídas</span>
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu
                  style={{
                    background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                    minWidth: "300px",
                  }}
                >
                  <Dropdown.Header className="fw-bold">Notificaciones</Dropdown.Header>
                  <Dropdown.Item as={Link} to="/reservations" className="d-flex align-items-start py-2">
                    <div className="me-2"><FaCalendarAlt /></div>
                    <div>
                      <div className="fw-bold">Tus reservas</div>
                      <small>Ver todas tus reservas activas</small>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
  
              {/* 👤 Usuario */}
              <Dropdown align="end" className="w-200">
                <Dropdown.Toggle
                  id="dropdown-user"
                  className="w-200 d-flex align-items-center justify-content-start gap-2 px-3 py-2"
                  style={{
                    background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                    border: "none",
                    color: "#000",
                  }}
                >
                  {user?.image ? (
                    <img
                      src={`http://localhost:8000/storage/${user.image}`}
                      alt="User"
                      className="rounded-circle"
                      style={{ width: "30px", height: "30px", objectFit: "cover" }}
                    />
                  ) : (
                    <FaUserCircle size={24} />
                  )}
                  <span>{user?.first_name} {user?.last_name}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu
                  style={{
                    background: "linear-gradient(rgb(245, 195, 92), rgb(206, 145, 20))",
                    color: "#000",
                  }}
                >
                  <Dropdown.ItemText className="px-3 py-2" style={{ color: "#000" }}>
                    <div className="fw-bold">
                        {user?.first_name} {user?.last_name}
                    </div>
                    <small style={{ color: "#000" }}>{user?.email}</small>
                    </Dropdown.ItemText>
                <Dropdown.Divider />
  
                  <Dropdown.Item onClick={toggleDarkMode} className="px-3 py-2 d-flex align-items-center gap-2">
                    {darkMode ? <FaSun /> : <FaMoon />}
                    {darkMode ? "Modo Claro" : "Modo Oscuro"}
                  </Dropdown.Item>
  
                  <Dropdown.Item onClick={handleLogout} className="px-3 py-2">
                    Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  };
  
  export default NavbarMenu;