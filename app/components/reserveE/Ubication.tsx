import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FaSchool } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "~/api/axios";
import { useAuth } from "~/hooks/AuthContext";
import type { OptionType } from "./types/Common";
import { Role } from "~/types/roles";
import type { FormDataType } from "./types/FormDataType";

type UserOption = OptionType & { value: number };

export default function UbicacionSelect({
  formData,
  setFormData,
  isDateTimeComplete,
  selectedPrestamista,
}: {
  formData: FormDataType;

  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  isDateTimeComplete: boolean;
  selectedPrestamista: UserOption;
}) {
  const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userid =
    user?.role === Role.Administrador || user?.role === Role.Encargado
      ? selectedPrestamista.value
      : user.id;
  useEffect(() => {
    const fetchUbicaciones = async () => {
      if (
        !formData.date ||
        !formData.startTime ||
        !formData.endTime ||
        !formData.tipoReserva ||
        !userid
      ) {
        return;
      }

      const fecha_inicio = `${formData.date} ${formData.startTime}`;
      const fecha_fin = `${formData.date} ${formData.endTime}`;

      setLoading(true);
      try {
        const response = await api.post("/aulas-disponibles", {
          fecha_inicio,
          fecha_fin,
          user_id: userid,
        });

        const data = response.data;
        setAulaOptions(
          data.map(
            (item: {
              id: number;
              name: string;
              path_modelo: string | null;
            }) => ({
              value: item.id,
              label: item.name,
              path_modelo: item.path_modelo,
            })
          )
        );
      } catch {
        toast.error("Error cargando las ubicaciones");
      } finally {
        setLoading(false);
      }
    };

    fetchUbicaciones();
  }, [
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.tipoReserva,
    userid,
  ]);

  const formatOptionLabel = (option: any) => (
    <div className="d-flex justify-content-between align-items-center">
      <span>{option.label}</span>
      {option.path_modelo && <span className="badge bgpri ms-2">*</span>}
    </div>
  );

  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center">
        <FaSchool className="me-2" />
        Ubicación
      </label>
      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <Select
          options={aulaOptions}
          value={formData.aula}
          onChange={(selected: any) =>
            setFormData((prev: any) => ({ ...prev, aula: selected }))
          }
          placeholder="Selecciona aula"
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={!isDateTimeComplete || !formData.tipoReserva}
          formatOptionLabel={formatOptionLabel}
        />
      )}
    </div>
  );
}
