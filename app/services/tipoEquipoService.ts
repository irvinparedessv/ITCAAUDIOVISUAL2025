import api from '~/api/axios';
import type { TipoEquipo } from '~/types/tipoEquipo'


//const API_URL = 'http://localhost:8000/api/tipoEquipos'

export const getTipoEquipos = async (): Promise<TipoEquipo[]> => {
  try {
    const res = await api.get('/tipoEquipos');
    return res.data;
  } catch (error) {
    console.error("Error al obtener los tipos de equipo:", error);
    throw error;
  }
};

export const createTipoEquipo = async (tipoEquipo: Omit<TipoEquipo, 'id'>) => {
  try {
    const res = await api.post('/tipoEquipos', tipoEquipo);
    return res.data;
  } catch (error) {
    console.error("Error al crear el tipo de equipo:", error);
    throw error;
  }
};

export const updateTipoEquipo = async (id: number, tipoEquipo: Partial<TipoEquipo>) => {
  try {
    const res = await api.put(`${'/tipoEquipos'}/${id}`, tipoEquipo);
    return res.data;
  } catch (error) {
    console.error(`Error al actualizar el tipo de equipo con ID ${id}:`, error);
    throw error;
  }
};

export const deleteTipoEquipo = async (id: number) => {
  try {
    const res = await api.delete(`${'/tipoEquipos'}/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error al eliminar el tipo de equipo con ID ${id}:`, error);
    throw error;
  }
};
