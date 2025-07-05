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

interface ReservaReporte {
  id: number;
  usuario: string;
  tipo: string;
  nombre_recurso: string;
  fecha: string;
  horario: string;
  estado: string;
}

const ReporteReservasPorFecha = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoReserva, setTipoReserva] = useState("");
  const [reservas, setReservas] = useState<ReservaReporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [tiposReserva, setTiposReserva] = useState<string[]>([]);
  const navigate = useNavigate()

  // Para la paginación de pantalla
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Cargar tipos de reserva
  useEffect(() => {
    (async () => {
      try {
        const response = await api.get("/tipo-reservas");
        setTiposReserva(response.data.map((t: any) => t.nombre));
      } catch (err) {
        console.error(err);
        toast.error("Error cargando tipos de reserva");
      }
    })();
  }, []);

  // Cargar datos de pantalla paginados
  const fetchReservas = async (page = 1) => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Selecciona ambas fechas");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/reportes/reservas-rango", {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          estado: estado || undefined,
          tipo_reserva: tipoReserva || undefined,
          per_page: perPage,
          page,
        },
      });

      setReservas(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener reservas");
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarClick = () => {
    setCurrentPage(1);
    fetchReservas(1);
  };

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setEstado("");
    setTipoReserva("");
    setReservas([]);
  };

  // Cargar **todos** los registros (para exportar)
  const fetchAllReservas = async (): Promise<ReservaReporte[]> => {
    const allReservas: ReservaReporte[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
      do {
        const res = await api.get("/reportes/reservas-rango", {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: estado || undefined,
            tipo_reserva: tipoReserva || undefined,
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


  // Exportar Excel
  const exportarExcel = async () => {
    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el reporte en formato Excel?</p>
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
                    Tipo: r.tipo,
                    Recurso: r.nombre_recurso,
                    Fecha: r.fecha,
                    Horario: r.horario,
                    Estado: r.estado,
                  }));

                  const ws = XLSX.utils.json_to_sheet(datos);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Reservas");
                  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteReservas.xlsx");

                  toast.success("Excel descargado correctamente", { id: "excel-download" });
                } catch (error) {
                  console.error(error);
                  toast.error("Error al generar el Excel", { id: "excel-download" });
                }
              }}
            >
              Sí, descargar
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  // Exportar PDF con numeración de página
  const exportarPDF = async () => {
    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas descargar el reporte en formato PDF?</p>
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

                        const body = all.map((r) => [
                          r.id, r.usuario, r.tipo, r.nombre_recurso, r.fecha, r.horario, r.estado
                        ]);

                        let startY = 45;

                        autoTable(doc, {
                          head: [["#", "Usuario", "Tipo", "Recurso", "Fecha", "Horario", "Estado"]],
                          body,
                          startY: startY,
                          styles: { fontSize: 8, cellPadding: 3 },
                          headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                          margin: { top: 10 },
                          didDrawPage: (data) => {
                            if (data.pageNumber === 1) {
                              doc.addImage(logo, "PNG", 15, 15, 40, 11);
                              doc.setFontSize(16).text("Reporte de Reservas de Equipos", 60, 18);
                              doc.setFontSize(10)
                                .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                                .text(`Rango: ${fechaInicio} a ${fechaFin}`, 60, 30)
                                .text(`Estado: ${estado || "Todos"} | Tipo: ${tipoReserva || "Todos"}`, 60, 35);
                            }

                            if (data.pageNumber > 1) {
                              startY = 20;
                            }

                            const pageSize = doc.internal.pageSize;
                            const pageHeight = typeof pageSize.getHeight === "function"
                              ? pageSize.getHeight()
                              : pageSize.height;
                            const total = doc.getNumberOfPages();
                            doc.setFontSize(8)
                              .text(`Página ${data.pageNumber} de ${total}`, pageSize.width - 40, pageHeight - 10);
                          },
                          willDrawPage: (data) => {
                            if (data.pageNumber > 1) {
                              data.settings.startY = 20;
                            }
                          }
                        });

                        doc.save("ReporteReservas.pdf");
                        resolve();
                      } catch (error) {
                        reject(error);
                      }
                    };

                    logo.onerror = () => {
                      reject(new Error("No se pudo cargar el logo"));
                    };
                  });

                  toast.success("PDF descargado correctamente", { id: "pdf-download" });
                } catch (error) {
                  console.error(error);
                  toast.error("Error al generar el PDF", { id: "pdf-download" });
                }
              }}
            >
              Sí, descargar
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const handleBack = () => {
    navigate(-1); // Redirige a la ruta de inicio
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
            marginTop: '2px' // Ajuste fino para alinear visualmente el icono con el texto
          }}
        />
        <h3 className="mb-0">Reporte de reservas de equipos por rango de fechas</h3> {/* mb-0 para quitar el margen inferior */}
      </div>


      <Form>
        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-3">
            <Form.Group controlId="fechaInicio">
              <Form.Label>Desde</Form.Label>
              <Form.Control
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </Form.Group>
          </div>

          <div className="col-md-3">
            <Form.Group controlId="fechaFin">
              <Form.Label>Hasta</Form.Label>
              <Form.Control
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </Form.Group>
          </div>

          <div className="col-md-2">
            <Form.Group controlId="estado">
              <Form.Label>Estado</Form.Label>
              <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                {["Pendiente", "Aprobado", "Rechazado", "Cancelado", "Devuelto"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          <div className="col-md-2">
            <Form.Group controlId="tipoReserva">
              <Form.Label>Tipo de Reserva</Form.Label>
              <Form.Select value={tipoReserva} onChange={(e) => setTipoReserva(e.target.value)}>
                <option value="">Todos</option>
                {tiposReserva.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          <div className="col-md-2 d-flex gap-2">
            <Button variant="primary" onClick={handleBuscarClick} disabled={loading} className="flex-fill">
              {loading ? <Spinner size="sm" animation="border" /> : "Buscar"}
            </Button>
            <Button variant="outline-secondary" onClick={limpiarFiltros} disabled={loading}>
              Limpiar
            </Button>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mb-3">
          <Button variant="success" onClick={exportarExcel} disabled={loading}>
            Exportar Excel
          </Button>
          <Button variant="danger" onClick={exportarPDF} disabled={loading}>
            Exportar PDF
          </Button>
        </div>
      </Form>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th><th>Usuario</th><th>Tipo</th><th>Recurso</th><th>Fecha</th><th>Horario</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.length === 0 ? (
            <tr><td colSpan={7} className="text-center">No hay resultados</td></tr>
          ) : reservas.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.usuario}</td><td>{r.tipo}</td><td>{r.nombre_recurso}</td><td>{r.fecha}</td><td>{r.horario}</td><td>{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {reservas.length > 0 && (
        <PaginationComponent
          page={currentPage}
          totalPages={totalPages}
          onPageChange={p => {
            setCurrentPage(p);
            fetchReservas(p);
          }}
        />
      )}
    </div>
  );
};

export default ReporteReservasPorFecha;
