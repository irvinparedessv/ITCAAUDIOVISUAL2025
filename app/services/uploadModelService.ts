// src/services/uploadModel.ts
import api from "../api/axios";

export const uploadModel = async (
  file: Blob,
  filename: string,
  reserveId: number
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file", file, filename);
  formData.append("reserveId", reserveId.toString());
  console.log("Uploading file:", { reserveId, filename, file });

  const response = await api.post(`/upload-model`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const getModelPathByReserveId = async (reserveId: number) => {
  const response = await api.get(`/get-model-path/${reserveId}`);
  return response.data.path; // Laravel devolverá { path: "models/archivo.glb" }
};
