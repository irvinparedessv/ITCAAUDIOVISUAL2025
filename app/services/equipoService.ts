import axios from 'axios'
import type { Equipo, EquipoCreateDTO, EquipoUpdateDTO } from '~/types/equipo'

const API_URL = 'http://localhost:8000/api/equipos'

export const getEquipos = async (): Promise<Equipo[]> => {
  try {
    const res = await axios.get(API_URL)
    return res.data
  } catch (error) {
    console.error("Error al obtener los equipos:", error)
    throw error
  }
}

export const createEquipo = async (equipo: EquipoCreateDTO) => {
  try {
    const res = await axios.post(API_URL, { ...equipo, is_deleted: false })
    return res.data
  } catch (error) {
    console.error("Error al crear el equipo:", error)
    throw error
  }
}

export const updateEquipo = async (id: number, equipo: EquipoUpdateDTO) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, equipo)
    return res.data
  } catch (error) {
    console.error(`Error al actualizar el equipo con ID ${id}:`, error)
    throw error
  }
}

export const deleteEquipo = async (id: number) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, { is_deleted: true })
    return res.data
  } catch (error) {
    console.error(`Error al eliminar lógicamente el equipo con ID ${id}:`, error)
    throw error
  }
}
