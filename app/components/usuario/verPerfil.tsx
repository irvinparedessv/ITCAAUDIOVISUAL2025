// VerPerfil.tsx
import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaIdBadge,
  FaUser,
  FaUserCircle,
  FaKey,
} from "react-icons/fa";
import { getPerfil } from "../../services/userService"; // Asegúrate de importar correctamente
import ChangePasswordModal from "../auth/ChangePasswordModal";

const VerPerfil = () => {
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false); // 👈 Nuevo estado
  const navigate = useNavigate();

  useEffect(() => {
    getPerfil()
      .then((res) => setUser(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Administrador";
      case 2:
        return "Encargado";
      case 3:
        return "Docente";
      case 4:
        return "Encargado Espacio";
      default:
        return "Desconocido";
    }
  };

  const getEstadoName = (estado: number) => {
    return estado === 1 ? "Activo" : "Inactivo";
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="container d-flex justify-content-center">
        <Card className="shadow-lg animate__animated animate__fadeIn" style={{ maxWidth: "700px", width: "100%", borderRadius: "1rem" }}>
          <Card.Body>
            <div className="text-center mb-4">
              {user.image_url ? (
                <img
                  src={user.image_url}
                  alt="Imagen de perfil"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "4px solid #0d6efd",
                  }}
                />
              ) : (
                <FaUserCircle size={150} color="#adb5bd" />
              )}
            </div>

            <h3 className="text-center mb-4">
              {user.first_name} {user.last_name}
            </h3>

            <hr />

            <Row className="mb-2">
              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <FaEnvelope className="me-2 text-primary" />
                  <div>
                    <strong>Correo:</strong>
                    <div>{user.email}</div>
                  </div>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <FaPhone className="me-2 text-success" />
                  <div>
                    <strong>Teléfono:</strong>
                    <div>{user.phone || "No proporcionado"}</div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="mb-2">
              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2 text-danger" />
                  <div>
                    <strong>Dirección:</strong>
                    <div>{user.address || "No proporcionada"}</div>
                  </div>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <FaIdBadge className="me-2 text-warning" />
                  <div>
                    <strong>Rol:</strong>
                    <div>{getRoleName(user.role_id)}</div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <FaUser className="me-2 text-info" />
                  <div>
                    <strong>Estado:</strong>
                    <div>{getEstadoName(user.estado)}</div>
                  </div>
                </div>
              </Col>

              <Col>
               <Button variant="warning" onClick={() => setMostrarModal(true)}>
    <FaKey className="me-2" />
    Cambiar Contraseña
  </Button>
              </Col>
            </Row>

            <hr />

            <div className="text-center mt-4 d-flex justify-content-center gap-3 flex-wrap">
              <Button variant="secondary" onClick={() => navigate("/")}>
                Regresar
              </Button>
              <Button variant="primary" onClick={() => navigate("/editarPerfil")}>
                Editar Perfil
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* MODAL CAMBIO DE CONTRASEÑA */}
      <ChangePasswordModal show={mostrarModal} onHide={() => setMostrarModal(false)} />
    </div>
  );
};

export default VerPerfil;
