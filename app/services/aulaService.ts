import api from "../api/axios";
import type { AulaFilters } from "app/types/aula";

export const getAulas = async (filters: AulaFilters) => {
  const response = await api.get("/Getaulas", { params: filters });
  console.log(response);
  return response.data;
};

export const deleteAula = async (id: number) => {
  await api.delete(`/aulas/${id}`);
};
