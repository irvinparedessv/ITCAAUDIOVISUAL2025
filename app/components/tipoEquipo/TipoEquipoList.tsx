import type { TipoEquipo } from "app/types/tipoEquipo";
import TipoEquipoForm from "./TipoEquipoForm";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useState } from "react";

interface Props {
  tipos: TipoEquipo[];
  onEdit: (tipo: TipoEquipo) => void;
  onDelete: (id: number) => void;
  onSuccess: () => void;
}

export default function TipoEquipoList({
  tipos,
  onEdit,
  onDelete,
  onSuccess,
}: Props) {
  const [tipoEditado, setTipoEditado] = useState<TipoEquipo | undefined>(
    undefined
  );

  const handleEdit = (tipo: TipoEquipo) => {
    setTipoEditado(tipo);
    onEdit(tipo);
  };

  const handleCancel = () => {
    setTipoEditado(undefined);
  };

  const confirmarEliminacion = (id: number) => {
    toast(
      (t) => (
        <div>
          <p>¿Seguro que deseas eliminar este tipo de equipo?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                onDelete(id);
                toast.dismiss(t.id);
                toast.success("Tipo de equipo eliminado");
              }}
            >
              Sí, eliminar
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
        duration: 5000,
      }
    );
  };

  return (
    <div className="container py-5">
      <TipoEquipoForm
        tipoEditado={tipoEditado}
        onSuccess={() => {
          setTipoEditado(undefined);
          onSuccess();
        }}
        onCancel={handleCancel}
      />

      <div className="table-responsive rounded shadow p-3 mt-4">
        <h4 className="mb-3 text-center">Listado de Tipos de Equipo</h4>
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
            {tipos.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center text-muted">
                  No hay tipos de equipo registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
