import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Table, Button, Form, Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import PaginationComponent from "~/utils/Pagination";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface ReservaAulaReporte {
  id: number;
  usuario: string;
  aula: string;
  fecha: string;
  horario: string;
  estado: string;
}

interface Aula {
  id: number;
  name: string;
}

const ReporteReservasPorAula = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState("");
  const [aulaId, setAulaId] = useState<number | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [reservas, setReservas] = useState<ReservaAulaReporte[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);

  useEffect(() => {
    const fetchAulas = async () => {
      try {
        const res = await api.get("/aulas");
        setAulas(res.data);
      } catch (error) {
        console.error("Error cargando aulas", error);
      }
    };

    fetchAulas();
  }, []);

  const fetchReservas = async (page = 1) => {
    if (!fechaInicio || !fechaFin || !aulaId) {
      toast.error("Selecciona aula y ambas fechas");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/reportes/reservas-por-aula", {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          estado: estado || undefined,
          aula_id: aulaId,
          per_page: perPage,
          page,
        },
      });

      setReservas(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener el reporte");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReservas = async (): Promise<ReservaAulaReporte[]> => {
    const allReservas: ReservaAulaReporte[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
      do {
        const res = await api.get("/reportes/reservas-por-aula", {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: estado || undefined,
            aula_id: aulaId,
            per_page: 100,
            page: currentPage,
          },
        });

        allReservas.push(...res.data.data);
        totalPages = res.data.last_page;
        currentPage++;
      } while (currentPage <= totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar todos los registros");
    }

    return allReservas;
  };

  const exportarExcel = async () => {
    toast((t) => (
      <div>
        <p>¿Descargar el reporte en formato Excel?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.loading("Generando Excel...", { id: "excel-download" });

              try {
                const all = await fetchAllReservas();
                if (!all.length) {
                  toast.error("No hay datos para exportar", { id: "excel-download" });
                  return;
                }

                const datos = all.map((r) => ({
                  ID: r.id,
                  Usuario: r.usuario,
                  Aula: r.aula,
                  Fecha: r.fecha,
                  Horario: r.horario,
                  Estado: r.estado,
                }));

                const ws = XLSX.utils.json_to_sheet(datos);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Uso de Aulas por Aula");
                const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteReservasPorAula.xlsx");

                toast.success("Excel descargado", { id: "excel-download" });
              } catch (error) {
                toast.error("Error al generar el Excel", { id: "excel-download" });
              }
            }}
          >Sí, descargar</button>
          <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const exportarPDF = async () => {
    toast((t) => (
      <div>
        <p>¿Descargar el reporte en formato PDF?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.loading("Generando PDF...", { id: "pdf-download" });

              try {
                const all = await fetchAllReservas();
                if (!all.length) {
                  toast.error("No hay datos para exportar", { id: "pdf-download" });
                  return;
                }

                const doc = new jsPDF();
                const logo = new Image();
                logo.src = "/images/logo.png";

                await new Promise<void>((resolve, reject) => {
                  logo.onload = () => {
                    try {
                      const fechaHora = new Date();
                      const fechaStr = fechaHora.toLocaleDateString("es-ES");
                      const horaStr = fechaHora.toLocaleTimeString("es-ES", {
                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
                      });

                      const aulaNombre = aulas.find((a) => a.id === aulaId)?.name || "";

                      const body = all.map((r) => [r.id, r.usuario, r.aula, r.fecha, r.horario, r.estado]);

                      let startY = 45;

                      autoTable(doc, {
                        head: [["#", "Usuario", "Aula", "Fecha", "Horario", "Estado"]],
                        body,
                        startY,
                        styles: { fontSize: 8, cellPadding: 3 },
                        headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                        didDrawPage: (data) => {
                          if (data.pageNumber === 1) {
                            doc.addImage(logo, "PNG", 15, 15, 40, 11);
                            doc.setFontSize(16).text("Reporte de Uso de Aulas por Aula", 60, 18);
                            doc.setFontSize(10)
                              .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                              .text(`Rango: ${fechaInicio} a ${fechaFin}`, 60, 30)
                              .text(`Aula: ${aulaNombre}`, 60, 35)
                              .text(`Estado: ${estado || "Todos"}`, 60, 40);
                          }
                          const pageSize = doc.internal.pageSize;
                          const pageHeight = typeof pageSize.getHeight === "function" ? pageSize.getHeight() : pageSize.height;
                          const total = doc.getNumberOfPages();
                          doc.setFontSize(8).text(`Página ${data.pageNumber} de ${total}`, pageSize.width - 40, pageHeight - 10);
                        },
                      });

                      doc.save("ReporteReservasPorAula.pdf");
                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  };
                  logo.onerror = () => reject(new Error("No se pudo cargar el logo"));
                });

                toast.success("PDF descargado", { id: "pdf-download" });
              } catch (error) {
                toast.error("Error al generar el PDF", { id: "pdf-download" });
              }
            }}
          >Sí, descargar</button>
          <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(t.id)}>
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const handleBuscarClick = () => {
    setCurrentPage(1);
    fetchReservas(1);
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <FaLongArrowAltLeft onClick={handleBack} title="Regresar" style={{ cursor: 'pointer', fontSize: '2rem', marginTop: '2px' }} />
        <h3 className="mb-0">Reporte de uso de aulas por aula</h3>
      </div>

      <div className="row g-3 align-items-end mb-4">
        <div className="col-md-3">
          <Form.Group controlId="aula">
            <Form.Label>Aula</Form.Label>
            <Form.Select value={aulaId ?? ""} onChange={(e) => setAulaId(e.target.value ? parseInt(e.target.value) : null)} disabled={loading}>
              <option value="">Seleccione un aula</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        <div className="col-md-2">
          <Form.Group controlId="fechaInicio">
            <Form.Label>Desde</Form.Label>
            <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} disabled={loading} max={fechaFin || undefined} />
          </Form.Group>
        </div>

        <div className="col-md-2">
          <Form.Group controlId="fechaFin">
            <Form.Label>Hasta</Form.Label>
            <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} disabled={loading} min={fechaInicio || undefined} />
          </Form.Group>
        </div>

        <div className="col-md-2">
          <Form.Group controlId="estado">
            <Form.Label>Estado</Form.Label>
            <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)} disabled={loading}>
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Devuelto">Devuelto</option>
            </Form.Select>
          </Form.Group>
        </div>

        <div className="col-md-3 d-flex gap-2">
          <Button variant="primary" onClick={handleBuscarClick} disabled={loading} className="flex-fill">
            {loading ? <Spinner size="sm" animation="border" /> : "Buscar"}
          </Button>
          <Button variant="outline-secondary" onClick={() => { setFechaInicio(""); setFechaFin(""); setEstado(""); setAulaId(null); setReservas([]); }} disabled={loading}>Limpiar</Button>
        </div>

        <div className="col-md-2 d-flex gap-2 ms-auto">
          <Button variant="success" onClick={exportarExcel} disabled={loading}>Exportar Excel</Button>
          <Button variant="danger" onClick={exportarPDF} disabled={loading}>Exportar PDF</Button>
        </div>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th><th>Usuario</th><th>Aula</th><th>Fecha</th><th>Horario</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.length === 0 ? (
            <tr><td colSpan={6} className="text-center">No hay resultados</td></tr>
          ) : reservas.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.usuario}</td>
              <td>{r.aula}</td>
              <td>{r.fecha}</td>
              <td>{r.horario}</td>
              <td>{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {reservas.length > 0 && (
        <PaginationComponent
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => {
            setCurrentPage(p);
            fetchReservas(p);
          }}
        />
      )}
    </div>
  );
};

export default ReporteReservasPorAula;
