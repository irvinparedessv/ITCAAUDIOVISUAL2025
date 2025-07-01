export type HorarioDisponible = {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[];
};

export type Encargado = {
  id: number;
  first_name: string;
  last_name: string;
};

export type Aula = {
  id: number;
  name: string;
  image_path?: string;
  count_images: number; // nuevo campo del backend
  has_images: boolean;
  available_times?: HorarioDisponible[];
  encargados: Encargado[];
};

export interface AulaFilters {
  search?: string;
  page?: number;
  perPage?: number;
}
export interface AvailableTime {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[];
}
