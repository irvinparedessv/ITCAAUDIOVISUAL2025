import { useState } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  ListGroup,
} from "react-bootstrap";


export default function FormChat() {
  const [messages, setMessages] = useState<string[]>([
    "Hola, ¿en qué te puedo ayudar hoy?",
  ]);
  const [userInput, setUserInput] = useState<string>("");

  const [reservationType, setReservationType] = useState<
    "aula" | "equipo" | "asistencia" | null
  >(null);

  const handleSendMessage = () => {
    if (userInput.trim() === "") return;

    // Agregar mensaje del usuario
    setMessages((prevMessages) => [...prevMessages, `Tú: ${userInput}`]);
    setUserInput(""); // Limpiar input

    // Lógica de respuesta según la opción seleccionada
    if (reservationType === null) {
      if (userInput.toLowerCase().includes("aula")) {
        setMessages((prevMessages) => [
          ...prevMessages,
          "¡Claro! ¿Qué aula te gustaría reservar?",
        ]);
        setReservationType("aula");
      } else if (userInput.toLowerCase().includes("equipo")) {
        setMessages((prevMessages) => [
          ...prevMessages,
          "¡Perfecto! ¿Qué equipo audiovisual te gustaría reservar?",
        ]);
        setReservationType("equipo");
      } else if (userInput.toLowerCase().includes("asistencia")) {
        setMessages((prevMessages) => [
          ...prevMessages,
          "¿En qué necesitas asistencia?",
        ]);
        setReservationType("asistencia");
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          "Lo siento, no entendí. ¿Quieres reservar un aula, un equipo o necesitas asistencia?",
        ]);
      }
    } else {
      // Dependiendo de la opción seleccionada, se le piden más detalles
      if (reservationType === "aula") {
        setMessages((prevMessages) => [
          ...prevMessages,
          `Aula reservada: ${userInput}`,
        ]);
        setReservationType(null);
      } else if (reservationType === "equipo") {
        setMessages((prevMessages) => [
          ...prevMessages,
          `Equipo reservado: ${userInput}`,
        ]);
        setReservationType(null);
      } else if (reservationType === "asistencia") {
        setMessages((prevMessages) => [
          ...prevMessages,
          `Asistencia solicitada para: ${userInput}`,
        ]);
        setReservationType(null);
      }
    }
  };

  return (
    <Container className="my-5">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white text-center">
          <h4>Chat de Reservas</h4>
        </Card.Header>
        <Card.Body>
          <div
            style={{
              height: "300px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <ListGroup variant="flush">
              {messages.map((message, index) => (
                <ListGroup.Item key={index}>
                  <strong>
                    {message.startsWith("Tú:") ? "Tú" : "Chatbot"}:
                  </strong>{" "}
                  {message.slice(4)}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>

          {/* Formulario de entrada de texto */}
          <Row className="mt-3">
            <Col>
              <Form.Control
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
              />
            </Col>
            <Col xs="auto">
              <Button variant="primary" onClick={handleSendMessage}>
                Enviar
              </Button>
            </Col>
          </Row>

          {/* Botones de opciones */}
          {reservationType === null && (
            <Row className="mt-4">
              <Col>
                <Button
                  variant="outline-primary"
                  onClick={() =>
                    setMessages((prevMessages) => [
                      ...prevMessages,
                      "¿Qué aula deseas reservar?",
                    ])
                  }
                >
                  Reservar Aula
                </Button>
              </Col>
              <Col>
                <Button
                  variant="outline-primary"
                  onClick={() =>
                    setMessages((prevMessages) => [
                      ...prevMessages,
                      "¿Qué equipo audiovisual deseas reservar?",
                    ])
                  }
                >
                  Reservar Equipo
                </Button>
              </Col>
              <Col>
                <Button
                  variant="outline-primary"
                  onClick={() =>
                    setMessages((prevMessages) => [
                      ...prevMessages,
                      "¿En qué necesitas asistencia?",
                    ])
                  }
                >
                  Asistencia
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
