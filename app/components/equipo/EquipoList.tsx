import type { Equipo } from '~/types/equipo'
import type { TipoEquipo } from '~/types/tipoEquipo'
import toast from 'react-hot-toast'
import { FaEdit, FaTrash } from 'react-icons/fa'

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
    <div className="table-responsive rounded shadow p-3 mt-4">
      <h4 className="mb-3 text-center">Listado de Equipos</h4>
      <table
  className="table table-hover align-middle text-center overflow-hidden"
  style={{ borderRadius: '0.8rem' }}
>


      <thead className="table-dark">
  <tr>
    <th className="rounded-top-start">Nombre</th>
    <th>Descripción</th>
    <th>Estado</th>
    <th>Cantidad</th>
    <th>Tipo</th>
    <th className="rounded-top-end">Acciones</th>
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
                <div className="d-flex justify-content-center gap-2">
                  <button
                    className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                    title="Editar equipo"
                    onClick={() => onEdit(equipo)}
                    style={{
                      width: '44px',
                      height: '44px',
                      transition: 'transform 0.2s ease-in-out',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <FaEdit className="fs-5" />
                  </button>
                  <button
                    className="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                    title="Eliminar equipo"
                    onClick={() => confirmarEliminacion(equipo.id)}
                    style={{
                      width: '44px',
                      height: '44px',
                      transition: 'transform 0.2s ease-in-out',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <FaTrash className="fs-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
