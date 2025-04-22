import { useState } from "react";
import { Container, Table, Badge, Button, Row, Col } from "react-bootstrap";

// Definición de tipo de datos para los equipos
type Equipment = {
  id: number;
  name: string;
  category: string;
  description: string;
  quantity: number;
  available: number;
};

const sampleEquipment: Equipment[] = [
  {
    id: 1,
    name: "Cámara 4K",
    category: "Cámara",
    description: "Cámara de video 4K para grabaciones profesionales",
    quantity: 10,
    available: 7,
  },
  {
    id: 2,
    name: "Proyector Full HD",
    category: "Proyector",
    description: "Proyector para presentaciones en auditorios",
    quantity: 5,
    available: 3,
  },
  {
    id: 3,
    name: "Micrófono de solapa",
    category: "Micrófono",
    description: "Micrófono inalámbrico de solapa para conferencias",
    quantity: 8,
    available: 8,
  },
];

export default function InventoryList() {
  const [equipmentList, setEquipmentList] =
    useState<Equipment[]>(sampleEquipment);

  const getBadgeColor = (available: number, quantity: number) => {
    if (available === 0) {
      return "danger";
    } else if (available < quantity) {
      return "warning";
    } else {
      return "success";
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <h3 className="mb-4 text-center">Listado de Inventarios</h3>

          <Table striped bordered hover responsive>
            <thead className="table-primary">
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Cantidad Total</th>
                <th>Cantidad Disponible</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.map((equipment) => (
                <tr key={equipment.id}>
                  <td>{equipment.name}</td>
                  <td>{equipment.category}</td>
                  <td>{equipment.description}</td>
                  <td>{equipment.quantity}</td>
                  <td>{equipment.available}</td>
                  <td>
                    <Badge
                      bg={getBadgeColor(
                        equipment.available,
                        equipment.quantity
                      )}
                    >
                      {equipment.available === 0
                        ? "Sin disponibilidad"
                        : equipment.available < equipment.quantity
                        ? "Bajo Stock"
                        : "Disponible"}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="info" size="sm" className="me-2">
                      Ver Detalles
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
