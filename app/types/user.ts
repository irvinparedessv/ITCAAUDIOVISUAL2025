export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number;
  phone?: string;
  address?: string;
  image: string | File; // sigue requerido aquí, porque lo usas en creación
  estado?: number; // puede ser 0, 1 o 3
  is_deleted: boolean;
}

export type UserLogin = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  image?: string;
  estado: number; // ahora obligatorio
};


// Para crear usuarios, incluyendo imagen opcional tipo archivo
export type UserCreateDTO = Omit<
  User,
  "id" | "is_deleted" | "estado" | "image"
> & {
  image?: File | null;
};

// Para actualizar usuarios, SIN imagen y SIN password obligatorio
export type UserUpdateDTO = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  role_id: number;
  estado?: number;
  password?: string;
};

// Para identificar el usuario a actualizar (id requerido)
export type UserWithId = UserUpdateDTO & { id: number };
