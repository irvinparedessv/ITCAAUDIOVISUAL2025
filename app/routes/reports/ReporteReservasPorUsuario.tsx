import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Table, Button, Form, Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import PaginationComponent from "~/utils/Pagination";

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

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(20);

    useEffect(() => {
        (async () => {
            try {
                const tipoRes = await api.get("/tipo-reservas");
                setTiposReserva(tipoRes.data.map((t: any) => t.nombre));

                const users = await api.get("/usuarios/rol/Prestamista");
                setUsuarios(
                    users.data.map((u: any) => ({
                        id: u.id,
                        first_name: u.first_name,
                        last_name: u.last_name,
                    }))
                );
            } catch {
                toast.error("Error cargando datos");
                setUsuarios([]);
            }
        })();
    }, []);

    const fetchReservas = async (page = 1) => {
        if (!usuarioId) {
            toast.error("Selecciona un usuario");
            return;
        }

        setLoading(true);
        try {
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
        } catch {
            toast.error("Error al obtener reservas");
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = () => {
        setCurrentPage(1);
        fetchReservas(1);
    };

    const limpiar = () => {
        setUsuarioId("");
        setEstado("");
        setTipoReserva("");
        setFechaInicio("");
        setFechaFin("");
        setReservas([]);
    };

    const fetchAll = async (): Promise<ReservaReporte[]> => {
        const all: ReservaReporte[] = [];
        let page = 1;
        let total = 1;

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
                        page,
                    },
                });

                all.push(...res.data.data);
                total = res.data.last_page;
                page++;
            } while (page <= total);
        } catch {
            toast.error("Error al obtener todos los datos");
        }

        return all;
    };

    const exportarExcel = async () => {
        toast(
            (t) => (
                <div>
                    <p>¿Deseas descargar el reporte en Excel?</p>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <Button
                            size="sm"
                            onClick={async () => {
                                toast.dismiss(t.id);
                                toast.loading("Generando Excel...", { id: "excel" });
                                const all = await fetchAll();
                                if (!all.length) {
                                    toast.error("No hay datos para exportar", { id: "excel" });
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
                                const buffer = XLSX.write(wb, {
                                    bookType: "xlsx",
                                    type: "array",
                                });
                                saveAs(new Blob([buffer]), "ReporteReservasUsuario.xlsx");
                                toast.success("Excel descargado", { id: "excel" });
                            }}
                        >
                            Descargar
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            ),
            { duration: 10000 }
        );
    };

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
                                    const all = await fetchAll();
                                    if (!all.length) {
                                        toast.error("No hay datos para exportar", { id: "pdf-download" });
                                        return;
                                    }

                                    const doc = new jsPDF();
                                    const logo = new Image();
                                    logo.src = "/images/logo.png"; // Pon aquí la ruta correcta a tu logo

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

                                                const usuarioSeleccionado = usuarios.find(u => u.id.toString() === usuarioId);
                                                const nombreUsuario = usuarioSeleccionado ? `${usuarioSeleccionado.first_name} ${usuarioSeleccionado.last_name}` : "Todos";


                                                const body = all.map((r) => [
                                                    r.id,
                                                    r.tipo,
                                                    r.nombre_recurso,
                                                    r.fecha,
                                                    r.horario,
                                                    r.estado,
                                                ]);

                                                let startY = 45;

                                                autoTable(doc, {
                                                    head: [["#", "Tipo", "Recurso", "Fecha", "Horario", "Estado"]],
                                                    body,
                                                    startY: startY,
                                                    styles: { fontSize: 8, cellPadding: 3 },
                                                    headStyles: {
                                                        fillColor: [107, 0, 0],
                                                        textColor: 255,
                                                        fontStyle: "bold",
                                                    },
                                                    margin: { top: 10 },
                                                    didDrawPage: (data) => {
                                                        if (data.pageNumber === 1) {
                                                            doc.addImage(logo, "PNG", 15, 15, 40, 11);
                                                            doc.setFontSize(16).text("Reporte de Reservas por Usuario", 60, 18);
                                                            doc
                                                                .setFontSize(10)
                                                                .text(`Generado: ${fechaStr} - ${horaStr}`, 60, 25)
                                                                .text(`Filtros: Usuario: ${nombreUsuario}, Estado: ${estado || "Todos"}, Tipo: ${tipoReserva || "Todos"}`, 60, 30)
                                                                .text(
                                                                    `Rango fechas: ${fechaInicio || "N/A"} a ${fechaFin || "N/A"}`,
                                                                    60,
                                                                    35
                                                                );
                                                        }

                                                        if (data.pageNumber > 1) {
                                                            startY = 20;
                                                        }

                                                        const pageSize = doc.internal.pageSize;
                                                        const pageHeight =
                                                            typeof pageSize.getHeight === "function"
                                                                ? pageSize.getHeight()
                                                                : pageSize.height;
                                                        const total = doc.getNumberOfPages();
                                                        doc
                                                            .setFontSize(8)
                                                            .text(
                                                                `Página ${data.pageNumber} de ${total}`,
                                                                pageSize.width - 40,
                                                                pageHeight - 10
                                                            );
                                                    },
                                                    willDrawPage: (data) => {
                                                        if (data.pageNumber > 1) {
                                                            data.settings.startY = 20;
                                                        }
                                                    },
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
            ),
            { duration: 10000 }
        );
    };


    return (
        <div className="container mt-4">
            <h3 className="mb-4">Reporte de Reservas por Usuario</h3>

            <div className="d-flex gap-3 align-items-end flex-wrap mb-4">
                <Form.Group>
                    <Form.Label>Usuario</Form.Label>
                    <Form.Select
                        value={usuarioId}
                        onChange={(e) => setUsuarioId(e.target.value)}
                    >
                        <option value="">Selecciona...</option>
                        {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.first_name} {u.last_name}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                        <option value="">Todos</option>
                        {["Pendiente", "Aprobado", "Rechazado", "Cancelado", "Devuelto"].map(
                            (s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            )
                        )}
                    </Form.Select>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Tipo</Form.Label>
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

                <Form.Group>
                    <Form.Label>Fecha inicio</Form.Label>
                    <Form.Control
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>Fecha fin</Form.Label>
                    <Form.Control
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                    />
                </Form.Group>

                <Button onClick={handleBuscar} disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : "Buscar"}
                </Button>

                <Button variant="outline-danger" onClick={limpiar}>
                    Limpiar
                </Button>

                <div className="ms-auto d-flex gap-2">
                    <Button variant="success" onClick={exportarExcel}>
                        Excel
                    </Button>
                    <Button variant="danger" onClick={exportarPDF}>
                        PDF
                    </Button>
                </div>
            </div>

            <Table striped bordered hover responsive>
                <thead>
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
                            <td colSpan={6} className="text-center">
                                No hay resultados
                            </td>
                        </tr>
                    ) : (
                        reservas.map((r) => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.tipo}</td>
                                <td>{r.nombre_recurso}</td>
                                <td>{r.fecha}</td>
                                <td>{r.horario}</td>
                                <td>{r.estado}</td>
                            </tr>
                        ))
                    )}
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

export default ReporteReservasPorUsuario;
