import type { TipoEquipo } from '~/types/tipoEquipo'
import TipoEquipoForm from './TipoEquipoForm'
import toast from 'react-hot-toast'

interface Props {
  tipos: TipoEquipo[]
  tipoEditado: TipoEquipo | undefined
  onEdit: (tipo: TipoEquipo) => void
  onDelete: (id: number) => void
  onSuccess: () => void
}

export default function TipoEquipoList({
  tipos,
  tipoEditado,
  onEdit,
  onDelete,
  onSuccess,
}: Props) {
  const confirmarEliminacion = (id: number) => {
    toast((t) => (
      <div>
        <p className="mb-2">¿Seguro que deseas eliminar este tipo de equipo?</p>
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              onDelete(id)
              toast.dismiss(t.id)
              toast.success('Tipo de equipo eliminado')
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
    ), {
      duration: 5000,
    })
  }

  return (
    <div className="container py-5">
      <h1 className="text-center text-dark mb-4">Tipos de Equipo</h1>

      <div className="card shadow-sm" style={{ backgroundColor: '#800000' }}>
        <div className="card-body">
          <TipoEquipoForm tipoEditado={tipoEditado} onSuccess={onSuccess} />
        </div>
      </div>

      <div className="card shadow-sm mt-4" style={{ backgroundColor: '#800000' }}>
        <div className="card-body">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th className="text-dark">Nombre</th>
                <th className="text-dark">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td>{tipo.nombre}</td>
                  <td>
                    <button
                      className="btn btn-success me-2"
                      onClick={() => onEdit(tipo)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => confirmarEliminacion(tipo.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {tipos.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center text-muted">
                    No hay tipos de equipo registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
