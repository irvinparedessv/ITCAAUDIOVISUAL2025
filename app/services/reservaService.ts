import api from "../api/axios";

export const getBloquesPorMes = (mes, aulaId) => {
  return api.get(`/getreservasmonth`, {
    params: { mes, aula_id: aulaId },
  });
};

export const getAulasEncargado = () => {
  return api.get(`/aulas-encargados`);
};
