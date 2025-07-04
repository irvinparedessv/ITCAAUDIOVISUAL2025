import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Table, Button, Form, Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import PaginationComponent from "~/utils/Pagination";

// Importar componentes de Recharts para el gráfico
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EquipoUsoReporte {
  equipo: string;
  tipo_equipo: string;
  total_cantidad: number;
}

const ReporteUsoEquipos = () => {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipoEquipo, setTipoEquipo] = useState("");
  const [equipos, setEquipos] = useState<EquipoUsoReporte[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/tipoEquipos");
        setTiposEquipo(res.data.map((t: any) => t.nombre));
      } catch (err) {
        console.error(err);
        toast.error("Error cargando tipos de equipo");
      }
    })();
  }, []);

  const fetchEquipos = async (page = 1) => {
    if (!desde || !hasta) {
      toast.error("Selecciona ambas fechas");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/reportes/uso-equipos", {
        params: {
          from: desde,
          to: hasta,
          tipo_equipo: tipoEquipo || undefined,
          per_page: perPage,
          page,
        },
      });

      setEquipos(res.data.data || res.data);
      setCurrentPage(page);
      setTotalPages(res.data.last_page || 1);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener datos");
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarClick = () => {
    setCurrentPage(1);
    fetchEquipos(1);
  };

  const limpiarFiltros = () => {
    setDesde("");
    setHasta("");
    setTipoEquipo("");
    setEquipos([]);
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
                  // Exportar todos sin paginación (puedes hacer paginación en backend si quieres)
                  const params: any = { from: desde, to: hasta };
                  if (tipoEquipo) params.tipo_equipo = tipoEquipo;

                  const res = await api.get("/reportes/uso-equipos", { params });
                  const all = res.data.data || res.data;

                  if (!all.length) {
                    toast.error("No hay datos para exportar", { id: "excel-download" });
                    return;
                  }

                  const datos = all.map((r: EquipoUsoReporte, i: number) => ({
                    "#": i + 1,
                    "Equipo": r.equipo,
                    "Tipo de Equipo": r.tipo_equipo,
                    "Cantidad Total Reservada": r.total_cantidad,
                  }));

                  const ws = XLSX.utils.json_to_sheet(datos);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Uso Equipos");
                  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteUsoEquipos.xlsx");

                  toast.success("Excel descargado correctamente", { id: "excel-download" });
                } catch (error) {
                  console.error(error);
                  toast.error("Error al generar el Excel", { id: "excel-download" });
                }
              }}
            >
              Sí, descargar
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  // Exportar PDF
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
                const params: any = { from: desde, to: hasta };
                if (tipoEquipo) params.tipo_equipo = tipoEquipo;

                const res = await api.get("/reportes/uso-equipos", { params });
                const all = res.data.data || res.data;

                if (!all.length) {
                  toast.error("No hay datos para exportar", { id: "pdf-download" });
                  return;
                }

                const doc = new jsPDF();
                const logo = new Image();
                logo.src = "/images/logo.png"; // Ajusta la ruta según corresponda

                await new Promise<void>((resolve, reject) => {
                  logo.onload = () => {
                    try {
                      const fechaHora = new Date();
                      const fechaStr = fechaHora.toLocaleDateString("es-ES");
                      const horaStr = fechaHora.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      });

                      const body = all.map((r: EquipoUsoReporte, i: number) => [
                        i + 1,
                        r.equipo,
                        r.tipo_equipo,
                        r.total_cantidad,
                      ]);

                      // Dibuja el logo
                      doc.addImage(logo, "PNG", 15, 15, 40, 11);

                      // Encabezados de texto junto al logo
                      doc.setFontSize(16);
                      doc.text("Reporte de Uso de Equipos", 60, 18);
                      doc.setFontSize(10);
                      doc.text(`Generado: ${fechaStr} ${horaStr}`, 60, 25);
                      doc.text(`Rango: ${desde} a ${hasta}`, 60, 30);
                      doc.text(`Tipo Equipo: ${tipoEquipo || "Todos"}`, 60, 35);

                      autoTable(doc, {
                        head: [["#", "Equipo", "Tipo de Equipo", "Cantidad Total Reservada"]],
                        body,
                        startY: 50,
                        styles: { fontSize: 8, cellPadding: 3 },
                        headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                        margin: { top: 10 },
                        didDrawPage: (data) => {
                          const pageSize = doc.internal.pageSize;
                          const pageHeight = typeof pageSize.getHeight === "function"
                            ? pageSize.getHeight()
                            : pageSize.height;
                          const totalPages = doc.getNumberOfPages();
                          doc.setFontSize(8);
                          doc.text(
                            `Página ${data.pageNumber} de ${totalPages}`,
                            pageSize.width - 40,
                            pageHeight - 10
                          );
                        }
                      });

                      doc.save("ReporteUsoEquipos.pdf");
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

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Reporte de Uso de Equipos</h3>

      {/* Filtros */}
      <div className="d-flex gap-3 align-items-end flex-wrap mb-4">
        <Form.Group>
          <Form.Label>Desde</Form.Label>
          <Form.Control type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </Form.Group>

        <Form.Group>
          <Form.Label>Hasta</Form.Label>
          <Form.Control type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </Form.Group>

        <Form.Group>
          <Form.Label>Tipo de Equipo</Form.Label>
          <Form.Select value={tipoEquipo} onChange={(e) => setTipoEquipo(e.target.value)}>
            <option value="">Todos</option>
            {tiposEquipo.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button onClick={handleBuscarClick} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Buscar"}
        </Button>

        <Button variant="outline-danger" onClick={limpiarFiltros} disabled={loading}>
          Limpiar
        </Button>

        <div className="ms-auto d-flex gap-2">
          <Button variant="success" onClick={exportarExcel} disabled={loading}>
            Exportar Excel
          </Button>
          <Button variant="danger" onClick={exportarPDF} disabled={loading}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Gráfico de barras */}
      {equipos.length > 0 && (
        <div style={{ width: "100%", height: 300, marginBottom: 40 }}>
          <ResponsiveContainer>
            <BarChart data={equipos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="equipo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_cantidad" fill="#6b0000" name="Cantidad Total Reservada" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th>Tipo de Equipo</th>
            <th>Cantidad Total Reservada</th>
          </tr>
        </thead>
        <tbody>
          {equipos.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center">
                No hay resultados
              </td>
            </tr>
          ) : (
            equipos.map((e, i) => (
              <tr key={i}>
                <td>{i + 1 + (currentPage - 1) * perPage}</td>
                <td>{e.equipo}</td>
                <td>{e.tipo_equipo}</td>
                <td>{e.total_cantidad}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Paginación */}
      {equipos.length > 0 && (
        <PaginationComponent
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => {
            setCurrentPage(p);
            fetchEquipos(p);
          }}
        />
      )}
    </div>
  );
};

export default ReporteUsoEquipos;
