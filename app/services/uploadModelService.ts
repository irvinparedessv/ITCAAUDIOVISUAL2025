// src/services/uploadModel.ts
import api from "../api/axios";

export const uploadModel = async (blob: Blob, filename: string) => {
  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await api.post("/upload-model", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
