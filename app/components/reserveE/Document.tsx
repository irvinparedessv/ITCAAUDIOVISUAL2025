// src/components/reservas/DocumentoEventoDropzone.tsx
import React from "react";
import { FaSave, FaTrash, FaUpload } from "react-icons/fa";
import { useDropzone } from "react-dropzone";

export default function DocumentoEventoDropzone({
  tipoReservaLabel,
  uploadedFile,
  setUploadedFile,
}: any) {
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert("Solo se permiten archivos PDF o Word");
      return;
    }

    if (file.size > maxSize) {
      alert("El archivo no puede ser mayor a 5MB");
      return;
    }

    setUploadedFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    multiple: false,
  });

  if (tipoReservaLabel !== "Eventos") return null;

  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center">
        <FaSave className="me-2" /> Documento del Evento (PDF o Word)
      </label>

      {uploadedFile ? (
        <div className="mt-2">
          <div className="d-flex align-items-center justify-content-between p-3 rounded border">
            <div>
              <strong>Archivo seleccionado:</strong> {uploadedFile.name}
            </div>
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="btn btn-outline-danger btn-sm"
            >
              <FaTrash className="me-1" /> Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border rounded p-4 text-center cursor-pointer ${
            isDragActive ? "border-primary bg-light" : "border-secondary-subtle"
          }`}
        >
          <input {...getInputProps()} />
          <div className="d-flex flex-column align-items-center justify-content-center">
            <FaUpload className="text-muted mb-2" size={24} />
            {isDragActive ? (
              <p className="text-primary mb-0">Suelta el documento aquí...</p>
            ) : (
              <>
                <p className="mb-1">
                  Arrastra y suelta un documento aquí, o haz clic para
                  seleccionar
                </p>
                <p className="text-muted small mb-0">
                  Formatos: PDF, DOC, DOCX (Máx. 5MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
