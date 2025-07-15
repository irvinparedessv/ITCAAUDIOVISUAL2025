import { Spinner } from "react-bootstrap";
import Message from "./Message";
import type {
  Message as MessageType,
  OptionType,
  ReservaData,
  ReservaDataRoom,
} from "./types";
import React, { forwardRef } from "react";
import { formatDate } from "./../../utils/time";
import { Steps } from "./steps";

type Props = {
  messages: MessageType[];
  step: string;
  handleOptionClick: (option: string) => void;
  handleUbicacionClick: (ubicacion: string) => void;
  handleTipoClick: (tipo: string, label: string) => void;
  handleEquipoClick: (equipo: string, tipoEquipo: string) => void;
  handleDiasClick: (dia: string) => void;
  handleAulaClick: (aula: string) => void;
  handleAulaFechaClick: (fecha: string) => void;
  completarReserva: () => void;
  setReservaData: React.Dispatch<React.SetStateAction<ReservaData>>;
  ubicaciones: OptionType[];
  equipos: OptionType[];
  tipos: OptionType[];
  espacios: OptionType[];
  reservaData: ReservaData;
  reservaDataRoom: ReservaDataRoom;
  setStep: (step: string) => void;
  handleTypeClick: (type: string) => void;
};

const ChatWindow = forwardRef<HTMLDivElement, Props>(
  (
    {
      messages,
      step,
      tipos,
      handleOptionClick,
      handleUbicacionClick,
      handleAulaClick,
      handleTypeClick,
      handleEquipoClick,
      handleDiasClick,
      handleAulaFechaClick,
      handleTipoClick,
      completarReserva,
      ubicaciones,
      espacios,
      equipos,
      reservaData,
      reservaDataRoom,
      setReservaData,
      setStep,
    },
    ref
  ) => {
    const renderUbicaciones = () => (
      <div className="ubicacion-botones">
        {ubicaciones.map((ubicacion) => (
          <button
            key={ubicacion.value}
            className={`ubicacion-btn ${
              reservaData.ubicacion === ubicacion.label ? "seleccionado" : ""
            }`}
            onClick={() => handleUbicacionClick(ubicacion.label)}
          >
            {ubicacion.label}
          </button>
        ))}
      </div>
    );

    const renderTiposEventos = () => (
      <div className="ubicacion-botones">
        {tipos.map((tipo) => (
          <button
            key={tipo.value}
            className={`ubicacion-btn ${
              reservaData.ubicacion === tipo.label ? "seleccionado" : ""
            }`}
            onClick={() => handleTipoClick(tipo.value, tipo.label)}
          >
            {tipo.label}
          </button>
        ))}
      </div>
    );
    const renderResumen = () => (
      <div className="resumen-reserva">
        <h4>Resumen de tu reserva:</h4>
        <p>📅 Fecha: {reservaData.fecha}</p>
        <p>
          🕒 De: {reservaData.horaInicio} a {reservaData.horaFin}
        </p>
        <p>
          Tipo de Evento:{" "}
          {(() => {
            const tipoEvento = tipos.find((t) => t.value === reservaData.tipo);
            return tipoEvento?.label || reservaData.tipo;
          })()}
        </p>
        <p>📍 Ubicación: {reservaData.ubicacion}</p>
        <p>🎥 Equipos seleccionados:</p>
        {reservaData.equipos.length === 0 ? (
          <p style={{ fontStyle: "italic" }}>
            No has seleccionado ningún equipo.
          </p>
        ) : (
          <ul>
            {reservaData.equipos.map((equipoId) => {
              const equipox = equipos.find((e) => e.value === equipoId);
              return (
                <li key={equipoId}>
                  {equipox?.label || equipox?.value || equipoId}{" "}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
    const renderEquipos = () => {
      // Obtener todos los tipoEquipo ya seleccionados
      const tiposSeleccionados = reservaData.equipos
        .map((e) => {
          const equipoObj = equipos.find((eq) => eq.value === e);
          return equipoObj?.tipoequipo;
        })
        .filter(Boolean);

      return (
        <div className="equipo-botones">
          {equipos
            .filter((equipo) => {
              // Mostrar solo si:
              // - Es del tipo correcto
              // - Y (no hay otro del mismo tipo seleccionado O es el mismo equipo seleccionado)
              const yaSeleccionado = reservaData.equipos.includes(equipo.value);
              const tipoYaSeleccionado = tiposSeleccionados.includes(
                equipo.tipoequipo
              );

              return (
                equipo.tipo == reservaData.tipo &&
                (!tipoYaSeleccionado || yaSeleccionado)
              );
            })
            .map((equipo) => (
              <button
                key={equipo.value}
                className={`equipo-btn ${
                  reservaData.equipos.includes(equipo.value)
                    ? "seleccionado"
                    : ""
                }`}
                onClick={() =>
                  handleEquipoClick(equipo.value, equipo.tipoequipo ?? "")
                }
              >
                {reservaData.equipos.includes(equipo.value) ? "✅ " : ""}
                {equipo.label}
              </button>
            ))}
        </div>
      );
    };
    const renderSeleccionarAula = () => (
      <div className="aula-botones">
        {espacios.map((aula) => (
          <button
            key={aula.value}
            className={`btn btn-primary ${
              reservaData.ubicacion === aula.label ? "seleccionado" : ""
            }`}
            onClick={() => handleAulaClick(aula.value)}
          >
            {aula.label}
          </button>
        ))}
      </div>
    );
    const renderSeleccionarDias = () => {
      const diasDisponibles = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ];

      return (
        <div className="dias-botones">
          {diasDisponibles.map((dia) => (
            <button
              key={dia}
              className={`btn btn-primary ${
                reservaDataRoom.dias?.includes(dia) ? "seleccionado" : ""
              }`}
              onClick={() => handleDiasClick(dia)}
            >
              {reservaDataRoom.dias?.includes(dia) ? "✅ " : ""}
              {dia}
            </button>
          ))}
        </div>
      );
    };

    const renderSeleccionarTipo = () => (
      <div className="tipo-botones">
        <button
          key={"evento"}
          className={`btn btn-primary ${
            reservaDataRoom.type === "evento" ? "seleccionado" : ""
          }`}
          onClick={() => handleTypeClick("evento")}
        >
          evento
        </button>
        <button
          key={"clase"}
          className={`btn btn-primary ${
            reservaDataRoom.type === "clase" ? "seleccionado" : ""
          }`}
          onClick={() => handleTypeClick("clase")}
        >
          clase
        </button>
        <button
          key={"clase_recurrente"}
          className={`btn btn-primary ${
            reservaDataRoom.type === "clase_recurrente" ? "seleccionado" : ""
          }`}
          onClick={() => handleTypeClick("clase_recurrente")}
        >
          clase_recurrente
        </button>
      </div>
    );

    const renderResumenAula = () => (
      <div className="resumen-aula">
        <h4>Resumen de tu reserva de espacio:</h4>

        <p>
          🏫 Aula:
          {(() => {
            const aula = espacios.find((t) => t.value === reservaDataRoom.aula);
            return aula?.label || reservaDataRoom.aula;
          })()}
        </p>
        <p>📝 Título: {reservaDataRoom.titulo}</p>
        <p>📌 Tipo: {reservaDataRoom.type}</p>
        <p>📅 Fecha inicio: {formatDate(reservaDataRoom.fecha)}</p>
        {reservaDataRoom.type === "clase_recurrente" &&
          reservaDataRoom.fecha_fin && (
            <p>📅 Fecha fin: {formatDate(reservaDataRoom.fecha_fin)}</p>
          )}
        <p>
          🕒 De: {reservaDataRoom.horarioInicio} a {reservaDataRoom.horarioFin}
        </p>
      </div>
    );

    return (
      <div className="chat-messages">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}
        {step === "initial" && (
          <div className="bot-options">
            <button
              className="btn btn-primary"
              onClick={() => handleOptionClick("Crear reserva equipo")}
            >
              Crear reserva equipo
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleOptionClick("Crear reserva aula")}
            >
              Crear reserva aula
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleOptionClick("Consultas")}
            >
              Consultas
            </button>
          </div>
        )}
        {step === "mostrarTipoEventos" && renderTiposEventos()}
        {step === "seleccionarUbicacion" && renderUbicaciones()}
        {step === "mostrarEquipos" && renderEquipos()}
        {step === "resumen" && renderResumen()}
        {step === "seleccionarAula" && renderSeleccionarAula()}
        {step === "SeleccionarTipoReservaAula" && renderSeleccionarTipo()}
        {step === "SeleccionarDias" && renderSeleccionarDias()}
        {step === "resumenAula" && renderResumenAula()}
        {step === "loading" && <Spinner animation="border" variant="primary" />}
        <div ref={ref}></div>
      </div>
    );
  }
);

export default ChatWindow;
