export type PrediccionData = {
  mes: string;
  cantidad: number;
  tipo: 'Histórico' | 'Predicción';
  mes_numero: number;
  detalle?: {
    regresion_lineal: number;
    svr: number;
  };
};


export type PrediccionVidaUtilRow = {
  mes: string;
  tipo: string;
  horas_usadas: number;
  horas_acumuladas: number;
  vida_util_restante: number;
  porcentaje_utilizado: number;
  regresion_lineal?: number;
  svr?: number;
  year?: number;
  month?: number;
  mes_nombre?: string;
  cantidad_reservas?: number;
  [key: string]: any; // Esto permite propiedades adicionales
};

export type EquipoInfo = {
  id: string;
  numero_serie: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  marca_modelo?: string;
  vida_util_total: number;
};

export type EquipoVidaUtilData = {
  equipo?: EquipoInfo;
  historico: PrediccionVidaUtilRow[];
  predicciones: PrediccionVidaUtilRow[];
  precision: number;
  meses_restantes: number;
  fecha_fin_vida_util: string;
};