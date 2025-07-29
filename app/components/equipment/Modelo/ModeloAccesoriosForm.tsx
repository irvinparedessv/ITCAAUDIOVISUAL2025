import { useEffect, useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import Select, { components } from "react-select";
import toast from "react-hot-toast";
import api from "~/api/axios";

interface Option {
    value: number;
    label: string;
    bloqueado?: boolean;
}

interface ModeloAccesoriosModalProps {
    show: boolean;
    onHide: () => void;
    modeloId: string | undefined;
    onSuccess?: () => void;
}

// Componente para desactivar la X de los insumos bloqueados
const MultiValueRemove = (props: any) => {
    if (props.data.bloqueado) {
        return null; // Oculta la X
    }
    return <components.MultiValueRemove {...props} />;
};

export default function ModeloAccesoriosModal({
    show,
    onHide,
    modeloId,
    onSuccess,
}: ModeloAccesoriosModalProps) {
    const [insumos, setInsumos] = useState<Option[]>([]);
    const [selected, setSelected] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!modeloId || !show) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const [insumosRes, accesoriosRes] = await Promise.all([
                    api.get("/modelos/insumos/listar"),
                    api.get(`/modelos/${modeloId}/accesorios`), // <- debe incluir campo "bloqueado"
                ]);

                setInsumos(
                    insumosRes.data.map((insumo: any) => ({
                        value: insumo.id,
                        label: `${insumo.nombre} (${insumo.nombre_marca || "Sin marca"})`,
                    }))
                );

                setSelected(
                    accesoriosRes.data.map((acc: any) => ({
                        value: acc.id,
                        label: `${acc.nombre} (${acc.nombre_marca || "Sin marca"})`,
                        bloqueado: acc.bloqueado || false,
                    }))
                );
            } catch (error) {
                toast.error("Error al cargar los datos");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [modeloId, show]);

    const handleSave = async () => {
        try {
            setSaving(true);

            await api.post("/modelo-accesorios", {
                modelo_equipo_id: modeloId,
                modelo_insumo_ids: selected.map((s) => s.value),
            });

            toast.success("Asociaciones guardadas correctamente");

            if (onSuccess) onSuccess();

            onHide();
        } catch (error: any) {
            toast.error(
                error.response?.data?.error || "Error al guardar las asociaciones"
            );
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header
                className="text-white py-3"
                style={{ backgroundColor: "#b1291d" }}
                closeButton
            >
                <Modal.Title>Asociar Insumos al Equipo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="d-flex flex-column align-items-center my-3">
                        <Spinner animation="border" role="status" variant="primary" />
                        <p className="mt-3 text-muted">Cargando datos...</p>
                    </div>
                ) : (
                    <div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Insumos disponibles:</label>
                            <Select
                                options={insumos}
                                isMulti
                                value={selected}
                                onChange={(options) => {
                                    const nuevos = (options ?? []).filter((opt) => !opt.bloqueado);
                                    const bloqueados = selected.filter((opt) => opt.bloqueado);
                                    setSelected([...bloqueados, ...nuevos]);
                                }}
                                placeholder="Selecciona insumos..."
                                noOptionsMessage={() => "No hay más insumos disponibles"}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                components={{ MultiValueRemove }}
                            />
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? (
                        <>
                            <Spinner as="span" size="sm" animation="border" /> Guardando...
                        </>
                    ) : (
                        "Guardar asociaciones"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
