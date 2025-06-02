import { useEffect, useState } from 'react'
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '~/services/equipoService'
import { getTipoEquipos } from '~/services/tipoEquipoService'
import type { Equipo, EquipoCreateDTO } from '~/types/equipo'
import type { TipoEquipo } from '~/types/tipoEquipo'
import EquipoForm from '../components/equipo/EquipoForm'
import EquipoList from '../components/equipo/EquipoList'
import { Toaster } from 'react-hot-toast'




export default function EquipoPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [tipos, setTipos] = useState<TipoEquipo[]>([])
  const [editando, setEditando] = useState<Equipo | null>(null)


  const cargarDatos = async () => {
    try {
      const [equiposData, tiposData] = await Promise.all([getEquipos(), getTipoEquipos()])
      // Filtrar los eliminados lógicamente
      setEquipos(equiposData.data.filter(eq => !eq.is_deleted))
      setTipos(tiposData)
    } catch (error) {
      console.error('Error al cargar los datos:', error)
    }
  }


  useEffect(() => {
    cargarDatos()
  }, [])


  const handleCreateOrUpdate = async (data: EquipoCreateDTO, isEdit?: boolean, id?: number) => {
    try {
      if (isEdit && id) {
        await updateEquipo(id, data)
      } else {
        await createEquipo(data)
      }
      cargarDatos()
    } catch (error) {
      console.error('Error al guardar el equipo:', error)
    }
  }


  const handleDelete = async (id: number) => {
    try {
       // Llamada a la función deleteEquipo para eliminar el equipo
       await deleteEquipo(id);
       // Si se elimina correctamente, actualiza la lista de equipos
       setEquipos(prevEquipos => prevEquipos.filter(equipo => equipo.id !== id));
     
    } catch (error) {
      console.error('Error al eliminar el equipo:', error)
    }
  }


  const handleEdit = (equipo: Equipo) => setEditando(equipo)


  const resetEdit = () => setEditando(null)


  return (
    <>
        <Toaster position="top-right" />
        <div className="max-w-3xl mx-auto mt-8 px-4">
          <h1 className="text-2xl font-bold mb-4">Gestión de Equipos</h1>
          <EquipoForm onSubmit={handleCreateOrUpdate} equipoEditando={editando} resetEdit={resetEdit} />
        {/* <EquipoList equipos={equipos} tipos={tipos} onEdit={handleEdit} onDelete={handleDelete} /> */}
        </div>


    </>
  )
}
