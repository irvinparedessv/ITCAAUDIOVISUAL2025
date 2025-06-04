export type HorarioDisponible = {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[];
};

export type Aula = {
  id: number;
  name: string;
  image_path?: string;
  available_times?: HorarioDisponible[];
};
