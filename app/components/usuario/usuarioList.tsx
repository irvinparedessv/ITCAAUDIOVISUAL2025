import React, { useEffect, useState } from "react";
import { Badge, Pagination } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { getUsuarios, deleteUsuario } from "~/services/userService";
import type { User } from "~/types/user";
import { FaUserCircle, FaEdit, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const rolesMap: Record<number, string> = {
  1: "Administrador",
  2: "Encargado",
  3: "Prestamista",
};

const UsuarioList = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPorPagina = 5;

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id: number) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas desactivar a este usuario? Esta acción es irreversible."
    );

    if (confirmDelete) {
      try {
        await deleteUsuario(id);
        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((u) => (u.id === id ? { ...u, estado: 0 } : u))
        );
        toast.success("Usuario desactivado correctamente");
      } catch (error) {
        toast.error("Error al desactivar el usuario");
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      toast("Acción cancelada por el usuario");
    }
  };

  const indexUltimo = currentPage * usuariosPorPagina;
  const indexPrimero = indexUltimo - usuariosPorPagina;
  const usuariosActuales = usuarios.slice(indexPrimero, indexUltimo);

  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);

  const items: React.ReactNode[] = [];
  for (let number = 1; number <= totalPaginas; number++) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => setCurrentPage(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <h4 className="mb-3 text-center">Listado de Usuarios</h4>

      {/* BOTÓN DE CREAR USUARIO */}
      <div className="d-flex justify-content-end mb-3 ">
        <Link
          to="/formUsuario"
          className="btn btn-primary"
          style={{
            transition: "transform 0.2s ease-in-out",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Crear Usuario
        </Link>
      </div>

      {loading ? (
        <p className="text-center">Cargando usuarios...</p>
      ) : (
        <>
          <table
            className="table table-hover align-middle text-center overflow-hidden"
            style={{ borderRadius: "0.8rem" }}
          >
            <thead className="table-dark">
              <tr>
                <th className="rounded-top-start">Imagen</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="rounded-top-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosActuales.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    {usuario.image ? (
                      <img
                        src={`http://localhost:8000/storage/${usuario.image}`}
                        alt={usuario.first_name}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      <FaUserCircle size={40} className="text-secondary" />
                    )}
                  </td>
                  <td className="fw-bold">
                    {usuario.first_name} {usuario.last_name}
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.phone || "N/A"}</td>
                  <td>{usuario.address || "N/A"}</td>
                  <td>
                    <em>{rolesMap[usuario.role_id] || "Desconocido"}</em>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        usuario.estado === 1
                          ? "bg-success"
                          : usuario.estado === 0
                          ? "bg-danger"
                          : "bg-warning"
                      }`}
                    >
                      {usuario.estado === 1
                        ? "Activo"
                        : usuario.estado === 0
                        ? "Inactivo"
                        : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <Link
                        to={`/editarUsuario/${usuario.id}`}
                        className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                        title="Editar usuario"
                        style={{
                          width: "44px",
                          height: "44px",
                          transition: "transform 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.15)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        <FaEdit className="fs-5" />
                      </Link>
                      <button
                        className="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                        title="Desactivar usuario"
                        onClick={() => eliminarUsuario(usuario.id)}
                        style={{
                          width: "44px",
                          height: "44px",
                          transition: "transform 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.15)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        <FaTrash className="fs-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPaginas > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination className="mt-3">{items}</Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsuarioList;
