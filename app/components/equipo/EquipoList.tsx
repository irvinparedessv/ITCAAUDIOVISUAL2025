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
    <div className="table-responsive">
      <table className="table table-bordered table-hover align-middle">
        <thead className="table-light">
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
              <td>{equipo.nombre}</td>
              <td>{equipo.descripcion}</td>
              <td className={equipo.estado ? 'text-success' : 'text-danger'}>
                {equipo.estado ? 'Disponible' : 'No disponible'}
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
