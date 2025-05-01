import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import type { Equipo, EquipoCreateDTO } from '~/types/equipo'
import type { TipoEquipo } from '~/types/tipoEquipo'
import { getTipoEquipos } from '~/services/tipoEquipoService'
import { FaSave, FaTimes, FaPlus, FaBroom } from 'react-icons/fa'

interface Props {
  onSubmit: (data: EquipoCreateDTO, isEdit?: boolean, id?: number) => void
  equipoEditando?: Equipo | null
  resetEdit: () => void
  onCancel?: () => void
}

export default function EquipoForm({ onSubmit, equipoEditando, resetEdit, onCancel }: Props) {
  const [form, setForm] = useState<EquipoCreateDTO>({
    nombre: '',
    descripcion: '',
    estado: true,
    cantidad: 0,
    tipo_equipo_id: 0,
  })

  const [tipos, setTipos] = useState<TipoEquipo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTipos = async () => {
      try {
        const data = await getTipoEquipos()
        setTipos(data)
      } catch (err) {
        console.error('Error cargando tipos de equipo:', err)
        toast.error('Error al cargar tipos de equipo')
      } finally {
        setLoading(false)
      }
    }

    loadTipos()
  }, [])

  useEffect(() => {
    if (equipoEditando) {
      setForm({
        nombre: equipoEditando.nombre,
        descripcion: equipoEditando.descripcion,
        estado: equipoEditando.estado,
        cantidad: equipoEditando.cantidad,
        tipo_equipo_id: equipoEditando.tipo_equipo_id,
      })
    } else {
      handleClear()
    }
  }, [equipoEditando])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (!form.descripcion.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }

    if (form.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a cero')
      return
    }

    if (!form.tipo_equipo_id) {
      toast.error('Debe seleccionar un tipo de equipo')
      return
    }

    if (equipoEditando) {
      // Mostrar toast de confirmación para editar
      toast.custom((t) => (
        <div className="bg-white p-4 rounded shadow-md w-[300px]">
          <p className="mb-3">¿Deseas actualizar este equipo?</p>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={() => {
                onSubmit(form, true, equipoEditando.id)
                toast.success('Equipo actualizado correctamente')
                handleClear()
                toast.dismiss(t.id)
              }}
            >
              Sí
            </button>
            <button
              className="px-3 py-1 bg-gray-300 rounded"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        </div>
      ))
    } else {
      // Crear nuevo equipo
      onSubmit(form, false)
      toast.success('Equipo creado exitosamente')
      handleClear()
    }
  }

  const handleClear = () => {
    setForm({
      nombre: '',
      descripcion: '',
      estado: true,
      cantidad: 0,
      tipo_equipo_id: 0,
    })
    resetEdit()
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    handleClear()
  }

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        {equipoEditando ? 'Editar Equipo' : 'Agregar Nuevo Equipo'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nombre" className="form-label">Nombre</label>
          <input
            id="nombre"
            placeholder="Nombre del equipo"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            className="form-control"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="descripcion" className="form-label">Descripción</label>
          <textarea
            id="descripcion"
            placeholder="Descripción del equipo"
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            className="form-control"
            rows={3}
          />
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="estado" className="form-label">Estado</label>
            <select
              id="estado"
              value={form.estado ? '1' : '0'}
              onChange={e => setForm({ ...form, estado: e.target.value === '1' })}
              className="form-select"
            >
              <option value="1">Disponible</option>
              <option value="0">No disponible</option>
            </select>
          </div>

          <div className="col-md-6">
            <label htmlFor="cantidad" className="form-label">Cantidad</label>
            <input
              id="cantidad"
              type="number"
              min="1"
              placeholder="0"
              value={form.cantidad || ''}
              onChange={e => setForm({ ...form, cantidad: Number(e.target.value) || 0 })}
              className="form-control"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="tipo_equipo" className="form-label">Tipo de equipo</label>
          <select
            id="tipo_equipo"
            value={form.tipo_equipo_id || ''}
            onChange={e => setForm({ ...form, tipo_equipo_id: Number(e.target.value) })}
            className="form-select"
            disabled={loading}
          >
            <option value="">{loading ? 'Cargando tipos...' : 'Seleccione un tipo'}</option>
            {tipos.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          {equipoEditando ? (
            <>
              <button type="submit" className="btn primary-btn">
                <FaSave className="me-2" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleCancel}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="btn primary-btn">
                <FaPlus className="me-2" />
                Crear
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleClear}
              >
                <FaBroom className="me-2" />
                Limpiar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
