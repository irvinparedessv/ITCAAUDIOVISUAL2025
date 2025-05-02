import axios from 'axios';
import { toast } from 'react-toastify';
import type { User, UserCreateDTO, UserUpdateDTO } from '~/types/user';

const API_URL = 'http://localhost:8000/api/users';

// Obtener todos los usuarios
export const getUsuarios = async (): Promise<User[]> => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    throw error;
  }
};

// Crear un usuario con soporte para FormData (para subir imagen)
export const createUsuario = async (formData: FormData) => {
  try {
    const res = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    toast.error("Hubo un error al crear el usuario.");  // Notificar al usuario
    throw error;
  }
};

// Actualizar un usuario
export const updateUsuario = async (id: number, usuario: UserUpdateDTO) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, usuario);
    return res.data;
  } catch (error) {
    console.error(`Error al actualizar el usuario con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un usuario
export const deleteUsuario = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error al eliminar el usuario con ID ${id}:`, error);
    throw error;
  }
};
