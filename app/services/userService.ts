import axios from "axios";
import { toast } from "react-toastify";
import type { User, UserUpdateDTO } from "~/types/user";
import api from "../api/axios";
//const API_URL = 'http://localhost:8000/api/users';

// Obtener todos los usuarios con paginación y filtros opcionales
interface UsuarioQueryParams {
  page?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: number;
  estado?: number;
  phone?: string;
}

// Obtener todos los usuarios
export const getUsuarios = async (params: UsuarioQueryParams = {}) => {
  try {
    const res = await api.get("/users", { params });
    return {
      data: res.data.data,
      current_page: res.data.current_page,
      last_page: res.data.last_page,
      total: res.data.total,
    };
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

// Crear un usuario
export const createUsuario = async (formData: FormData) => {
  try {
    const res = await api.post("/users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error del backend:", error.response.data);
      toast.error(error.response.data.message || "Error al crear el usuario");
    } else {
      console.error("Error desconocido:", error);
      toast.error("Error inesperado");
    }
    throw error;
  }
};

// Actualizar un usuario
export const updateUsuario = async (
  id: number,
  data: UserUpdateDTO
): Promise<any> => {
  try {
    // Enviamos los datos como JSON sin FormData
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Errores del backend:", error.response.data);
      // Mostramos los errores del backend, si los hay
      toast.error(
        "Error de validación: " + JSON.stringify(error.response.data.errors)
      );
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
  return api.post("/forgot-password", { email });
};

export const resetPassword = async (data: ResetPasswordData) => {
  return api.post("/reset-password", data);
};

export const changePassword = async (data: {
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  return api.post("/change-password", data);
};

export const getPerfil = async (): Promise<User> => {
  try {
    const res = await api.get("/user/profile"); // ❌ Elimina el `data`
    return res.data.user; // ⚠️ Asegúrate de acceder a `user` si es `{ user: {...} }`
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    throw error;
  }
};

// Actualizar perfil del usuario autenticado
export const updateProfile = async (formData: FormData): Promise<any> => {
  try {
    const res = await api.put("/user/profile", formData);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    throw error;
  }
};
