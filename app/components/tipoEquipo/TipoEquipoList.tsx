import { useEffect, useState } from "react";
import { getTipoEquipo, getTipoEquipos } from "../../services/tipoEquipoService";
import type { TipoEquipo } from "app/types/tipoEquipo";
import TipoEquipoForm from "./TipoEquipoForm";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Button, Spinner } from "react-bootstrap";
import PaginationComponent from "~/utils/Pagination";

interface Props {
  onEdit: (tipo: TipoEquipo) => void;
  onDelete: (id: number) => void;
  onSuccess: () => void;
}

export default function TipoEquipoList({ onEdit, onDelete, onSuccess }: Props) {
  const [tipoEditado, setTipoEditado] = useState<TipoEquipo | undefined>();
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const cargarTipos = async () => {
    setIsLoading(true);
    try {
      const res = await getTipoEquipo(paginaActual);
      setTipos(res.data);
      setTotalPaginas(res.last_page);
    } catch (error) {
      console.error("Error al cargar tipos de equipo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, [paginaActual]);

  const handleEdit = (tipo: TipoEquipo) => {
    setTipoEditado(tipo);
    onEdit(tipo);
  };

  const handleCancel = () => {
    setTipoEditado(undefined);
  };

  const confirmarEliminacion = async (id: number) => {
    const tipoAEliminar = tipos.find((tipo) => tipo.id === id);
    if (!tipoAEliminar) return;

    const toastId = `eliminar-tipo-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Seguro que deseas eliminar el tipo de equipo{" "}
            <strong>{tipoAEliminar.nombre}</strong>?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await onDelete(id);
                toast.dismiss(t.id);
                toast.success(`Tipo de equipo ${tipoAEliminar.nombre} eliminado`, {
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                });
                cargarTipos();
              }}
              style={{ transition: "transform 0.2s ease-in-out" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              Sí, eliminar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.dismiss(t.id)}
              style={{ transition: "transform 0.2s ease-in-out" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              Cancelar
            </Button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        style: {
          background: "#363636",
          color: "#fff",
        },
        id: toastId,
      }
    );
  };

  return (
    <div className="container">
      <TipoEquipoForm
        tipoEditado={tipoEditado}
        onSuccess={() => {
          setTipoEditado(undefined);
          cargarTipos();
          onSuccess();
        }}
        onCancel={handleCancel}
      />

      <div className="table-responsive rounded shadow p-3 mt-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <h4 className="fw-bold m-0">Listado de Tipos de Equipo</h4>
        </div>
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) :
          tipos.length === 0 ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "50vh" }}
            >
              <p>No hay tipos de equipo registrados</p>
            </div>

          ) : (
            <>
              <table
                className="table table-hover align-middle text-center overflow-hidden"
                style={{ borderRadius: "0.8rem" }}
              >
                <thead className="table-dark">
                  <tr>
                    <th className="rounded-top-start">Nombre</th>
                    <th className="rounded-top-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo.id}>
                      <td className="fw-bold">{tipo.nombre}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                            title="Editar tipo de equipo"
                            onClick={() => handleEdit(tipo)}
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
                          </button>
                          <button
                            className="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                            title="Eliminar tipo de equipo"
                            onClick={() => confirmarEliminacion(tipo.id)}
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

              <PaginationComponent
                page={paginaActual}
                totalPages={totalPaginas}
                onPageChange={setPaginaActual}
              />
            </>)}
      </div>
    </div>
  );
}
