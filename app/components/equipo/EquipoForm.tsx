import { useEffect, useState } from 'react'
import type { Equipo, EquipoCreateDTO } from '~/types/equipo'
import type { TipoEquipo } from '~/types/tipoEquipo'
import { getTipoEquipos } from '~/services/tipoEquipoService'

interface Props {
  onSubmit: (data: EquipoCreateDTO, isEdit?: boolean, id?: number) => void
  equipoEditando?: Equipo | null
  resetEdit: () => void
}

export default function EquipoForm({ onSubmit, equipoEditando, resetEdit }: Props) {
  const [form, setForm] = useState<EquipoCreateDTO>({
    nombre: '',
    descripcion: '',
    estado: true,
    cantidad: 0,
    tipo_equipo_id: 1,
  })

  const [tipos, setTipos] = useState<TipoEquipo[]>([])

  useEffect(() => {
    getTipoEquipos().then(setTipos).catch(err => {
      console.error('Error cargando tipos de equipo:', err)
    })
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
    }
  }, [equipoEditando])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form, !!equipoEditando, equipoEditando?.id)
    setForm({ nombre: '', descripcion: '', estado: true, cantidad: 0, tipo_equipo_id: 1 })
    resetEdit()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">Nombre</label>
        <input
          id="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={e => setForm({ ...form, nombre: e.target.value })}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="descripcion" className="form-label">Descripción</label>
        <input
          id="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
          className="form-control"
        />
      </div>

      <div className="mb-3">
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

      <div className="mb-3">
        <label htmlFor="cantidad" className="form-label">Cantidad</label>
        <input
          id="cantidad"
          type="number"
          placeholder="Cantidad"
          value={form.cantidad}
          onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="tipo_equipo" className="form-label">Tipo de equipo</label>
        <select
          id="tipo_equipo"
          value={form.tipo_equipo_id}
          onChange={e => setForm({ ...form, tipo_equipo_id: Number(e.target.value) })}
          className="form-select"
        >
          <option value="">Seleccione un tipo</option>
          {tipos.map(tipo => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary w-100">
        {equipoEditando ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  )
}
