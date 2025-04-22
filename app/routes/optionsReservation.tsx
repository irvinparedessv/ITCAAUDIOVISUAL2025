import React from "react";
import { Card, Button, Row, Col, Container } from "react-bootstrap";
import { FaCommentDots } from "react-icons/fa"; // Icono de chat

export default function ReservationOptions() {
  return (
    <Container className="my-5">
      <Row className="d-flex justify-content-center">
        {/* Card para Reservar Aula */}
        <Col xs={12} md={6} lg={4} className="mb-4">
          <Card>
            <Card.Img
              variant="top"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuFg5ej5sPKM8ISiiZ4UKZ8mkjWVYS2yWMdw&s"
            />
            <Card.Body>
              <Card.Title>Reservar Aula</Card.Title>
              <Card.Text>
                Elige una de nuestras aulas disponibles para tu evento o clase.
                ¡Haz tu reserva de forma rápida y sencilla!
              </Card.Text>
              <Button variant="primary" href="/reservar-aula">
                Reservar Aula
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Card para Reservar Equipos */}
        <Col xs={12} md={6} lg={4} className="mb-4">
          <Card>
            <Card.Img
              variant="top"
              src="https://img.freepik.com/foto-gratis/mesa-cosas-creador-contenido-camara-microfono-tripode-auriculares-trabajando-casa_1268-17410.jpg?t=st=1742953174~exp=1742956774~hmac=b028b39d64d95f316fe94368689df6a9113072cda6b9c3aa29ae2065d8d6a16e&w=1380"
            />
            <Card.Body>
              <Card.Title>Reservar Equipos</Card.Title>
              <Card.Text>
                Reserva los equipos audiovisuales que necesites para tu evento,
                incluyendo cámaras, proyectores y micrófonos.
              </Card.Text>
              <Button variant="primary" href="/reservar-equipos">
                Reservar Equipos
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Botón flotante de chatbot */}
      <Button
        className="chatbot-btn"
        variant="success"
        size="lg"
        onClick={() => alert("Abriendo el chat...")}
      >
        <FaCommentDots size={24} />
      </Button>
    </Container>
  );
}
