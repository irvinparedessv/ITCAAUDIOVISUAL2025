import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { Button, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import api from "~/api/axios";

interface Option {
    value: number;
    label: string;
}

export default function ModeloAccesoriosForm() {
    const { id } = useParams();
    const [insumos, setInsumos] = useState<Option[]>([]);
    const [selected, setSelected] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [insumosRes, accesoriosRes] = await Promise.all([
                    api.get("/modelos/insumos/listar"),
                    api.get(`/modelos/${id}/accesorios`),
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
    }, [id]);

    const handleSave = async () => {
        try {
            setSaving(true);

            await api.post("/modelo-accesorios", {
                modelo_equipo_id: id,
                modelo_insumo_ids: selected.map((s) => s.value),
            });

            toast.success("Asociaciones guardadas correctamente");
            // Espera un poco para que el toast se vea antes de redirigir
            setTimeout(() => {
                navigate("/inventario");
            }, 1200);
        } catch (error: any) {
            toast.error(
                error.response?.data?.error || "Error al guardar las asociaciones"
            );
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando datos...</p>
      </div>
    );
  }

    return (
        <div className="p-4 shadow rounded" style={{ maxWidth: "600px" }}>
            <h3 className="mb-4">Asociar Insumos al Equipo</h3>

            <div className="mb-3">
                <label className="form-label fw-bold">Insumos disponibles:</label>
                <Select
                    options={insumos}
                    isMulti
                    value={selected}
                    onChange={(options) => setSelected(options as Option[])}
                    placeholder="Selecciona insumos..."
                    noOptionsMessage={() => "No hay más insumos disponibles"}
                />
            </div>

            <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                    <>
                        <Spinner as="span" size="sm" animation="border" /> Guardando...
                    </>
                ) : (
                    "Guardar asociaciones"
                )}
            </Button>

        </div>
    );
}
