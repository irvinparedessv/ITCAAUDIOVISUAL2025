import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getUsuarios,
  deleteUsuario,
  forgotPassword,
} from "../../services/userService";
import type { User } from "app/types/user";
import {
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaKey,
  FaSearch,
  FaFilter,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";

const rolesMap: Record<number, string> = {
  1: "Administrador",
  2: "Encargado",
  3: "Prestamista",
};

export default function UsuarioList() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filters, setFilters] = useState<any>({
    search: "",
    page: 1,
    per_page: 10,
    role_id: undefined,
    estado: undefined,
  });
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigate("/");
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await getUsuarios(filters);
      setUsuarios(response?.data || []);
      setLastPage(response?.last_page || 1);
    } catch (error) {
      toast.error("Error al cargar usuarios");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [filters]);

  const handleResetPassword = async (userId: number, email: string) => {
  // Cerramos cualquier toast de confirmación previo para este usuario
  toast.dismiss(`reset-toast-${userId}`);

  toast(
    (t) => (
      <div>
        <p>¿Estás seguro que deseas restablecer la contraseña de {email}?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={async () => {
              toast.dismiss(t.id); // Cerramos el toast de confirmación
              toast.loading("Enviando enlace...", { id: `loading-reset-${userId}` });

              try {
                await forgotPassword(email);
                toast.success(`Enlace enviado a ${email}`, { id: `loading-reset-${userId}` });
              } catch {
                toast.error("Error al enviar el enlace", { id: `loading-reset-${userId}` });
              }
            }}
          >
            Sí, restablecer
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000,
      id: `reset-toast-${userId}` // ID único por usuario
    }
  );
};


  const confirmarEliminacion = (id: number) => {
  // Cerramos cualquier toast existente con el mismo ID
  toast.dismiss(`delete-toast-${id}`);

  toast(
    (t) => (
      <div>
        <p>¿Deseas desactivar este usuario?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              try {
                await deleteUsuario(id);
                toast.success("Usuario desactivado");
                cargarUsuarios();
              } catch {
                toast.error("Error al desactivar usuario");
              }
              toast.dismiss(t.id);
            }}
          >
            Sí, desactivar
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    {
      duration: 8000,
      id: `delete-toast-${id}`, // ID único para el toast
    }
  );
};


  const handleFilterUpdate = (key: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({
      ...prev,
      page: page,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      page: 1,
      per_page: 5,
      role_id: undefined,
      estado: undefined,
    });
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: 'pointer',
              fontSize: '2rem',
            }}
          />
          <h2 className="fw-bold m-0">Listado de Usuarios</h2>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate("/formUsuario")}
          className="d-flex align-items-center gap-2"
          style={{ 
            transition: "transform 0.2s ease-in-out"
          }}
          onMouseEnter={(e) => 
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseLeave={(e) => 
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          <FaPlus /> Crear Usuario
        </Button>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="flex-grow-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre o correo"
              value={filters.search}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
            {filters.search && (
              <Button
                variant="outline-secondary"
                onClick={() => handleFilterUpdate("search", "")}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>

        <Button
          variant="outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center gap-2"
          style={{ 
            transition: "transform 0.2s ease-in-out"
          }}
          onMouseEnter={(e) => 
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseLeave={(e) => 
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          <FaFilter />
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
      </div>

      {showFilters && (
        <div className="border p-3 rounded mb-3">
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={filters.role_id || ""}
                onChange={(e) =>
                  handleFilterUpdate("role_id", e.target.value || undefined)
                }
              >
                <option value="">Todos</option>
                {Object.entries(rolesMap).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-6">
  <Form.Label>Estado</Form.Label>
  <Form.Select
    value={
      filters.estado === undefined
        ? ""
        : filters.estado === 1
        ? "1"
        : "0"
    }
    onChange={(e) =>
      handleFilterUpdate(
        "estado",
        e.target.value === "" ? undefined : Number(e.target.value)
      )
    }
  >
    <option value="">Todos</option>
    <option value="1">Activo</option>
    <option value="0">Inactivo</option>
  </Form.Select>
</div>


            <div className="col-12">
              <Button
                variant="outline-danger"
                onClick={resetFilters}
                className="w-100"
                style={{ 
                  transition: "transform 0.2s ease-in-out"
                }}
                onMouseEnter={(e) => 
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseLeave={(e) => 
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <FaTimes className="me-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.image_url ? (
                          <img
                            src={user.image_url}
                            alt={user.email}
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          <FaUserCircle size={50} className="text-secondary" />
                        )}
                      </td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || "-"}</td>
                      <td>{rolesMap[user.role_id] || "Desconocido"}</td>
                      <td>
                        <span
                          className={`badge ${user.estado === 1
                            ? "bg-success"
                            : user.estado === 0
                              ? "bg-danger"
                              : "bg-warning text-dark"
                            }`}
                        >
                          {user.estado === 1
                            ? "Activo"
                            : user.estado === 0
                              ? "Inactivo"
                              : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Editar usuario"
                            onClick={() => navigate(`/editarUsuario/${user.id}`)}
                            style={{ 
                              width: "44px", 
                              height: "44px",
                              transition: "transform 0.2s ease-in-out"
                            }}
                            onMouseEnter={(e) => 
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) => 
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-warning"
                            className="rounded-circle"
                            title="Restablecer contraseña"
                            onClick={() => handleResetPassword(user.id, user.email)}
                            style={{ 
                              width: "44px", 
                              height: "44px",
                              transition: "transform 0.2s ease-in-out"
                            }}
                            onMouseEnter={(e) => 
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) => 
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <FaKey />
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title="Eliminar usuario"
                            onClick={() => confirmarEliminacion(user.id)}
                            style={{ 
                              width: "44px", 
                              height: "44px",
                              transition: "transform 0.2s ease-in-out"
                            }}
                            onMouseEnter={(e) => 
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) => 
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationComponent
            page={filters.page || 1}
            totalPages={lastPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}