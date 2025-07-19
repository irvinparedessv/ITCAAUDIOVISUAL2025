import { useEffect, useState } from "react";
import type { Equipo, Insumo, ItemTipo } from "../../types/item";
import { Button, Form, InputGroup, Spinner, Modal, Badge } from "react-bootstrap";
import { getItems, type ItemFilters } from "../../services/itemService";
import toast from "react-hot-toast";
import {
    FaEdit,
    FaFilter,
    FaTrash,
    FaTimes,
    FaSearch,
    FaLongArrowAltLeft,
    FaPlus,
    FaBoxes
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";
import type { TipoEquipo } from "~/types/tipoEquipo";

type Item = Equipo | Insumo;

interface Props {
    tipos: TipoEquipo[];
    loading: boolean;
    onEdit: (item: Item) => void;
    onDelete: (id: number, tipo: ItemTipo) => void;
}

export default function ItemList({
    tipos,
    loading,
    onEdit,
    onDelete
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

   function isEquipo(item: Item): item is Equipo {
    return (item as Equipo).numero_serie !== undefined && (item as Equipo).numero_serie !== null;
}


    const fetchItems = async () => {
        try {
            const res = await getItems({
                ...filters,
                tipo: 'todos'
            });
            setItems(Array.isArray(res.data) ? res.data : []);
            setTotal(res.total);
            setLastPage(res.last_page);
        } catch (error) {
            toast.error("Error al cargar los items");
            console.error("Error fetching items:", error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [filters]);

    const getTipoNombre = (id: number) => {
        const tipo = tipos.find((t) => t.id === id);
        return tipo ? tipo.nombre : "Desconocido";
    };

    const handleImageClick = (imageUrl: string, itemName: string) => {
        setSelectedItemImage({
            imageUrl,
            name: itemName
        });
        setShowImageModal(true);
    };

    const confirmarEliminacion = (id: number, name: string, tipo: ItemTipo) => {
        const toastId = `delete-confirmation-${id}`;
        toast.dismiss();

        toast(
            (t) => (
                <div>
                    <p>¿Seguro que deseas eliminar el {tipo} <strong>{name}</strong>?</p>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                                onDelete(id, tipo);
                                toast.dismiss(t.id);
                                toast.success(`${tipo === 'equipo' ? 'Equipo' : 'Insumo'} "${name}" eliminado`, { id: toastId });
                                fetchItems();
                            }}
                        >
                            Sí, eliminar
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
        navigate("/");
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




    return (
        <div className="table-responsive rounded shadow p-3 mt-4">
            <Modal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                centered
                size="lg"
            >
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

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                    <FaLongArrowAltLeft
                        onClick={handleBack}
                        title="Regresar"
                        style={{
                            cursor: 'pointer',
                            fontSize: '2rem',
                        }}
                    />
                    <h2 className="fw-bold m-0">Inventario</h2>
                </div>

                <div className="d-flex align-items-center gap-2 ms-md-0 ms-auto">
                    <Button
                        variant="primary"
                        className="d-flex align-items-center gap-2"
                        onClick={() => navigate('/crearItem')}
                    >
                        <FaPlus />
                        Crear Nuevo Item
                    </Button>
                </div>
            </div>

            <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
                <div className="d-flex flex-grow-1">
                    <InputGroup className="flex-grow-1">
                        <InputGroup.Text>
                            <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Buscar por detalles, número de serie, etc."
                            value={filters.search || ""}
                            onChange={(e) => handleFilterUpdate("search", e.target.value)}
                        />
                        {filters.search && (
                            <Button
                                variant="outline-secondary"
                                onClick={() => handleFilterUpdate("search", "")}
                            >
                                <FaTimes />
                            </Button>
                        )}
                    </InputGroup>
                </div>

                <Button
                    variant="outline-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    className="d-flex align-items-center gap-2 flex-shrink-0 text-nowrap align-self-end align-self-md-center w-auto"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
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
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Tipo de equipo</Form.Label>
                                <Form.Select
                                    value={filters.tipoEquipoId || ""}
                                    onChange={(e) =>
                                        handleFilterUpdate(
                                            "tipoEquipoId",
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                >
                                    <option value="">Todos</option>
                                    {tipos.map((tipo) => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    value={filters.estadoId || ""}
                                    onChange={(e) =>
                                        handleFilterUpdate(
                                            "estadoId",
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                >
                                    <option value="">Todos</option>
                                    <option value="1">Disponible</option>
                                    <option value="2">En mantenimiento</option>
                                    <option value="3">Dañado</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="col-12">
                            <Button
                                variant="outline-danger"
                                onClick={resetFilters}
                                className="w-100"
                            >
                                <FaTimes className="me-2" />
                                Limpiar filtros
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle text-center">
                            <thead className="table-dark">
                                <tr>
                                    <th className="rounded-top-start">Tipo</th>
                                    <th>Tipo Equipo</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Estado</th>
                                    <th>N° Serie</th>
                                    <th>Cantidad</th>
                                    <th>Detalles</th>
                                    <th>Imagen</th>
                                    <th className="rounded-top-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ? (
                                    items.map((item) => {
                                        const isEquipoItem = isEquipo(item);
                                        const modeloNombre = item.modelo?.nombre || 'N/A';

                                        return (
                                            <tr key={item.id}>
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
                                                <td>{isEquipoItem ? item.numero_serie : '-'}</td>

                                                <td>{item.cantidad}</td>
                                                <td>{item.detalles || 'N/A'}</td>
                                                <td>
                                                    {item.imagen_url ? (
                                                        <img
                                                            src={item.imagen_url}
                                                            alt={item.detalles || 'Item'}
                                                            style={{
                                                                width: "60px",
                                                                height: "60px",
                                                                objectFit: "cover",
                                                                borderRadius: "8px",
                                                                cursor: "pointer"
                                                            }}
                                                            onClick={() => {
                                                                if (item.imagen_url) {
                                                                    handleImageClick(item.imagen_url, item.detalles || 'Item');
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">Sin imagen</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <Button
                                                            variant="outline-primary"
                                                            className="rounded-circle"
                                                            title={`Editar ${item.tipo}`}
                                                            style={{
                                                                width: "44px",
                                                                height: "44px",
                                                                transition: "transform 0.2s ease-in-out"
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
                                                        <Button
                                                            variant="outline-danger"
                                                            className="rounded-circle"
                                                            title={`Eliminar ${item.tipo}`}
                                                            style={{
                                                                width: "44px",
                                                                height: "44px",
                                                                transition: "transform 0.2s ease-in-out"
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
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-muted text-center">
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