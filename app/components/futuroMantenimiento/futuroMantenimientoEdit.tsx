import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Button, Form, Spinner } from "react-bootstrap";

import {
  getFuturoMantenimientoById,
  updateFuturoMantenimiento,
} from "../../services/futuroMantenimientoService";
import { getEquipos } from "../../services/equipoService";
import { getTiposMantenimiento } from "../../services/tipoMantenimientoService";

import type { FuturoMantenimientoUpdateDTO } from "../../types/futuroMantenimiento";
import type { Equipo } from "../../types/equipo";
import type { TipoMantenimiento } from "../../types/tipoMantenimiento";

const FuturoMantenimientoEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FuturoMantenimientoUpdateDTO>();

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equiposData, tiposData, mantenimiento] = await Promise.all([
          getEquipos(),
          getTiposMantenimiento(),
          getFuturoMantenimientoById(Number(id)),
        ]);

        setEquipos(equiposData);
        setTipos(tiposData);

        // Rellenar formulario
        setValue("equipo_id", mantenimiento.equipo_id);
        setValue("tipo_mantenimiento_id", mantenimiento.tipo_mantenimiento_id);
        setValue("fecha_mantenimiento", mantenimiento.fecha_mantenimiento.split("T")[0]);
        setValue("hora_mantenimiento_inicio", mantenimiento.hora_mantenimiento_inicio);
        setValue("hora_mantenimiento_final", mantenimiento.hora_mantenimiento_final);
      } catch (error) {
        toast.error("Error al cargar los datos del mantenimiento");
      }
    };

    fetchData();
  }, [id, setValue]);

  const onSubmit = async (data: FuturoMantenimientoUpdateDTO) => {
    try {
      await updateFuturoMantenimiento(Number(id), data);
      toast.success("Futuro mantenimiento actualizado correctamente");
      navigate("/futuro-mantenimientos");
    } catch (error) {
      toast.error("Error al actualizar el mantenimiento");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Editar Futuro Mantenimiento</h2>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3" controlId="equipo_id">
          <Form.Label>Equipo</Form.Label>
          <Form.Select {...register("equipo_id", { required: "El equipo es obligatorio" })}>
            <option value="">Seleccione un equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </Form.Select>
          {errors.equipo_id && <small className="text-danger">{errors.equipo_id.message}</small>}
        </Form.Group>

        <Form.Group className="mb-3" controlId="tipo_mantenimiento_id">
          <Form.Label>Tipo de Mantenimiento</Form.Label>
          <Form.Select {...register("tipo_mantenimiento_id", { required: "El tipo es obligatorio" })}>
            <option value="">Seleccione un tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Form.Select>
          {errors.tipo_mantenimiento_id && (
            <small className="text-danger">{errors.tipo_mantenimiento_id.message}</small>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="fecha_mantenimiento">
          <Form.Label>Fecha</Form.Label>
          <Form.Control
            type="date"
            {...register("fecha_mantenimiento", { required: "La fecha es obligatoria" })}
          />
          {errors.fecha_mantenimiento && (
            <small className="text-danger">{errors.fecha_mantenimiento.message}</small>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="hora_mantenimiento_inicio">
          <Form.Label>Hora de Inicio</Form.Label>
          <Form.Control
            type="time"
            {...register("hora_mantenimiento_inicio", { required: "La hora inicial es obligatoria" })}
          />
          {errors.hora_mantenimiento_inicio && (
            <small className="text-danger">{errors.hora_mantenimiento_inicio.message}</small>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="hora_mantenimiento_final">
          <Form.Label>Hora Final</Form.Label>
          <Form.Control
            type="time"
            {...register("hora_mantenimiento_final", { required: "La hora final es obligatoria" })}
          />
          {errors.hora_mantenimiento_final && (
            <small className="text-danger">{errors.hora_mantenimiento_final.message}</small>
          )}
        </Form.Group>

        <div className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => navigate("/futuro-mantenimientos")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : "Actualizar"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FuturoMantenimientoEdit;
