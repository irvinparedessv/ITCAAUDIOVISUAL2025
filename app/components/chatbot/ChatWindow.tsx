import Message from "./Message";
import type {
  Message as MessageType,
  OptionType,
  ReservaData,
  ReservaDataRoom,
} from "./types";
import React, { forwardRef } from "react";

type Props = {
  messages: MessageType[];
  step: string;
  handleOptionClick: (option: string) => void;
  handleUbicacionClick: (ubicacion: string) => void;
  handleTipoClick: (tipo: string, label: string) => void;
  handleEquipoClick: (equipo: string) => void;
  handleAulaClick: (aula: string) => void;
  handleAulaFechaClick: (fecha: string) => void;
  completarReserva: () => void;
  setReservaData: React.Dispatch<React.SetStateAction<ReservaData>>;
  ubicaciones: OptionType[];
  equipos: OptionType[];
  tipos: OptionType[];
  reservaData: ReservaData;
  reservaDataRoom: ReservaDataRoom;
  setStep: (step: string) => void;
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
      handleEquipoClick,
      handleAulaFechaClick,
      handleTipoClick,
      completarReserva,
      ubicaciones,
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
            onClick={() => handleUbicacionClick(ubicacion.value)}
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
    const renderEquipos = () => (
      <div className="equipo-botones">
        {equipos.map((equipo) => (
          <button
            key={equipo.value}
            className={`equipo-btn ${
              reservaData.equipos.includes(equipo.label) ? "seleccionado" : ""
            }`}
            onClick={() => handleEquipoClick(equipo.value)}
          >
            {reservaData.equipos.includes(equipo.value) ? "✅ " : ""}
            {equipo.label}
          </button>
        ))}
      </div>
    );

    const renderSeleccionarAula = () => (
      <div className="aula-botones">
        {ubicaciones.map((aula) => (
          <button
            key={aula.value}
            className={`aula-btn ${
              reservaData.ubicacion === aula.label ? "seleccionado" : ""
            }`}
            onClick={() => handleAulaClick(aula.label)}
          >
            {aula.label}
          </button>
        ))}
        <button
          onClick={() => setStep("seleccionarFechaAula")}
          disabled={!reservaData.ubicacion}
        >
          Siguiente
        </button>
      </div>
    );

    const renderResumenAula = () => (
      <div className="resumen-aula">
        <h4>Resumen de tu reserva de espacio:</h4>
        <p>🏫 Aula: {reservaDataRoom.aula}</p>
        <p>📅 Fecha: {reservaDataRoom.fecha}</p>
        <p>
          🕒 De: {reservaDataRoom.horarioInicio} a {reservaDataRoom.horarioFin}
        </p>
      </div>
    );

    const renderExitoReserva = () => (
      <div className="mensaje-exito">
        ✅ Tu reserva de aula fue realizada con éxito.
        <button onClick={() => setStep("initial")}>Volver al inicio</button>
      </div>
    );

    const renderErrorReserva = () => (
      <div className="mensaje-error">
        ❌ Ocurrió un error al realizar la reserva.
        <button onClick={() => setStep("initial")}>Volver al inicio</button>
      </div>
    );

    return (
      <div className="chat-messages">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}
        {step === "initial" && (
          <div className="bot-options">
            <button onClick={() => handleOptionClick("Crear reserva equipo")}>
              Crear reserva equipo
            </button>
            <button onClick={() => handleOptionClick("Crear reserva aula")}>
              Crear reserva aula
            </button>
            <button onClick={() => handleOptionClick("Consultas")}>
              Consultas
            </button>
          </div>
        )}
        {step === "mostrarTipoEventos" && renderTiposEventos()}
        {step === "seleccionarUbicacion" && renderUbicaciones()}
        {step === "mostrarEquipos" && renderEquipos()}

        {step === "resumen" && renderResumen()}
        {step === "seleccionarAula" && renderSeleccionarAula()}
        {step === "resumenAula" && renderResumenAula()}
        <div ref={ref}></div>
      </div>
    );
  }
);

export default ChatWindow;
