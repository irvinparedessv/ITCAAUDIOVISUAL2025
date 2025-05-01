import { useEffect, useState } from 'react'
import { deleteTipoEquipo, getTipoEquipos } from '~/services/tipoEquipoService'
import type { TipoEquipo } from '~/types/tipoEquipo'
import TipoEquipoList from '../components/tipoEquipo/TipoEquipoList'
import { Toaster } from 'react-hot-toast'

export default function TipoEquiposPage() {
  const [tipos, setTipos] = useState<TipoEquipo[]>([])
  const [tipoEditado, setTipoEditado] = useState<TipoEquipo | undefined>()

  const cargarTipos = async () => {
    const data = await getTipoEquipos()
    setTipos(data)
    setTipoEditado(undefined)
  }

  useEffect(() => {
    cargarTipos()
  }, [])

  return (
    <>
      <Toaster position="top-right" />
        <TipoEquipoList
          tipos={tipos}
          tipoEditado={tipoEditado}
          onEdit={(tipo) => setTipoEditado(tipo)}
          onDelete={async (id) => {
            await deleteTipoEquipo(id)
            cargarTipos()
          }}
          onSuccess={cargarTipos}
        />
    </>
    
  )
}
