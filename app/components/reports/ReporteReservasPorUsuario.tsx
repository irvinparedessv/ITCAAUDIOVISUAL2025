import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Table, Button, Form, Spinner, Card, Container, Row, Col } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import PaginationComponent from "~/utils/Pagination";
import { FaLongArrowAltLeft, FaFileExcel, FaFilePdf, FaSearch, FaEraser, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { formatTimeRangeTo12h } from "~/utils/time";


interface ReservaReporte {
    id: number;
    tipo: string;
    nombre_recurso: string;
    fecha: string;
    horario: string;
    estado: string;
}

interface Usuario {
    id: number;
    first_name: string;
    last_name: string;
}

const ReporteReservasPorUsuario = () => {
    const [usuarioId, setUsuarioId] = useState("");
    const [estado, setEstado] = useState("");
    const [tipoReserva, setTipoReserva] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [reservas, setReservas] = useState<ReservaReporte[]>([]);
    const [loading, setLoading] = useState(false);
    const [tiposReserva, setTiposReserva] = useState<string[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const navigate = useNavigate();

    // Para la paginación de pantalla
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(20);

    // Cargar tipos de reserva y usuarios
    useEffect(() => {
        (async () => {
            try {
                const [tipoRes, users] = await Promise.all([
                    api.get("/tipo-reservas"),
                    api.get("/usuarios/rol/Prestamista")
                ]);

                setTiposReserva(tipoRes.data.map((t: any) => t.nombre));
                setUsuarios(
                    users.data.map((u: any) => ({
                        id: u.id,
                        first_name: u.first_name,
                        last_name: u.last_name,
                    }))
                );
            } catch (err) {
                console.error(err);
                toast.error("Error cargando datos iniciales");
            }
        })();
    }, []);

    // Cargar datos de pantalla paginados
    const fetchReservas = async (page = 1) => {
        if (!usuarioId) {
            toast.error("Selecciona un usuario");
            return;
        }

        try {
            setLoading(true);
            const res = await api.get("/reportes/reservas-por-usuario", {
                params: {
                    usuario_id: usuarioId,
                    estado: estado || undefined,
                    tipo_reserva: tipoReserva || undefined,
                    fecha_inicio: fechaInicio || undefined,
                    fecha_fin: fechaFin || undefined,
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
        setUsuarioId("");
        setEstado("");
        setTipoReserva("");
        setFechaInicio("");
        setFechaFin("");
        setReservas([]);
    };

    // Cargar todos los registros (para exportar)
    const fetchAllReservas = async (): Promise<ReservaReporte[]> => {
        const allReservas: ReservaReporte[] = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            do {
                const res = await api.get("/reportes/reservas-por-usuario", {
                    params: {
                        usuario_id: usuarioId,
                        estado: estado || undefined,
                        tipo_reserva: tipoReserva || undefined,
                        fecha_inicio: fechaInicio || undefined,
                        fecha_fin: fechaFin || undefined,
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
                                    saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ReporteReservasUsuario.xlsx");

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

    // Exportar PDF
    const exportarPDF = async () => {
        const toastId = "confirmar-pdf";
        toast.dismiss(toastId);
        toast.dismiss("confirmar-excel");

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

                                            const usuarioSeleccionado = usuarios.find(u => u.id.toString() === usuarioId);
                                            const nombreUsuario = usuarioSeleccionado
                                                ? `${usuarioSeleccionado.first_name} ${usuarioSeleccionado.last_name}`
                                                : "Todos";

                                            const body = all.map((r) => [
                                                r.id,
                                                r.tipo,
                                                r.nombre_recurso,
                                                r.fecha,
                                                formatTimeRangeTo12h(r.horario),
                                                r.estado,
                                            ]);

                                            let startY = 45;

                                            autoTable(doc, {
                                                head: [["#", "Tipo", "Recurso", "Fecha", "Horario", "Estado"]],
                                                body,
                                                startY: startY,
                                                styles: { fontSize: 8, cellPadding: 3 },
                                                headStyles: { fillColor: [107, 0, 0], textColor: 255, fontStyle: "bold" },
                                                margin: { top: 10 },
                                                didDrawPage: (data) => {
                                                    if (data.pageNumber === 1) {
                                                        doc.addImage(logo, "PNG", 15, 15, 45, 11);
                                                        doc.setFontSize(16).text("Reporte de Reservas por Usuario", 60, 18);
                                                        doc.setFontSize(10)
                                                            .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                                                            .text(`Usuario: ${nombreUsuario}`, 60, 30)
                                                            .text(`Estado: ${estado || "Todos"} | Tipo: ${tipoReserva || "Todos"}`, 60, 35)
                                                            .text(`Rango: ${fechaInicio || "N/A"} a ${fechaFin || "N/A"}`, 60, 40);
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

                                            doc.save("ReporteReservasPorUsuario.pdf");
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
        ), {
            duration: 5000,
            id: toastId,
        });
    };

    const handleBack = () => {
        navigate("/opcionesReportes");
    };

    const getEstadoBadge = (estado: string) => {
        const estados = {
            "Pendiente": "warning",
            "Aprobado": "success",
            "Rechazado": "danger",
            "Cancelado": "secondary",
            "Devuelto": "info"
        };
        return estados[estado as keyof typeof estados] || "light";
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
                    Reporte de reservas por usuario
                </h2>
            </div>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Group controlId="usuarioId">
                                <Form.Label className="fw-bold">Usuario <span className="text-danger">*</span></Form.Label>

                                <label className="form-label d-flex align-items-center">

                                    Seleccionar Usuario
                                </label>
                                <Select
                                    options={usuarios.map((u) => ({
                                        value: u.id.toString(),
                                        label: `${u.first_name} ${u.last_name}`,
                                    }))}
                                    value={
                                        usuarioId
                                            ? {
                                                value: usuarioId,
                                                label:
                                                    usuarios.find((u) => u.id.toString() === usuarioId)?.first_name +
                                                    " " +
                                                    usuarios.find((u) => u.id.toString() === usuarioId)?.last_name,
                                            }
                                            : null
                                    }
                                    onChange={(selected) => setUsuarioId(selected?.value || "")}
                                    placeholder="Selecciona un usuario"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    isClearable
                                    isDisabled={false}
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            minHeight: '48px',   // Aumenta la altura mínima del control
                                            height: '48px',
                                        }),
                                        valueContainer: (provided) => ({
                                            ...provided,
                                            height: '48px',
                                            padding: '0 8px',
                                        }),
                                        input: (provided) => ({
                                            ...provided,
                                            margin: '0px',
                                        }),
                                    }}
                                />




                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group controlId="estado">
                                <Form.Label className="fw-bold">Estado</Form.Label>
                                <Form.Select
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {["Pendiente", "Aprobado", "Rechazado", "Cancelado", "Devuelto"].map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group controlId="tipoReserva">
                                <Form.Label className="fw-bold">Tipo de Reserva</Form.Label>
                                <Form.Select
                                    value={tipoReserva}
                                    onChange={(e) => setTipoReserva(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {tiposReserva.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group controlId="fechaInicio">
                                <Form.Label className="fw-bold">Desde</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    max={fechaFin || undefined}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={2}>
                            <Form.Group controlId="fechaFin">
                                <Form.Label className="fw-bold">Hasta</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    min={fechaInicio || undefined}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12} className="mt-3">
                            <div className="d-flex gap-2 justify-content-end">
                                <Button
                                    variant="primary"
                                    onClick={handleBuscarClick}
                                    disabled={loading}
                                    className="d-flex align-items-center justify-content-center gap-2"
                                >
                                    {loading ? (
                                        <Spinner size="sm" animation="border" />
                                    ) : (
                                        <>
                                            <FaSearch /> Buscar
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={limpiarFiltros}
                                    disabled={loading}
                                    className="d-flex align-items-center justify-content-center gap-2"
                                >
                                    <FaEraser /> Limpiar
                                </Button>
                            </div>
                        </Col>



                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                            Resultados de la búsqueda
                        </h5>
                        <div className="d-flex gap-2">
                            <Button
                                variant="success"
                                onClick={exportarExcel}
                                disabled={loading || reservas.length === 0}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaFileExcel /> Excel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={exportarPDF}
                                disabled={loading || reservas.length === 0}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaFilePdf /> PDF
                            </Button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <Table striped hover className="mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Tipo</th>
                                    <th>Recurso</th>
                                    <th>Fecha</th>
                                    <th>Horario</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">
                                            {loading ? (
                                                <Spinner animation="border" variant="primary" />
                                            ) : (
                                                "No hay resultados para mostrar. Realiza una búsqueda para ver los datos."
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    reservas.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.id}</td>
                                            <td>{r.tipo}</td>
                                            <td>{r.nombre_recurso}</td>
                                            <td>{r.fecha}</td>
                                            <td>{formatTimeRangeTo12h(r.horario)}</td>
                                            <td>
                                                <span className={`badge bg-${getEstadoBadge(r.estado)}`}>
                                                    {r.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {reservas.length > 0 && (
                        <div className="mt-3">
                            <PaginationComponent
                                page={currentPage}
                                totalPages={totalPages}
                                onPageChange={(p) => {
                                    setCurrentPage(p);
                                    fetchReservas(p);
                                }}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReporteReservasPorUsuario;