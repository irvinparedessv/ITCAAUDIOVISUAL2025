import React, { useState, useEffect, useMemo } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import api from "../../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PaginationComponent from "~/utils/Pagination";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { useTheme } from "~/hooks/ThemeContext";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface HorarioMasSolicitado {
    horario: string;
    total: number;
    tipo: string;
    nombre_equipo?: string;
}

interface Aula {
    id: number;
    name: string;
}

interface OptionType {
    label: string;
    value: number;
}

const ReporteHorariosSolicitados = () => {
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [tipo, setTipo] = useState("");
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [aulaId, setAulaId] = useState<number | "">("");
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<OptionType | null>(null);
    const [data, setData] = useState<HorarioMasSolicitado[]>([]);
    const [loading, setLoading] = useState(false);
    const { darkMode } = useTheme();
    const navigate = useNavigate()
    // Paginación tabla
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const customSelectStyles = useMemo(() => ({
        control: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#2d2d2d" : "#fff",
            borderColor: darkMode ? "#444" : "#ccc",
            color: darkMode ? "#f8f9fa" : "#212529",
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#2d2d2d" : "#fff",
            color: darkMode ? "#f8f9fa" : "#212529",
        }),
        input: (base: any) => ({
            ...base,
            color: darkMode ? "#f8f9fa" : "#212529",
        }),
        placeholder: (base: any) => ({
            ...base,
            color: darkMode ? "#bbb" : "#666",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: darkMode ? "#f8f9fa" : "#212529",
        }),
        option: (base: any, { isFocused, isSelected }: any) => ({
            ...base,
            backgroundColor: isSelected
                ? (darkMode ? "#555" : "#d3d3d3")
                : isFocused
                    ? (darkMode ? "#444" : "#e6e6e6")
                    : "transparent",
            color: darkMode ? "#f8f9fa" : "#212529",
            cursor: "pointer",
        }),
    }), [darkMode]);

    // Carga aulas si tipo es aula y limpia selección equipos
    useEffect(() => {
        if (tipo === "aula") {
            api.get("/aulasEquipos")
                .then((res) => {
                    // Filtra solo aulas
                    const aulasFiltradas = res.data.filter((item: any) => item.tipo === "aula" || item.name);
                    setAulas(aulasFiltradas);
                })
                .catch(() => toast.error("Error cargando aulas"));
            setAulaId("");
            setEquipoSeleccionado(null);
        } else if (tipo === "equipo") {
            // Limpia aulas al seleccionar tipo equipo
            setAulas([]);
            setAulaId("");
            setEquipoSeleccionado(null);
        } else {
            // Limpia todo si no hay tipo
            setAulas([]);
            setAulaId("");
            setEquipoSeleccionado(null);
        }
    }, [tipo]);

    // Función para cargar opciones en AsyncSelect
    const loadOptions = async (inputValue: string) => {
        if (!inputValue.trim()) return [];
        try {
            const res = await api.get("/prediccion/equipos/buscar", {
                params: { search: inputValue, limit: 10 },
            });
            return res.data.data.map((equipo: any) => ({
                value: equipo.id,
                label: equipo.nombre,
            }));
        } catch {
            toast.error("Error cargando equipos");
            return [];
        }
    };

    const fetchReporte = async () => {
        if (!desde || !hasta) return toast.error("Selecciona ambas fechas");
        if (!tipo) return toast.error("Selecciona un tipo de reserva");
        if (tipo === "aula" && !aulaId) return toast.error("Selecciona un aula");
        if (tipo === "equipo" && !equipoSeleccionado) return toast.error("Selecciona un equipo");

        try {
            setLoading(true);
            const params: any = { from: desde, to: hasta, tipo };
            if (tipo === "aula") params.aula_id = aulaId;
            if (tipo === "equipo") params.equipo_id = equipoSeleccionado?.value;

            const res = await api.get("/reportes/horarios-solicitados", { params });
            setData(res.data);
            setCurrentPage(1);
        } catch (error) {
            toast.error("Error al cargar el reporte");
        } finally {
            setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        setDesde("");
        setHasta("");
        setTipo("");
        setAulaId("");
        setEquipoSeleccionado(null);
        setData([]);
    };

    const exportarExcel = () => {
        if (data.length === 0) return toast.error("No hay datos para exportar");

        const datos = data.map((d) => ({
            Horario: d.horario,
            Tipo: d.tipo,
            Total: d.total,
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "HorariosSolicitados");
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteHorariosSolicitados.xlsx");

        toast.success("Excel generado correctamente");
    };

    const exportarPDF = async () => {
        toast((t) => (
            <div>
                <p>¿Estás seguro que deseas descargar el reporte en formato PDF?</p>
                <div className="d-flex justify-content-end gap-2 mt-2">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            toast.loading("Generando PDF...", { id: "pdf-download" });

                            try {
                                if (data.length === 0) {
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
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                                hour12: true,
                                            });

                                            const head = [
                                                ["#", "Horario", "Tipo", ...(tipo === "equipo" ? ["Equipo"] : []), "Total"]
                                            ];

                                            const body = data.map((d, i) => [
                                                i + 1,
                                                d.horario,
                                                d.tipo,
                                                ...(tipo === "equipo" ? [(d as any).equipo_nombre ?? "—"] : []),
                                                d.total,
                                            ]);

                                            let startY = 45;

                                            autoTable(doc, {
                                                head,
                                                body,
                                                startY,
                                                styles: { fontSize: 9, cellPadding: 3 },
                                                headStyles: {
                                                    fillColor: [107, 0, 0],
                                                    textColor: 255,
                                                    fontStyle: "bold",
                                                },
                                                margin: { top: 10 },
                                                didDrawPage: (data) => {
                                                    if (data.pageNumber === 1) {
                                                        doc.addImage(logo, "PNG", 15, 15, 40, 11);
                                                        doc.setFontSize(16).text("Reporte de Horarios Más Solicitados", 60, 18);
                                                        doc.setFontSize(10)
                                                            .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                                                            .text(`Rango: ${desde} a ${hasta}`, 60, 30)
                                                            .text(
                                                                `Tipo: ${tipo || "Todos"}${tipo === "aula" && aulaId
                                                                    ? ` | Aula ID: ${aulaId}`
                                                                    : tipo === "equipo" && equipoSeleccionado
                                                                        ? ` | Equipo: ${equipoSeleccionado.label}`
                                                                        : ""
                                                                }`,
                                                                60,
                                                                35
                                                            );
                                                    }

                                                    const pageSize = doc.internal.pageSize;
                                                    const pageHeight = typeof pageSize.getHeight === "function"
                                                        ? pageSize.getHeight()
                                                        : pageSize.height;

                                                    doc.setFontSize(8).text(
                                                        `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`,
                                                        pageSize.width - 40,
                                                        pageHeight - 10
                                                    );
                                                },
                                                willDrawPage: (data) => {
                                                    if (data.pageNumber > 1) {
                                                        data.settings.startY = 20;
                                                    }
                                                }
                                            });

                                            doc.save("ReporteHorariosSolicitados.pdf");
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
                    <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(t.id)}>
                        Cancelar
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const handleBack = () => {
    navigate(-1); // Redirige a la ruta de inicio
  };


    const paginatedData = data.slice((currentPage - 1) * perPage, currentPage * perPage);

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
                    <h3 className="mb-0">Reporte de horarios más solicitados</h3>
                  </div>

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
                    <Form.Label>Tipo de Reserva</Form.Label>
                    <Form.Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="">-- Selecciona tipo --</option>
                        <option value="aula">Aula</option>
                        <option value="equipo">Equipo</option>
                    </Form.Select>
                </Form.Group>

                {tipo === "aula" && (
                    <Form.Group>
                        <Form.Label>Aula</Form.Label>
                        <Form.Select value={aulaId} onChange={(e) => setAulaId(Number(e.target.value) || "")}>
                            <option value="">-- Selecciona aula --</option>
                            {aulas.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}

                {tipo === "equipo" && (
                    <Form.Group style={{ minWidth: 250 }}>
                        <Form.Label>Equipo</Form.Label>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={loadOptions}

                            defaultOptions
                            onChange={(selected) => setEquipoSeleccionado(selected as OptionType)}
                            value={equipoSeleccionado}
                            placeholder="Buscar equipo..."
                            isClearable
                            styles={customSelectStyles}
                            menuPortalTarget={document.body}
                        />
                    </Form.Group>
                )}

                <Button onClick={fetchReporte} disabled={loading}>
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

            {/* Gráfico */}
            {data.length > 0 && (
                <div style={{ width: "100%", height: 350, marginBottom: 30 }}>

                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="horario" tick={{ fill: "black" }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                                labelStyle={{ color: "black" }}
                                itemStyle={{ color: "black" }}
                            />
                            <Bar dataKey="total" fill="#6b0000" name="Cantidad de Reservas" />
                        </BarChart>
                    </ResponsiveContainer>

                </div>
            )}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Horario</th>
                        {tipo === "equipo" && <th>Equipo</th>}
                        <th>Total de Reservas</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan={tipo === "equipo" ? 5 : 4} className="text-center">No hay resultados</td>
                        </tr>
                    ) : (
                        paginatedData.map((d, i) => (
                            <tr key={i}>
                                <td>{(currentPage - 1) * perPage + i + 1}</td>
                                <td>{d.horario}</td>
                                {tipo === "equipo" && <td>{(d as any).equipo_nombre ?? "—"}</td>}
                                <td>{d.total}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>



            {data.length > perPage && (
                <PaginationComponent
                    page={currentPage}
                    totalPages={Math.ceil(data.length / perPage)}
                    onPageChange={(p) => setCurrentPage(p)}
                />
            )}
        </div>
    );
};

export default ReporteHorariosSolicitados;
