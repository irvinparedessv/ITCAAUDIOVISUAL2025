import type { Equipo } from '~/types/equipo'
import type { TipoEquipo } from '~/types/tipoEquipo'

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
                  onClick={() => onDelete(equipo.id)}
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
