import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getUsuarios, deleteUsuario } from "~/services/userService";
import type { User } from "~/types/user";
import { FaUserCircle, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const rolesMap: Record<number, string> = {
  1: "Administrador",
  2: "Encargado",
  3: "Prestamista",
};

const UsuarioList = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    cargarUsuarios(currentPage);
  }, [currentPage]);

  const cargarUsuarios = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getUsuarios({ page });
      setUsuarios(response.data);
      setTotalPages(response.last_page);
      setCurrentPage(response.current_page);
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
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <h4 className="mb-3 text-center">Listado de Usuarios</h4>

      <div className="flex justify-between items-center mb-3">
        {/* Buscador */}
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <Link
          to="/formUsuario"
          className="ml-3 btn btn-primary"
          style={{ transition: "transform 0.2s ease-in-out" }}
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
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((usuario) => (
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
                ))
              )}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>

            <button className="btn btn-primary" disabled>
              {currentPage}
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UsuarioList;
