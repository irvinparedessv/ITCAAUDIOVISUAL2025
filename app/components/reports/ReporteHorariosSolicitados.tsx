import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button, Card, Container, Form, Row, Col, Spinner, Table } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import api from "../../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PaginationComponent from "~/utils/Pagination";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from "~/hooks/ThemeContext";
import { FaLongArrowAltLeft, FaFileExcel, FaFilePdf, FaSearch, FaEraser, FaChartBar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { useAuth } from "~/hooks/AuthContext";
import { Role } from "~/types/roles";

// Registrar componentes de Chart.js
ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Title
);

interface HorarioMasSolicitado {
    horario: string;
    total: number;
    tipo: string;
    equipo_nombre?: string;
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
    const navigate = useNavigate();
    const chartRef = useRef<any>(null);
    const { user } = useAuth();

    // Paginación tabla (frontend)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    const customSelectStyles = useMemo(() => ({
        control: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#2d2d2d" : "#fff",
            borderColor: darkMode ? "#444" : "#ccc",
            color: darkMode ? "#f8f9fa" : "#212529",
            minHeight: '48px',
            height: '48px',
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#2d2d2d" : "#fff",
            color: darkMode ? "#f8f9fa" : "#212529",
        }),
        input: (base: any) => ({
            ...base,
            color: darkMode ? "#f8f9fa" : "#212529",
            margin: '0px',
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
        valueContainer: (provided: any) => ({
            ...provided,
            height: '48px',
            padding: '0 8px',
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
                .catch(() => toast.error("Error cargando aulas", { id: "error-cargar-aulas" }));
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

    const getNombreSeleccionado = () => {
        if (tipo === "aula" && aulaId) {
            const aula = aulas.find(a => a.id === aulaId);
            return aula ? ` - Espacio: ${aula.name}` : "";
        } else if (tipo === "equipo" && equipoSeleccionado) {
            return ` - Equipo: ${equipoSeleccionado.label}`;
        }
        return "";
    };

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
            toast.error("Error cargando equipos", { id: "error-cargar-equipos" });
            return [];
        }
    };

    const fetchReporte = async () => {
        const ERROR_FILTROS_ID = "error-filtros";
        const ERROR_REPORTE_ID = "error-obtener-reporte";

        if (!desde || !hasta) {
            toast.error("Selecciona ambas fechas", { id: ERROR_FILTROS_ID });
            return;
        }
        if (!tipo) {
            toast.error("Selecciona un tipo de reserva", { id: ERROR_FILTROS_ID });
            return;
        }
        if (tipo === "aula" && !aulaId) {
            toast.error("Selecciona un espacio", { id: ERROR_FILTROS_ID });
            return;
        }
        if (tipo === "equipo" && !equipoSeleccionado) {
            toast.error("Selecciona un equipo", { id: ERROR_FILTROS_ID });
            return;
        }

        try {
            setLoading(true);
            const params: any = {
                from: desde,
                to: hasta,
                tipo
            };
            if (tipo === "aula") params.aula_id = aulaId;
            if (tipo === "equipo") params.equipo_id = equipoSeleccionado?.value;

            const res = await api.get("/reportes/horarios-solicitados", { params });
            setData(res.data || []);
            setCurrentPage(1);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el reporte", { id: ERROR_REPORTE_ID });
            setData([]);
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
        const toastId = "confirmar-excel";
        toast.dismiss(toastId);
        toast.dismiss("confirmar-pdf");

        toast(
            (t) => (
                <div>
                    <p>¿Estás seguro que deseas descargar el reporte en formato Excel?</p>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                toast.dismiss(t.id);
                                if (data.length === 0) {
                                    toast.error("No hay datos para exportar", { id: "excel-download" });
                                    return;
                                }

                                toast.loading("Generando Excel...", { id: "excel-download" });

                                try {
                                    const datos = data.map((d) => ({
                                        Horario: d.horario,
                                        Tipo: d.tipo,
                                        ...(tipo === "equipo" ? { Equipo: d.equipo_nombre ?? "—" } : {}),
                                        Total: d.total,
                                    }));

                                    const ws = XLSX.utils.json_to_sheet(datos);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "HorariosSolicitados");
                                    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                                    saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteHorariosSolicitados.xlsx");

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
            {
                duration: 5000,
                id: toastId,
            }
        );
    };

    const exportarPDF = () => {
        const toastId = "confirmar-pdf";
        toast.dismiss(toastId);
        toast.dismiss("confirmar-excel");

        toast((t) => (
            <div>
                <p>¿Estás seguro que deseas descargar el reporte en formato PDF?</p>
                <div className="d-flex justify-content-end gap-2 mt-2">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (data.length === 0) {
                                toast.error("No hay datos para exportar", { id: "pdf-download" });
                                return;
                            }

                            toast.loading("Generando PDF...", { id: "pdf-download" });

                            try {
                                const doc = new jsPDF();
                                const logo = new Image();
                                logo.src = "/images/logo.png";

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
                                    ...(tipo === "equipo" ? [d.equipo_nombre ?? "—"] : []),
                                    d.total,
                                ]);


                                doc.addImage(logo, "PNG", 15, 15, 45, 11);
                                doc.setFontSize(16).text("Reporte de Horarios Más Solicitados", 60, 18);
                                doc.setFontSize(10)
                                    .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                                    .text(`Rango: ${desde} a ${hasta}`, 60, 30)
                                    .text(`Tipo: ${tipo || "Todos"}`, 60, 35)
                                    .text(
                                        tipo === "aula" && aulaId
                                            ? `Espacio: ${aulas.find(a => a.id === aulaId)?.name || ""}`
                                            : tipo === "equipo" && equipoSeleccionado
                                                ? `Equipo: ${equipoSeleccionado.label}`
                                                : "",
                                        60,
                                        40
                                    );

                                autoTable(doc, {
                                    head,
                                    body,
                                    startY: 45,
                                    styles: { fontSize: 8, cellPadding: 3 },
                                    headStyles: {
                                        fillColor: [107, 0, 0],
                                        textColor: 255,
                                        fontStyle: "bold",
                                    },
                                    margin: { top: 10 },
                                    didDrawPage: (data) => {
                                        const pageSize = doc.internal.pageSize;
                                        const pageHeight = typeof pageSize.getHeight === "function"
                                            ? pageSize.getHeight()
                                            : pageSize.height;
                                        doc.setFontSize(8)
                                            .text(`Página ${data.pageNumber} de ${doc.getNumberOfPages()}`,
                                                pageSize.width - 40, pageHeight - 10);
                                    }
                                });

                                doc.save("ReporteHorariosSolicitados.pdf");
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
        ), {
            duration: 5000,
            id: toastId,
        });
    };

    const downloadChart = () => {
        if (!chartRef.current) return;

        const toastId = "download-chart";
        toast.dismiss(toastId);

        toast((t) => (
            <div>
                <p>¿Deseas descargar el gráfico como imagen?</p>
                <div className="d-flex justify-content-end gap-2 mt-2">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                            toast.dismiss(t.id);
                            const chart = chartRef.current;

                            if (chart) {
                                const canvas = chart.canvas;
                                const ctx = canvas.getContext("2d");

                                // Usar darkMode desde el contexto
                                const bgColor = darkMode ? '#1e1e1e' : '#ffffff';

                                // Guardar imagen actual del canvas
                                const original = ctx.getImageData(0, 0, canvas.width, canvas.height);

                                // Dibujar fondo adecuado
                                ctx.save();
                                ctx.globalCompositeOperation = "destination-over";
                                ctx.fillStyle = bgColor;
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.restore();

                                // Descargar imagen
                                const imageLink = document.createElement('a');
                                imageLink.download = 'GraficoHorariosSolicitados.png';
                                imageLink.href = chart.toBase64Image();
                                imageLink.click();

                                // Restaurar canvas
                                ctx.putImageData(original, 0, 0);

                                toast.success("Gráfico descargado correctamente", { id: toastId });
                            }
                        }}
                    >
                        Descargar
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            id: toastId,
        });
    };


    const handleBuscarClick = () => {
        fetchReporte();
    };

    const handleBack = () => {
        navigate(-1);
    };

    // Paginación frontend
    const paginatedData = data.slice((currentPage - 1) * perPage, currentPage * perPage);

    // Configuración del gráfico
    const chartData = {
        labels: data.map(item => item.horario),
        datasets: [
            {
                label: 'Total de Reservas',
                data: data.map(item => item.total),
                backgroundColor: '#6b0000',
                borderColor: '#4a0000',
                borderWidth: 1,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: darkMode ? '#fff' : '#333',
                    font: {
                        size: 14
                    }
                }
            },
            title: {
                display: true,
                text: `Horarios más solicitados${getNombreSeleccionado()}`,
                color: darkMode ? '#fff' : '#333',
                font: {
                    size: 16,
                    weight: 'bold' as const
                }
            },
            tooltip: {
                backgroundColor: darkMode ? '#333' : '#fff',
                titleColor: darkMode ? '#fff' : '#333',
                bodyColor: darkMode ? '#fff' : '#333',
                borderColor: '#6b0000',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function (context: any) {
                        return `Reservas: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: darkMode ? '#fff' : '#333'
                },
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: darkMode ? '#fff' : '#333',
                    precision: 0
                },
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    return (
        <Container className="mt-4">
            <div className="d-flex align-items-center gap-3 mb-4">
                <FaLongArrowAltLeft
                    onClick={handleBack}
                    title="Regresar"
                    style={{
                        cursor: 'pointer',
                        fontSize: '2rem'
                    }}
                />
                <h2 className="fw-bold m-0">
                    Reporte de horarios más solicitados
                </h2>
            </div>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={2}>
                            <Form.Group controlId="desde">
                                <Form.Label className="fw-bold">Desde <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={desde}
                                    onChange={(e) => setDesde(e.target.value)}
                                    max={hasta || undefined}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group controlId="hasta">
                                <Form.Label className="fw-bold">Hasta <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={hasta}
                                    onChange={(e) => setHasta(e.target.value)}
                                    min={desde || undefined}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group controlId="tipo">
                                <Form.Label className="fw-bold">
                                    Tipo <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                >
                                    <option value="">-- Selecciona --</option>
                                    {user?.role !== Role.Encargado && (
                                        <option value="aula">Espacio</option>
                                    )}
                                    <option value="equipo">Equipo</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {tipo === "aula" && (
                            <Col md={3}>
                                <Form.Group controlId="aulaId">
                                    <Form.Label className="fw-bold">Espacio <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        options={aulas.map((a) => ({
                                            value: a.id,
                                            label: a.name,
                                        }))}
                                        value={
                                            aulaId
                                                ? {
                                                    value: aulaId,
                                                    label: aulas.find((a) => a.id === aulaId)?.name || "",
                                                }
                                                : null
                                        }
                                        onChange={(selected) => setAulaId(selected ? selected.value : "")}
                                        placeholder="Selecciona un espacio"
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        menuPortalTarget={document.body}
                                        isClearable
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                minHeight: "48px",
                                                height: "48px",
                                            }),
                                            valueContainer: (provided) => ({
                                                ...provided,
                                                height: "48px",
                                                padding: "0 8px",
                                            }),
                                            input: (provided) => ({
                                                ...provided,
                                                margin: "0px",
                                            }),
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                        )}

                        {tipo === "equipo" && (
                            <Col md={3}>
                                <Form.Group controlId="equipo">
                                    <Form.Label className="fw-bold">Equipo <span className="text-danger">*</span></Form.Label>
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
                            </Col>
                        )}

                        <Col md={3} className="mt-3">
                            <div className="d-flex flex-wrap justify-content-end gap-2">
                                <div className="flex-grow-1 flex-sm-grow-0" style={{ minWidth: '120px' }}>
                                    <Button
                                        variant="primary"
                                        onClick={handleBuscarClick}
                                        disabled={loading}
                                        className="d-flex align-items-center justify-content-center gap-2 w-100"
                                        style={{ height: '48px' }}
                                    >
                                        {loading ? (
                                            <Spinner size="sm" animation="border" />
                                        ) : (
                                            <>
                                                <FaSearch /> Buscar
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="flex-grow-1 flex-sm-grow-0" style={{ minWidth: '120px' }}>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={limpiarFiltros}
                                        disabled={loading}
                                        className="d-flex align-items-center justify-content-center gap-2 w-100"
                                        style={{ height: '48px' }}
                                    >
                                        <FaEraser /> Limpiar
                                    </Button>
                                </div>
                            </div>
                        </Col>

                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
                        <h5 className="mb-3 mb-md-0">
                            Resultados de la búsqueda
                        </h5>
                        <div className="d-flex gap-2">
                            <Button
                                variant="success"
                                onClick={exportarExcel}
                                disabled={loading || data.length === 0}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaFileExcel /> Excel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={exportarPDF}
                                disabled={loading || data.length === 0}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaFilePdf /> PDF
                            </Button>
                            <Button
                                variant="warning"
                                onClick={downloadChart}
                                disabled={loading || data.length === 0}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaChartBar /> Gráfico
                            </Button>
                        </div>
                    </div>

                    {data.length > 0 && (
                        <div style={{ width: "100%", height: "400px", marginBottom: "30px" }}>
                            <Bar
                                ref={chartRef}
                                data={chartData}
                                options={chartOptions}
                            />
                        </div>
                    )}

                    <div className="table-responsive">
                        <Table striped hover className="mb-0">
                            <thead className="table-dark">
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
                                        <td colSpan={tipo === "equipo" ? 4 : 3} className="text-center py-4">
                                            {loading ? (
                                                <Spinner animation="border" variant="primary" />
                                            ) : (
                                                "No hay resultados para mostrar. Realiza una búsqueda para ver los datos."
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((d, i) => (
                                        <tr key={i}>
                                            <td>{(currentPage - 1) * perPage + i + 1}</td>
                                            <td>{d.horario}</td>
                                            {tipo === "equipo" && <td>{d.equipo_nombre ?? "—"}</td>}
                                            <td>{d.total}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {data.length > perPage && (
                        <div className="mt-3">
                            <PaginationComponent
                                page={currentPage}
                                totalPages={Math.ceil(data.length / perPage)}
                                onPageChange={(p) => setCurrentPage(p)}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReporteHorariosSolicitados;