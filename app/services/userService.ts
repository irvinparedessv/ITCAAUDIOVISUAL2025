import axios from "axios";
import { toast } from "react-toastify";
import type { User, UserUpdateDTO } from "~/types/user";

const API_URL = "http://localhost:8000/api/users";

// ✅ Reutilizable para todas las peticiones autenticadas
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Obtener todos los usuarios
export const getUsuarios = async (): Promise<User[]> => {
  try {
    const res = await axios.get(API_URL, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    throw error;
  }
};

// Obtener un usuario por ID
export const getUsuarioById = async (id: string): Promise<User> => {
  try {
    const res = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error(`Error al obtener el usuario con ID ${id}:`, error);
    throw error;
  }
};

// Crear un usuario
export const createUsuario = async (formData: FormData) => {
  try {
    const res = await axios.post(API_URL, formData, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    throw error;
  }
};

// Actualizar un usuario
export const updateUsuario = async (
  id: number,
  data: UserUpdateDTO
): Promise<any> => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Errores del backend:", error.response.data);
      toast.error("Error de validación: " + JSON.stringify(error.response.data.errors));
    }
    throw new Error("No se pudo actualizar el usuario");
  }
};

// Obtener perfil del usuario autenticado
export const getPerfil = async (): Promise<User> => {
  try {
    const res = await axios.get("http://localhost:8000/api/user/profile", getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    throw error;
  }
};

// Actualizar perfil del usuario autenticado
export const updateProfile = async (formData: FormData): Promise<any> => {
  try {
    const res = await axios.put("http://localhost:8000/api/user/profile", formData, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    throw error;
  }
};

// Eliminar un usuario
export const deleteUsuario = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error(`Error al eliminar el usuario con ID ${id}:`, error);
    throw error;
  }
};
