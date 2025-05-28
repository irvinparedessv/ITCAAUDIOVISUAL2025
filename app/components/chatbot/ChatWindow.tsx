import Message from "./Message";
import type { Message as MessageType, OptionType } from "./types";
import React, { forwardRef } from "react";

type Props = {
  messages: MessageType[];
  step: string;
  handleOptionClick: (option: string) => void;
  handleUbicacionClick: (ubicacion: string) => void;
  handleEquipoClick: (equipo: string) => void;
  handleAulaClick: (aula: string) => void;
  handleAulaFechaClick: (fecha: string) => void;
  completarReserva: () => void;
  ubicaciones: OptionType[];
  equipos: OptionType[];
  reservaData: {
    ubicacion: string;
    equipos: string[];
    fecha: string;
    horaInicio: string;
    horaFin: string;
  };
  setStep: (step: string) => void;
};

const ChatWindow = forwardRef<HTMLDivElement, Props>(
  (
    {
      messages,
      step,
      handleOptionClick,
      handleUbicacionClick,
      handleAulaClick,
      handleEquipoClick,
      handleAulaFechaClick,
      completarReserva,
      ubicaciones,
      equipos,
      reservaData,
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

    const renderResumen = () => (
      <div className="resumen-reserva">
        <h4>Resumen de tu reserva:</h4>
        <p>📅 Fecha: {reservaData.fecha}</p>
        <p>
          🕒 De: {reservaData.horaInicio} a {reservaData.horaFin}
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
        <div style={{ marginTop: "10px" }}>
          <button onClick={() => setStep("mostrarEquipos")}>
            Volver a equipos
          </button>{" "}
          <button
            onClick={completarReserva}
            disabled={reservaData.equipos.length === 0}
          >
            Confirmar reserva
          </button>
        </div>
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
            {reservaData.equipos.includes(equipo.label) ? "✅ " : ""}
            {equipo.label}
          </button>
        ))}
        <div className="acciones-reserva" style={{ marginTop: "10px" }}>
          <button
            onClick={() => setStep("resumen")}
            disabled={reservaData.equipos.length === 0}
          >
            Ver resumen
          </button>
          <button
            onClick={completarReserva}
            disabled={reservaData.equipos.length === 0}
            style={{ marginLeft: "10px" }}
          >
            Confirmar reserva
          </button>
        </div>
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
            onClick={() => handleAulaClick(aula.value)}
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

    const renderSeleccionarFechaAula = () => (
      <div className="fecha-aula">
        <p>Selecciona una fecha:</p>
        <input
          type="date"
          value={reservaData.fecha}
          onChange={(e) => handleAulaFechaClick("fechaAula")}
        />
        <button
          onClick={() => setStep("seleccionarHoraAula")}
          disabled={!reservaData.fecha}
        >
          Siguiente
        </button>
      </div>
    );

    const renderSeleccionarHoraAula = () => (
      <div className="hora-aula">
        <p>Selecciona un horario:</p>
        <input
          type="time"
          value={reservaData.horaInicio}
          onChange={(e) => handleOptionClick("horaInicioAula")}
        />
        <input
          type="time"
          value={reservaData.horaFin}
          onChange={(e) => handleOptionClick("horaFinAula")}
        />
        <button
          onClick={() => setStep("resumenAula")}
          disabled={!reservaData.horaInicio || !reservaData.horaFin}
        >
          Siguiente
        </button>
      </div>
    );

    const renderResumenAula = () => (
      <div className="resumen-aula">
        <h4>Resumen de tu reserva de aula:</h4>
        <p>📅 Fecha: {reservaData.fecha}</p>
        <p>
          🕒 De: {reservaData.horaInicio} a {reservaData.horaFin}
        </p>
        <p>🏫 Aula: {reservaData.ubicacion}</p>
        <div style={{ marginTop: "10px" }}>
          <button onClick={() => setStep("seleccionarAula")}>Volver</button>{" "}
          <button onClick={completarReserva}>Confirmar reserva</button>
        </div>
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

        {step === "seleccionarUbicacion" && renderUbicaciones()}
        {step === "mostrarEquipos" && renderEquipos()}
        {step === "resumen" && renderResumen()}

        {step === "seleccionarAula" && renderSeleccionarAula()}
        {step === "fechaAula" && renderSeleccionarFechaAula()}
        {step === "seleccionarHoraAula" && renderSeleccionarHoraAula()}
        {step === "resumenAula" && renderResumenAula()}

        <div ref={ref}></div>
      </div>
    );
  }
);

export default ChatWindow;
