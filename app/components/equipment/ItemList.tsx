import { useEffect, useState } from "react";
import type { Equipo, Estado, Insumo, ItemTipo } from "../../types/item";
import api from "~/api/axios";
import { Button, Form, InputGroup, Spinner, Modal, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { getItems, type ItemFilters, deleteItem, getInsumosNoAsignados, asignarInsumoAEquipo, eliminarAsignacion, getEstados } from "../../services/itemService";
import toast from "react-hot-toast";
import {
    FaEdit,
    FaFilter,
    FaTrash,
    FaTimes,
    FaSearch,
    FaLongArrowAltLeft,
    FaPlus,
    FaLink,
    FaEye,
} from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";
import type { TipoEquipo } from "~/types/tipoEquipo";
import ItemDetail from "./itemDetail";
import { FaWrench } from "react-icons/fa6";

type Item = Equipo | Insumo;

interface Props {
    tipos: TipoEquipo[];
    loading: boolean;
    onEdit: (item: Item) => void;
    onDelete: (id: number, tipo: ItemTipo) => void;
    modeloId?: number;
}

export default function ItemList({
    tipos,
    loading,
    onEdit,
    onDelete,
    modeloId,
}: Props) {
    const [filters, setFilters] = useState<ItemFilters>({
        search: "",
        page: 1,
        perPage: 10,
    });
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState<Item[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedItemImage, setSelectedItemImage] = useState<{
        imageUrl: string;
        name: string;
    } | null>(null);

    // Estados para modal asignar insumo
    const [showAccesorioModal, setShowAccesorioModal] = useState(false);
    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
    const [insumosDisponibles, setInsumosDisponibles] = useState<Insumo[]>([]);
    const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState<number | null>(null);
    const [loadingInsumos, setLoadingInsumos] = useState(false);
    const [asignando, setAsignando] = useState(false);


    // Estados para el modal de detalle
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEquipoDetail, setSelectedEquipoDetail] = useState<string | null>(null);

    // Estados para el modal de asignaciones
    const [showAsignacionesModal, setShowAsignacionesModal] = useState(false);
    const [currentAsignaciones, setCurrentAsignaciones] = useState<any[]>([]);

    // Función para mostrar el detalle
    const handleShowDetail = (equipoId: number) => {
        setSelectedEquipoDetail(equipoId.toString());
        setShowDetailModal(true);
    };

    function isEquipo(item: Item): item is Equipo {
        return (item as Equipo).numero_serie !== undefined && (item as Equipo).numero_serie !== null;
    }
    const [estados, setEstados] = useState<Estado[]>([]);
    useEffect(() => {
        if (showFilters) {
            getEstados()
                .then(setEstados)
                .catch((error) => {
                    console.error("Error cargando estados:", error);
                });
        }
    }, [showFilters]);


    useEffect(() => {
        fetchItems();
    }, [filters, modeloId]);

    const fetchItems = async () => {
        if (modeloId === undefined) {
            setItems([]);
            setTotal(0);
            setLastPage(1);
            return;
        }
        try {
            const res = await getItems({
                ...filters,
                tipo: 'todos',
                modeloId,
                search: filters.search || undefined,
                estadoId: filters.estadoId || undefined
            });
            setItems(Array.isArray(res.data) ? res.data : []);
            setTotal(res.total);
            setLastPage(res.last_page);
        } catch (error) {
            console.error("Error fetching items:", error);
            toast.error("Error al cargar los items");
        }
    };
    const getTipoNombre = (id: number) => {
        const tipo = tipos.find((t) => t.id === id);
        return tipo ? tipo.nombre : "Desconocido";
    };


    const handleFilterUpdate = <K extends keyof ItemFilters>(
        key: K,
        value: ItemFilters[K]
    ) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: 1,
        }));
    };

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({
            ...prev,
            page: page,
        }));
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            page: 1,
            perPage: 10,
            tipoEquipoId: undefined,
            estadoId: undefined,
            marcaId: undefined,

        });
    };

    const handleBack = () => {
        navigate("/inventario");
    };

    const getItemTypeBadge = (tipo: ItemTipo) => {
        return (
            <Badge
                bg={tipo === 'equipo' ? 'primary' : 'info'}
                className="text-capitalize"
            >
                {tipo}
            </Badge>
        );
    };

    const abrirModalAsignar = async (equipo: Equipo) => {
        setSelectedEquipo(equipo);
        setShowAccesorioModal(true);
        setInsumoSeleccionadoId(null);
        setLoadingInsumos(true);

        try {
            const insumos = await getInsumosNoAsignados(equipo.id);
            setInsumosDisponibles(insumos);
        } catch (error) {
            toast.error("Error al cargar insumos disponibles");
        } finally {
            setLoadingInsumos(false);
        }
    };

    const asignarInsumo = async () => {
        if (!selectedEquipo || !insumoSeleccionadoId) {
            toast.error("Selecciona un insumo");
            return;
        }
        setAsignando(true);
        try {
            await asignarInsumoAEquipo(selectedEquipo.id, insumoSeleccionadoId);
            toast.success("Insumo asignado correctamente");
            setShowAccesorioModal(false);
            fetchItems();
        } catch (error) {
            toast.error("Error al asignar insumo");
        } finally {
            setAsignando(false);
        }
    };

    const cargarInsumosDisponibles = async () => {
        if (!selectedEquipo) return;

        setLoadingInsumos(true);
        try {
            const insumos = await getInsumosNoAsignados(selectedEquipo.id);
            setInsumosDisponibles(insumos);
        } catch (error) {
            console.error("Error al cargar insumos disponibles", error);
            toast.error("Error al recargar los insumos disponibles");
        } finally {
            setLoadingInsumos(false);
        }
    };

    const handleEliminarAsignacion = async (insumoId: number) => {
        if (!selectedEquipo) return;

        try {
            await eliminarAsignacion(insumoId, selectedEquipo.id);
            toast.success("Asignación eliminada");

            // Recargar todos los datos
            await fetchItems(); // Esto actualiza la tabla principal
            await cargarInsumosDisponibles(); // Esto actualiza los insumos disponibles

            // Cerrar el modal
            setShowAccesorioModal(false);

        } catch (error) {
            console.error("Error eliminando asignación", error);
            toast.error("Error al eliminar la asignación");
        }
    };


    return (
        <div className="table-responsive rounded shadow p-3 mt-4">

            {/* Modal Detalle */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="lg"
                fullscreen="lg-down"
            >
                <Modal.Header className="text-white py-3" style={{ backgroundColor: "#b1291d" }} closeButton>
                    <Modal.Title>Detalle del Equipo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEquipoDetail && <ItemDetail id={selectedEquipoDetail} />}
                </Modal.Body>
            </Modal>

            {/* Modal Imagen */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedItemImage?.name || 'Imagen del item'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <img
                        src={selectedItemImage?.imageUrl}
                        alt={selectedItemImage?.name || 'Imagen ampliada'}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '70vh',
                            borderRadius: '8px',
                            objectFit: 'contain'
                        }}
                    />
                </Modal.Body>
            </Modal>

            {/* Modal Asignar Insumo */}
            <Modal show={showAccesorioModal} onHide={() => setShowAccesorioModal(false)} size="lg">
                <Modal.Header className="text-white py-3" style={{ backgroundColor: "#b1291d" }} closeButton>
                    <Modal.Title>
                        Asignar insumo a {selectedEquipo?.modelo?.nombre ?? 'Equipo'} ({selectedEquipo?.numero_serie ?? 'N/A'})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingInsumos ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <>
                            <h5>Insumos asignados actualmente:</h5>
                            {selectedEquipo && selectedEquipo.asignaciones && selectedEquipo.asignaciones.length > 0 ? (
                                <ul className="list-group mb-3">
                                    {selectedEquipo.asignaciones.map((insumo) => (
                                        <li key={insumo.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{insumo.modelo ?? 'N/A'}</strong> ({insumo.marca ?? 'N/A'})
                                            </div>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                title="Eliminar asignación"
                                                onClick={() => handleEliminarAsignacion(insumo.id)}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted">No tiene insumos asignados</p>
                            )}

                            <h5>Asignar nuevo insumo:</h5>

                            <Form.Select
                                value={insumoSeleccionadoId ?? ''}
                                onChange={e => setInsumoSeleccionadoId(Number(e.target.value))}
                            >
                                <option value="">Selecciona un insumo</option>
                                {insumosDisponibles.map(insumoAgrupado => (
                                    <option key={insumoAgrupado.modelo_id} value={insumoAgrupado.modelo_id}>
                                        {insumoAgrupado.modelo?.nombre || `Insumo #${insumoAgrupado.modelo_id}`} ({insumoAgrupado.cantidad} disponibles)
                                    </option>
                                ))}
                            </Form.Select>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAccesorioModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={asignarInsumo}
                        disabled={!insumoSeleccionadoId || asignando}
                    >
                        {asignando ? 'Asignando...' : 'Asignar'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Asignaciones */}
            <Modal show={showAsignacionesModal} onHide={() => setShowAsignacionesModal(false)} size="lg">
                <Modal.Header className="text-white py-3" style={{ backgroundColor: "#b1291d" }} closeButton>
                    <Modal.Title>Detalles de asignaciones</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tipo</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>N° Serie</th>
                                    <th>Serie Asociada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentAsignaciones.map((asignacion) => (
                                    <tr key={asignacion.id}>
                                        <td>{asignacion.id}</td>
                                        <td>
                                            <Badge bg={asignacion.tipo === 'equipo' ? 'primary' : 'info'}>
                                                {asignacion.tipo}
                                            </Badge>
                                        </td>
                                        <td>{asignacion.marca || 'N/A'}</td>
                                        <td>{asignacion.modelo || 'N/A'}</td>
                                        <td>{asignacion.numero_serie || '-'}</td>
                                        <td>{asignacion.serie_asociada || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAsignacionesModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                    <FaLongArrowAltLeft
                        onClick={handleBack}
                        title="Regresar"
                        style={{ cursor: 'pointer', fontSize: '2rem' }}
                    />
                    <h2 className="fw-bold m-0">Inventario Individual</h2>
                </div>

            </div>

            {/* Filtros */}
            {/* Buscador + botón para mostrar filtros adicionales */}
            <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
                <div className="d-flex flex-grow-1">
                    <InputGroup className="flex-grow-1">
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Buscar por número de serie, descripción, etc."
                            value={filters.search}
                            onChange={(e) => handleFilterUpdate("search", e.target.value)}
                        />
                        {filters.search && (
                            <Button
                                variant="outline-secondary"
                                onClick={() => handleFilterUpdate("search", "")}
                                style={{ padding: '0 12px' }}
                            >
                                <FaTimes />
                            </Button>
                        )}
                    </InputGroup>
                </div>

                <Button
                    variant={showFilters ? "secondary" : "outline-secondary"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="d-flex align-items-center gap-2"
                >
                    <FaFilter />
                    {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </Button>
            </div>

            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Cargando datos...</p>
                </div>
            )}

            {showFilters && (
                <div className="p-3 rounded mb-4 border border-secondary">
                    <div className="row g-3">
                        <div className="">
                            <Form.Group>
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    value={filters.estadoId || ""}
                                    onChange={(e) => handleFilterUpdate("estadoId", e.target.value ? Number(e.target.value) : undefined)}
                                >
                                    <option value="">Todos</option>
                                    {estados.map((estado) => (
                                        <option key={estado.id} value={estado.id}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </Form.Select>

                            </Form.Group>
                        </div>
                        <div className="col-12">
                            <Button variant="outline-danger" onClick={resetFilters} className="w-100">
                                <FaTimes className="me-2" /> Limpiar filtros
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de items */}
            {!loading && (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle text-center">
                            <thead className="table-dark">
                                <tr>
                                    <th>#</th>
                                    <th className="rounded-top-start">Tipo</th>
                                    <th>Tipo Equipo</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Estado</th>
                                    <th>N° Serie</th>
                                    <th>Cantidad</th>
                                    <th>Reposo</th>
                                    <th>Detalles</th>
                                    <th>Caracteristicas</th>
                                    <th>Asignaciones</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ? (
                                    items.map((item) => {
                                        const isEquipoItem = isEquipo(item);
                                        const modeloNombre = item.modelo?.nombre || 'N/A';
                                        const asignaciones = (item as any).asignaciones || [];

                                        return (
                                            <tr key={item.id}>
                                                <td>{item.id}</td>
                                                <td>{getItemTypeBadge(item.tipo)}</td>
                                                <td><em>{getTipoNombre(item.tipo_equipo_id)}</em></td>
                                                <td>{item.modelo?.marca?.nombre || 'Sin marca'}</td>
                                                <td>{modeloNombre}</td>
                                                <td>
                                                    <Badge bg={
                                                        item.estado_id === 1 ? 'success' :
                                                            item.estado_id === 2 ? 'warning' : 'danger'
                                                    }>
                                                        {item.estado_id === 1 ? 'Disponible' :
                                                            item.estado_id === 2 ? 'Mantenimiento' : 'Dañado'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {isEquipoItem
                                                        ? item.numero_serie
                                                        : (item as Insumo).serie_asociada || '-'}
                                                </td>
                                                <td>{item.cantidad}</td>
                                                <td>
                                                    {isEquipoItem
                                                        ? item.reposo
                                                            ? `${item.reposo} minutos`
                                                            : '-'
                                                        : '-'}
                                                </td>

                                                <td>{item.detalles || 'N/A'}</td>
                                                <td>
                                                    <div style={{ maxWidth: "200px" }}>
                                                        {(item.caracteristicas || []).length > 0 ? (
                                                            <ul className="list-unstyled mb-0">
                                                                {(item.caracteristicas || []).slice(0, 3).map((caracteristica) => (
                                                                    <li key={caracteristica.caracteristica_id}>
                                                                        <small>
                                                                            <strong>{caracteristica.nombre}:</strong> {caracteristica.valor}
                                                                        </small>
                                                                    </li>
                                                                ))}
                                                                {(item.caracteristicas || []).length > 3 && (
                                                                    <li>
                                                                        <small className="text-muted">
                                                                            +{(item.caracteristicas || []).length - 3} más...
                                                                        </small>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-muted">Sin características</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {asignaciones.length > 0 ? (
                                                        <OverlayTrigger
                                                            placement="left"
                                                            overlay={
                                                                <Tooltip id={`tooltip-${item.id}`}>
                                                                    <strong>Asignaciones:</strong>
                                                                    <ul className="mb-0 ps-3">
                                                                        {asignaciones.slice(0, 3).map((asignacion: any) => (
                                                                            <li key={asignacion.id}>
                                                                                {asignacion.marca} {asignacion.modelo}
                                                                            </li>
                                                                        ))}
                                                                        {asignaciones.length > 3 && (
                                                                            <li>...y {asignaciones.length - 3} más</li>
                                                                        )}
                                                                    </ul>
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <button
                                                                className="btn btn-outline-secondary rounded-circle"
                                                                onClick={() => {
                                                                    setCurrentAsignaciones(asignaciones);
                                                                    setShowAsignacionesModal(true);
                                                                }}
                                                                style={{
                                                                    width: "44px",
                                                                    height: "44px",
                                                                    transition: "transform 0.2s ease-in-out",
                                                                }}
                                                                onMouseEnter={(e) =>
                                                                    (e.currentTarget.style.transform = "scale(1.15)")
                                                                }
                                                                onMouseLeave={(e) =>
                                                                    (e.currentTarget.style.transform = "scale(1)")
                                                                }
                                                            >
                                                                <FontAwesomeIcon icon={faList} />
                                                            </button>
                                                        </OverlayTrigger>
                                                    ) : (
                                                        <span className="text-muted">Ninguna</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <Button
                                                            variant="outline-info"
                                                            className="rounded-circle"
                                                            title="Ver detalles"
                                                            style={{
                                                                width: "44px",
                                                                height: "44px",
                                                                transition: "transform 0.2s ease-in-out",
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.transform = "scale(1.15)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.transform = "scale(1)")
                                                            }
                                                            onClick={() => handleShowDetail(item.id)}
                                                        >
                                                            <FaEye />
                                                        </Button>
                                                        <Button
                                                            variant="outline-primary"
                                                            className="rounded-circle"
                                                            title={`Editar ${item.tipo}`}
                                                            style={{
                                                                width: "44px",
                                                                height: "44px",
                                                                transition: "transform 0.2s ease-in-out",
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.transform = "scale(1.15)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.transform = "scale(1)")
                                                            }
                                                            onClick={() => onEdit(item)}
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                        {isEquipoItem && (
                                                            <Button
                                                                variant="outline-success"
                                                                className="rounded-circle"
                                                                title="Asignar insumo"
                                                                style={{
                                                                    width: "44px",
                                                                    height: "44px",
                                                                    transition: "transform 0.2s ease-in-out",
                                                                }}
                                                                onMouseEnter={(e) =>
                                                                    (e.currentTarget.style.transform = "scale(1.15)")
                                                                }
                                                                onMouseLeave={(e) =>
                                                                    (e.currentTarget.style.transform = "scale(1)")
                                                                }
                                                                onClick={() => abrirModalAsignar(item)}
                                                            >
                                                                <FaLink />
                                                            </Button>
                                                        )}
                                                        {/* <Button
                                                            variant="outline-danger"
                                                            className="rounded-circle"
                                                            title={`Eliminar ${item.tipo}`}
                                                            style={{
                                                                width: "44px",
                                                                height: "44px",
                                                                transition: "transform 0.2s ease-in-out",
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.transform = "scale(1.15)")
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.transform = "scale(1)")
                                                            }
                                                            onClick={() => confirmarEliminacion(
                                                                item.id,
                                                                item.detalles || `Item #${item.id}`,
                                                                item.tipo
                                                            )}
                                                        >
                                                            <FaTrash />
                                                        </Button> */}
                                                        
                                                    {/* NUEVO BOTÓN Crear mantenimiento */}
                                                    <Button
                                                        variant="outline-warning"
                                                        title="Crear mantenimiento"
                                                        className="rounded-circle"
                                                        style={{ width: "44px", height: "44px", transition: "transform 0.2s ease-in-out" }}
                                                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                                                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                                                        onClick={() => navigate("/mantenimiento")}
                                                    >
                                                        <FaWrench />
                                                    </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="text-muted text-center">
                                            No se encontraron items.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationComponent
                        page={filters.page || 1}
                        totalPages={lastPage}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}