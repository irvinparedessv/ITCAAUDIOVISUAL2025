import { useState, useEffect } from 'react'
import { createTipoEquipo, updateTipoEquipo } from '~/services/tipoEquipoService'
import type { TipoEquipo } from '~/types/tipoEquipo'
import toast from 'react-hot-toast'
import { FaSave, FaTimes, FaPlus, FaBroom } from 'react-icons/fa'

interface Props {
  tipoEditado?: TipoEquipo
  onSuccess: () => void
  onCancel?: () => void
}

export default function TipoEquipoForm({ tipoEditado, onSuccess, onCancel }: Props) {
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (tipoEditado) {
      setNombre(tipoEditado.nombre)
    } else {
      setNombre('')
    }
  }, [tipoEditado])

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre del tipo de equipo es obligatorio')
      return
    }

    try {
      if (tipoEditado) {
        await updateTipoEquipo(tipoEditado.id, { nombre })
        toast.success('Tipo de equipo actualizado correctamente')
      } else {
        await createTipoEquipo({ nombre })
        toast.success('Tipo de equipo creado exitosamente')
      }

      setNombre('')
      onSuccess()
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al guardar el tipo de equipo')
    }
  }

  const handleClear = () => {
    setNombre('')
    if (onCancel) onCancel()
  }

  const handleUpdateWithConfirmation = () => {
    toast((t) => (
      <div>
        <p>¿Estás seguro que deseas actualizar este registro?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={async () => {
              toast.dismiss(t.id)
              await handleSubmit()
            }}
          >
            Sí, actualizar
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
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        {tipoEditado ? 'Editar Tipo de Equipo' : 'Agregar Nuevo Tipo de Equipo'}
      </h2>

      <form>
        <div className="mb-4">
          <label htmlFor="nombre" className="form-label">Nombre del tipo de equipo</label>
          <input
            id="nombre"
            type="text"
            className="form-control"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Laptop, Proyector..."
          />
        </div>

        <div className="form-actions">
          {tipoEditado ? (
            <>
              <button 
                type="button" 
                className="btn primary-btn"
                onClick={handleUpdateWithConfirmation}
              >
                <FaSave className="me-2" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleClear}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="btn primary-btn"
                onClick={handleSubmit}
              >
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
