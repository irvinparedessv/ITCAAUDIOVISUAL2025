import axios from 'axios'
import type { TipoEquipo } from '~/types/tipoEquipo'


const API_URL = 'http://localhost:8000/api/tipoEquipos'

export const getTipoEquipos = async (): Promise<TipoEquipo[]> => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error) {
    console.error("Error al obtener los tipos de equipo:", error);
    throw error;
  }
};

export const createTipoEquipo = async (tipoEquipo: Omit<TipoEquipo, 'id'>) => {
  try {
    const res = await axios.post(API_URL, tipoEquipo);
    return res.data;
  } catch (error) {
    console.error("Error al crear el tipo de equipo:", error);
    throw error;
  }
};

export const updateTipoEquipo = async (id: number, tipoEquipo: Partial<TipoEquipo>) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, tipoEquipo);
    return res.data;
  } catch (error) {
    console.error(`Error al actualizar el tipo de equipo con ID ${id}:`, error);
    throw error;
  }
};

export const deleteTipoEquipo = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error al eliminar el tipo de equipo con ID ${id}:`, error);
    throw error;
  }
};
