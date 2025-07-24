export interface EquipoResumen {
  modelo_id: number;
  nombre_modelo: string;
  cantidad_total: number;
  cantidad_disponible: number;
  cantidad_eliminada: number;
  equipos_id_disponibles: string; // CSV: "1,2,3"
  series_disponibles: string; // CSV: "ABC123,SN5678"
  cantidad_enreserva: number;
  cantidad: number;
}
export interface EquipmentSeleccionado {
  modelo_id: number;
  nombre_modelo: string;
  id: number; // <- id del equipo real
  cantidad: number; // siempre 1 por cada item
  modelo_path: string;
  numero_serie: string | undefined;
}
