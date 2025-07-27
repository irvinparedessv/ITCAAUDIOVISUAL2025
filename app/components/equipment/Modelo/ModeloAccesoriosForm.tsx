import { useEffect, useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import Select from "react-select";
import toast from "react-hot-toast";
import api from "~/api/axios";

interface Option {
    value: number;
    label: string;
}

interface ModeloAccesoriosModalProps {
    show: boolean;
    onHide: () => void;
    modeloId: string | undefined;
    onSuccess?: () => void;
}

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
                    api.get(`/modelos/${modeloId}/accesorios`),
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

            if (onSuccess) {
                onSuccess();
            }

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
            <Modal.Header closeButton>
                <Modal.Title>Asociar Insumos al Equipo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="d-flex flex-column align-items-center my-3">
                        <Spinner animation="border" role="status" />
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
                                onChange={(options) => setSelected(options as Option[])}
                                placeholder="Selecciona insumos..."
                                noOptionsMessage={() => "No hay más insumos disponibles"}
                                className="react-select-container"
                                classNamePrefix="react-select"
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
