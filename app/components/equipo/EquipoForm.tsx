import { useEffect, useState, useRef } from 'react'
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
    imagen: null,
  })

  const [tipos, setTipos] = useState<TipoEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Referencia para el input de archivo
  const inputFileRef = useRef<HTMLInputElement | null>(null)

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
        imagen: null, // dejamos null para que no se sobrescriba hasta que el usuario suba una nueva
      })
      setImagePreview(equipoEditando.imagen_url || null) // Set imagen actual si está editando
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
      imagen: null
    })
    setImagePreview(null)
    resetEdit()

    // Limpiar el valor del input file
    if (inputFileRef.current) {
      inputFileRef.current.value = ''
    }
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    handleClear()
  }

  // Función para manejar el arrastre y soltar
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setForm({ ...form, imagen: file })
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Función para manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setForm({ ...form, imagen: file })
      setImagePreview(URL.createObjectURL(file))
    }
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

        {imagePreview && (
          <div className="mb-3">
            <label className="form-label">Imagen seleccionada:</label><br />
            <img
              src={imagePreview}
              alt="Vista previa"
              className="img-thumbnail"
              style={{ maxWidth: '200px' }}
            />
          </div>
        )}

        <div className="mb-4" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <label htmlFor="imagen" className="form-label">Imagen</label>
          <div className="border p-4 text-center" style={{ cursor: 'pointer' }}>
            {form.imagen ? (
              <p>Imagen seleccionada. Arrastra para cambiar.</p>
            ) : (
              <p>Arrastra y suelta una imagen aquí o haz clic para seleccionar</p>
            )}
            <input
              ref={inputFileRef}
              type="file"
              id="imagen"
              className="form-control"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              hidden
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
