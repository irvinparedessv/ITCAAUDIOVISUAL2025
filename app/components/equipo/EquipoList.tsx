import type { Equipo } from '~/types/equipo'
import type { TipoEquipo } from '~/types/tipoEquipo'
import toast from 'react-hot-toast'

interface Props {
  equipos: Equipo[]
  tipos: TipoEquipo[]
  onEdit: (equipo: Equipo) => void
  onDelete: (id: number) => void
}

export default function EquipoList({ equipos, tipos, onEdit, onDelete }: Props) {
  const getTipoNombre = (id: number) => {
    const tipo = tipos.find(t => t.id === id)
    return tipo ? tipo.nombre : 'Desconocido'
  }

  const confirmarEliminacion = (id: number) => {
    toast((t) => (
      <div>
        <p>¿Seguro que deseas eliminar este equipo?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              onDelete(id)
              toast.dismiss(t.id)
              toast.success('Equipo eliminado')
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
    <div className="table-responsive rounded shadow p-3 bg-white mt-4">
      <h4 className="mb-3 text-center">Listado de Equipos</h4>
      <table className="table table-hover align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map(equipo => (
            <tr key={equipo.id}>
              <td className="fw-bold">{equipo.nombre}</td>
              <td>{equipo.descripcion}</td>
              <td>
                <span className={`badge ${equipo.estado ? 'bg-success' : 'bg-danger'}`}>
                  {equipo.estado ? 'Disponible' : 'No disponible'}
                </span>
              </td>
              <td>{equipo.cantidad}</td>
              <td><em>{getTipoNombre(equipo.tipo_equipo_id)}</em></td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(equipo)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => confirmarEliminacion(equipo.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
