import { useState, useEffect } from 'react'
import { createTipoEquipo, updateTipoEquipo } from '~/services/tipoEquipoService'
import type { TipoEquipo } from '~/types/tipoEquipo'
import toast from 'react-hot-toast'

interface Props {
  tipoEditado?: TipoEquipo
  onSuccess: () => void
}

export default function TipoEquipoForm({ tipoEditado, onSuccess }: Props) {
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (tipoEditado) {
      setNombre(tipoEditado.nombre)
    }
  }, [tipoEditado])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación simple
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label text-white">Nombre del tipo de equipo</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ej. Laptop, Proyector..."
        />
      </div>
      <button type="submit" className={`btn ${tipoEditado ? 'btn-warning' : 'btn-success'}`}>
        {tipoEditado ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  )
}
