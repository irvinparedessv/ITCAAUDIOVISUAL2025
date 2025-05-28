
import api from '~/api/axios';
import type { TipoReserva } from '~/types/tipoReserva';

/**
 * Obtener todos los tipos de reserva (no eliminados).
 */
export const getTipoReservas = async (): Promise<TipoReserva[]> => {
  const response = await api.get<TipoReserva[]>('/tipo-reservas');
  return response.data;
};
