import React from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

type FiltersProps = {
  from: Date | null;
  to: Date | null;
  setFrom: (date: Date | null) => void;
  setTo: (date: Date | null) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  search: string;
  setSearch: (value: string) => void;
  onReset: () => void;
};

const Filters: React.FC<FiltersProps> = ({
  from,
  to,
  setFrom,
  setTo,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  onReset,
}) => {
  return (
    <div className="p-3 rounded mb-4 border">
      <Row className="mb-3">
        <Col md={3}>
          <Form.Label>Desde</Form.Label>
          <Form.Control
            type="date"
            value={from ? from.toISOString().slice(0, 10) : ""}
            onChange={(e) =>
              setFrom(e.target.value ? new Date(e.target.value) : null)
            }
          />
        </Col>
        <Col md={3}>
          <Form.Label>Hasta</Form.Label>
          <Form.Control
            type="date"
            value={to ? to.toISOString().slice(0, 10) : ""}
            onChange={(e) =>
              setTo(e.target.value ? new Date(e.target.value) : null)
            }
          />
        </Col>
        <Col md={3}>
          <Form.Label>Estado</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="Cancelado">Cancelado</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Label>Buscar (Aula o Prestamista)</Form.Label>
          <Form.Control
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
      </Row>
      <div className="d-flex justify-content-end">
        <Button variant="outline-danger" onClick={onReset}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
};

export default Filters;
