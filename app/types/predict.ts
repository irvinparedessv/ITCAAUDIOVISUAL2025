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
