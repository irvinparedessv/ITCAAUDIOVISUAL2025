// src/components/reservas/EquipmentReservationForm.tsx
import React from "react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import FechaReservaInput from "./Fechas";
import HorarioReservaInputs from "./Schedule";
import PrestamistaSelect from "./Prestamista";
import TipoReservaSelect from "./Tipo";
import DocumentoEventoDropzone from "./Document";
import EquiposSelect from "./Equipos";
import UbicacionSelect from "./Ubication";
import FormActions from "./FormAction";
import { Role } from "~/types/roles";
import useReservationFormLogic from "./hooks/useReservationFormLogic";
import { useAuth } from "~/hooks/AuthContext";
import type { FormDataType } from "./types/FormDataType";
import Scene from "../renders/rooms/Scene";

export default function EquipmentReservationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    formData,
    setFormData,
    handleSubmit,
    handleClear,
    getMinDate,
    getMaxDate,
    tipoReservaOptions,
    prestamistaOptions,
    selectedPrestamista,
    setSelectedPrestamista,
    aulaOptions,
    availableEquipmentOptions,
    allEquipmentOptions,
    uploadedFile,
    setUploadedFile,
    getStartTimeOptions,
    loading,
    isDateTimeComplete,
    checkingAvailability,
  } = useReservationFormLogic();

  const handleBack = () => navigate("/reservations");

  return (
    <div className="form-container position-relative mb-3 mb-md-0">
      <div className="d-flex align-items-center gap-2 gap-md-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <h2 className="fw-bold m-0">Reserva de Equipos</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <FechaReservaInput
          formData={formData}
          setFormData={setFormData}
          getMinDate={getMinDate}
          getMaxDate={getMaxDate}
        />
        <HorarioReservaInputs
          formData={formData}
          setFormData={setFormData}
          getStartTimeOptions={getStartTimeOptions}
        />
        {(user?.role === Role.Administrador ||
          user?.role === Role.Encargado) && (
          <PrestamistaSelect
            isDateTimeComplete={isDateTimeComplete}
            selectedPrestamista={selectedPrestamista}
            setSelectedPrestamista={setSelectedPrestamista}
            prestamistaOptions={prestamistaOptions}
          />
        )}
        <TipoReservaSelect
          formData={formData}
          setFormData={setFormData}
          tipoReservaOptions={tipoReservaOptions}
          loading={loading.tipoReserva}
          isDateTimeComplete={isDateTimeComplete}
        />
        <DocumentoEventoDropzone
          tipoReservaLabel={formData.tipoReserva?.label}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
        />
        <UbicacionSelect
          formData={formData}
          setFormData={setFormData}
          aulaOptions={aulaOptions}
          loadingAulas={loading.aulas}
          isDateTimeComplete={isDateTimeComplete}
        />
        {formData.aula && (
          <EquiposSelect
            formData={formData}
            setFormData={setFormData}
            checkingAvailability={checkingAvailability}
            isDateTimeComplete={isDateTimeComplete}
          />
        )}
        <FormActions
          handleClear={handleClear}
          loadingSubmit={loading.submit}
          isDateTimeComplete={isDateTimeComplete}
          checkingAvailability={checkingAvailability}
          tipoReserva={formData.tipoReserva}
          selectedEquipos={formData.equipment}
          selectedAula={formData.aula}
        />
      </form>
    </div>
  );
}
