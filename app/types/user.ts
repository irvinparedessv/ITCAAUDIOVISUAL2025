export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role_id: number;
    phone?: string;
    address?: string;
    image?: string; // normalmente es la URL o nombre de archivo
    status: boolean; // campo estado (activo/inactivo)
    is_deleted: boolean;
  }

  export type UserCreateDTO = Omit<User, 'id' | 'is_deleted' | 'status' | 'image'> & {
    image?: File | null; // En creación, la imagen es un archivo
  };
  
  export type UserUpdateDTO = Partial<UserCreateDTO>; // Para actualizaciones opcionales
  
  