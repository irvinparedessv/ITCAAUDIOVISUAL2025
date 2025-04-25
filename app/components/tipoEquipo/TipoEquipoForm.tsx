import { useState, useEffect } from 'react'
import { createTipoEquipo, updateTipoEquipo } from '~/services/tipoEquipoServices'
import type { TipoEquipo } from '~/types/tipoEquipo'

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
    if (tipoEditado) {
      await updateTipoEquipo(tipoEditado.id, { nombre })
    } else {
      await createTipoEquipo({ nombre })
    }
    onSuccess()
    setNombre('')
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
          required
        />
      </div>
      <button type="submit" className={`btn ${tipoEditado ? 'btn-warning' : 'btn-success'}`}>
        {tipoEditado ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  )
}
