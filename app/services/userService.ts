import axios from 'axios';
import { toast } from 'react-toastify';
import api from '~/api/axios';
import type { User, UserUpdateDTO } from '~/types/user';

//const API_URL = 'http://localhost:8000/api/users';

// Obtener todos los usuarios
export const getUsuarios = async (): Promise<User[]> => {
  try {
    const res = await api.get('/users');
    return res.data;
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    throw error;
  }
};

// Obtener un usuario por ID
export const getUsuarioById = async (id: string): Promise<User> => {
  try {
    const res = await api.get(`/users/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error al obtener el usuario con ID ${id}:`, error);
    throw error;
  }
};

// Crear un usuario (si necesitaras mantener soporte para imágenes, se podría dejar esta parte como está)
export const createUsuario = async (formData: FormData) => {
  try {
    const res = await api.post('/users', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    toast.error("Hubo un error al crear el usuario.");
    throw error;
  }
};

// Actualizar un usuario
export const updateUsuario = async (id: number, data: UserUpdateDTO): Promise<any> => {
  try {
    // Enviamos los datos como JSON sin FormData
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Errores del backend:", error.response.data);
      // Mostramos los errores del backend, si los hay
      toast.error("Error de validación: " + JSON.stringify(error.response.data.errors));
    }
    throw new Error("No se pudo actualizar el usuario");
  }  
};

// Eliminar un usuario
export const deleteUsuario = async (id: number) => {
  try {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error al eliminar el usuario con ID ${id}:`, error);
    throw error;
  }
};


interface ResetPasswordData {
  token: string | null;
  email: string | null;
  password: string;
  password_confirmation: string;
}

export const forgotPassword = async (email: string) => {
  return api.post('/forgot-password', { email });
};

export const resetPassword = async (data: ResetPasswordData) => {
  return api.post('/reset-password', data);
};

export const changePassword = async (data: {
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  return api.post('/change-password', data);
};
