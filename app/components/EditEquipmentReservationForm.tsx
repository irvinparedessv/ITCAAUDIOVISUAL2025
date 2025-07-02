import { useEffect, useState, useCallback } from "react";
import Select, { type SingleValue, type MultiValue } from "react-select";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useDropzone } from "react-dropzone";
import {
    FaSave,
    FaTrash,
    FaCalendarAlt,
    FaClock,
    FaBoxes,
    FaSchool,
    FaBroom,
    FaUpload,
    FaUser,
    FaLongArrowAltLeft,
} from "react-icons/fa";
import { useAuth } from "../hooks/AuthContext";
import { formatTo12h, timeOptions } from "~/utils/time";
import { Role } from "~/types/roles";

type OptionType = { value: number | string; label: string };
type EquipmentOption = OptionType & {
    tipoEquipoId?: number;
    available?: boolean;
};

type FormDataType = {
    date: string;
    startTime: string;
    endTime: string;
    tipoReserva: SingleValue<OptionType>;
    equipment: MultiValue<EquipmentOption>;
    aula: SingleValue<OptionType>;
};

export default function EditEquipmentReservationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState<FormDataType>({
        date: "",
        startTime: "",
        endTime: "",
        tipoReserva: null,
        equipment: [],
        aula: null,
    });

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [tipoReservaOptions, setTipoReservaOptions] = useState<OptionType[]>([]);
    const [allEquipmentOptions, setAllEquipmentOptions] = useState<EquipmentOption[]>([]);
    const [availableEquipmentOptions, setAvailableEquipmentOptions] = useState<EquipmentOption[]>([]);
    const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingEquipments, setLoadingEquipments] = useState(false);
    const [loadingAulas, setLoadingAulas] = useState(true);
    const [loadingTipoReserva, setLoadingTipoReserva] = useState(true);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [prestamistaOptions, setPrestamistaOptions] = useState<OptionType[]>([]);
    const [selectedPrestamista, setSelectedPrestamista] = useState<SingleValue<OptionType>>(null);
    const [originalPrestamista, setOriginalPrestamista] = useState<OptionType | null>(null);
    const [availabilityChecked, setAvailabilityChecked] = useState(false);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);

    const isDateTimeComplete = formData.date && formData.startTime && formData.endTime;
    const isTodaySelected = formData.date === new Date().toISOString().split("T")[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 6);

    const cleanTime = (time: string) => time?.slice(0, 5) || "";

    const handleBack = () => {
        navigate(-1); // Regresa a la página anterior
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: useCallback((acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;
            const validTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            if (!validTypes.includes(file.type)) {
                toast.error("Solo se permiten archivos PDF o Word");
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                toast.error("El archivo no puede ser mayor a 5MB");
                return;
            }

            setUploadedFile(file);
        }, []),
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
    });

    // 1) Cargar la reserva por ID SOLO cuando cambia 'id'
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const res = await api.get(`/reserva-id/${id}`);
                const reserva = res.data;

                const formattedDate = reserva.fecha_reserva.split(" ")[0];
                const startTime = cleanTime(reserva.fecha_reserva.split(" ")[1]);
                const endTime = cleanTime(reserva.fecha_entrega.split(" ")[1]);

                // Prestamista info
                const prestamista = {
                    value: reserva.user_id,
                    label: `${reserva.user.first_name} ${reserva.user.last_name} (${reserva.user.email})`
                };
                setSelectedPrestamista(prestamista);
                setOriginalPrestamista(prestamista);

                setFormData({
                    date: formattedDate,
                    startTime,
                    endTime,
                    tipoReserva: {
                        value: reserva.tipo_reserva_id,
                        label: reserva.tipo_reserva?.nombre || "",
                    },
                    aula: {
                        value: reserva.aula,
                        label: reserva.aula,
                    },
                    equipment: reserva.equipos.map((eq: any) => ({
                        value: eq.id,
                        label: eq.nombre,
                        tipoEquipoId: eq.tipo_equipo_id,
                    })),
                });

                if (reserva.documento_url) {
                    setDocumentUrl(reserva.documento_url);
                }
            } catch (err) {
                console.error("Error cargando la reserva:", err);
                toast.error("Error cargando la reserva");
            }
        };

        fetchData();
    }, [id]);

    // 2) Cargar tipos de reserva, aulas y prestamistas SOLO cuando cambia 'user'
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [tipoRes, aulasRes, prestamistasRes] = await Promise.all([
                    api.get("/tipo-reservas"),
                    api.get("/aulasEquipos"),
                    user?.role === Role.Administrador || user?.role === Role.Encargado
                        ? api.get('/usuarios/rol/Prestamista')
                        : Promise.resolve({ data: [] })
                ]);

                setTipoReservaOptions(
                    tipoRes.data.map((t: any) => ({ value: t.id, label: t.nombre }))
                );

                setAulaOptions(
                    aulasRes.data.map((a: any) => ({ value: a.name, label: a.name }))
                );

                setPrestamistaOptions(
                    prestamistasRes.data.map((u: any) => ({
                        value: u.id,
                        label: `${u.first_name} ${u.last_name} (${u.email})`
                    }))
                );
            } catch (err) {
                toast.error("Error cargando opciones");
            } finally {
                setLoadingTipoReserva(false);
                setLoadingAulas(false);
            }
        };

        if (user) fetchOptions();
    }, [user]);

    // 3) Cargar equipos según tipo de reserva SOLO cuando cambia 'tipoReserva'
    useEffect(() => {
        if (!formData.tipoReserva?.value) {
            setAvailableEquipmentOptions([]);
            return;
        }

        const fetchEquipmentsByTipoReserva = async () => {
            try {
                if (!formData.tipoReserva?.value) {
                    // Si no hay tipoReserva, no haces nada
                    setAvailableEquipmentOptions([]);
                    setAllEquipmentOptions([]);
                    return;
                }

                setLoadingEquipments(true);

                const eqRes = await api.get(`/equiposPorTipo/${formData.tipoReserva.value}`);
                const options = eqRes.data.map((e: any) => ({
                    value: e.id,
                    label: e.nombre,
                    tipoEquipoId: e.tipo_equipo_id,
                }));

                setAllEquipmentOptions(options);

                if (isDateTimeComplete) {
                    setAvailableEquipmentOptions([]);
                    await checkEquipmentAvailability(options);
                } else {
                    setAvailableEquipmentOptions(options);
                }
            } catch (err) {
                console.error("Error cargando equipos:", err);
                toast.error("Error cargando equipos");
            } finally {
                setLoadingEquipments(false);
            }
        };


        fetchEquipmentsByTipoReserva();
    }, [formData.tipoReserva?.value, isDateTimeComplete]);

    const checkEquipmentAvailability = async (equipments: EquipmentOption[]) => {
        try {
            setCheckingAvailability(true);

            const availabilityChecks = equipments.map(async (equipo) => {
                try {
                    const response = await api.get(`/equipos/${equipo.value}/disponibilidad`, {
                        params: {
                            fecha: formData.date,
                            startTime: formData.startTime,
                            endTime: formData.endTime,
                            excludeReservationId: id // Excluir la reserva actual al verificar disponibilidad
                        },
                    });

                    return {
                        ...equipo,
                        available: response.data.disponibilidad.cantidad_disponible > 0,
                    };
                } catch (error) {
                    console.error(`Error verificando disponibilidad para equipo ${equipo.value}`, error);
                    return {
                        ...equipo,
                        available: false,
                    };
                } finally {
                    setCheckingAvailability(false);
                    setAvailabilityChecked(true); // ⬅️ Esto
                }
            });

            const results = await Promise.all(availabilityChecks);
            // Obtener los IDs de los equipos originalmente seleccionados
            const selectedIds = formData.equipment.map((eq) => eq.value);

            // Incluir los equipos seleccionados aunque no estén disponibles
            const availableOptions = results.filter(
                (equipo) => equipo.available || selectedIds.includes(equipo.value)
            );

            setAvailableEquipmentOptions(availableOptions);


            // Mantener equipos seleccionados incluso si no están disponibles (porque ya estaban reservados)
            const currentSelected = formData.equipment.map(eq => {
                const available = availableOptions.find(opt => opt.value === eq.value);
                return {
                    ...eq,
                    available: available ? true : false
                };
            });

            setFormData(prev => ({ ...prev, equipment: currentSelected }));

        } catch (error) {
            console.error("Error verificando disponibilidad:", error);
            toast.error("Error al verificar disponibilidad de equipos");
            setAvailableEquipmentOptions(equipments);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleClear = () => {
        navigate("/reservations");
    };

    const selectedTipoIds = formData.equipment.map(eq => eq.tipoEquipoId);

    // Solo mostrar opciones de equipos cuyo tipo aún no fue seleccionado
    const filteredAvailableEquipmentOptions = availableEquipmentOptions.filter(
        (eq) => !selectedTipoIds.includes(eq.tipoEquipoId) ||
            formData.equipment.some(selected => selected.value === eq.value)
    );


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Usuario no autenticado");
            return;
        }

        // Validación general
        if (
            !formData.date ||
            !formData.startTime ||
            !formData.endTime ||
            !formData.tipoReserva?.value ||
            !formData.aula?.value ||
            formData.equipment.length === 0
        ) {
            toast.error("Por favor completa todos los campos obligatorios");
            return;
        }

        // Validar roles para cambiar prestamista
        if (
            (user.role !== Role.Administrador && user.role !== Role.Encargado) &&
            selectedPrestamista?.value !== originalPrestamista?.value
        ) {
            toast.error("No puedes cambiar el prestamista de esta reserva");
            return;
        }

        // Validar documento si es evento
        if (formData.tipoReserva?.label === "Eventos" && !uploadedFile && !originalPrestamista) {
            toast.error("Debe subir el documento del evento.");
            return;
        }

        // Validar horas
        const startHourMin = parseInt(formData.startTime.split(":")[0]) * 60 +
            parseInt(formData.startTime.split(":")[1]);
        const endHourMin = parseInt(formData.endTime.split(":")[0]) * 60 +
            parseInt(formData.endTime.split(":")[1]);

        if (endHourMin <= startHourMin) {
            toast.error("La hora de entrega debe ser posterior a la hora de inicio");
            return;
        }

        try {
            setLoading(true);

            // ⚡️ Si hay archivo, usar FormData
            if (uploadedFile) {
                const formPayload = new FormData();
                formPayload.append("_method", "PUT");
                formPayload.append("fecha_reserva", formData.date);
                formPayload.append("startTime", formData.startTime);
                formPayload.append("endTime", formData.endTime);
                formPayload.append("tipo_reserva_id", formData.tipoReserva?.value.toString() || "");
                formPayload.append("aula", formData.aula?.value.toString() || "");

                if (selectedPrestamista) {
                    formPayload.append("user_id", selectedPrestamista.value.toString());
                }

                formData.equipment.forEach((eq, index) => {
                    formPayload.append(`equipo[${index}][id]`, eq.value.toString());
                    formPayload.append(`equipo[${index}][cantidad]`, "1");
                });

                formPayload.append("documento_evento", uploadedFile);

                await api.post(`/reservas-equipo/${id}`, formPayload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                // ✅ Si NO hay archivo, usar JSON normal
                const payload = {
                    aula: formData.aula?.value,
                    equipo: formData.equipment.map((eq) => ({
                        id: eq.value,
                        cantidad: 1,
                    })),
                };

                await api.put(`/reservas-equipo/${id}`, payload);
            }

            toast.success("Reserva actualizada correctamente");
            navigate("/reservations");
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || "Error actualizando la reserva. Intenta nuevamente.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container position-relative">
            {/* Flecha de regresar en esquina superior izquierda */}
            <FaLongArrowAltLeft
                onClick={handleBack}
                title="Regresar"
                style={{
                    position: 'absolute',
                    top: '25px',
                    left: '30px',
                    cursor: 'pointer',
                    fontSize: '2rem',
                    zIndex: 10
                }}
            />
            <h2 className="mb-4 text-center fw-bold">Editar Reserva</h2>
            <form onSubmit={handleSubmit}>
                {/* Fecha */}
                <div className="mb-4">
                    <label className="form-label d-flex align-items-center">
                        <FaCalendarAlt className="me-2" /> Fecha
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) => {
                            setFormData(prev => ({
                                ...prev,
                                date: e.target.value,
                                startTime: "",
                                endTime: "",
                                tipoReserva: null,
                                equipment: [],
                                aula: null
                            }));
                            setAvailableEquipmentOptions([]);
                        }}
                        min={today.toISOString().split("T")[0]}
                        max={maxDate.toISOString().split("T")[0]}
                        disabled={true}
                    />
                    {isTodaySelected && (
                        <small className="form-text text-muted">
                            La reservación debe hacerse con al menos 30 minutos de anticipación.
                        </small>
                    )}
                </div>

                {/* Horas */}
                <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                        <label className="form-label d-flex align-items-center">
                            <FaClock className="me-2" /> Hora de inicio
                        </label>
                        <select className="form-select" value={formData.startTime} disabled>
                            {formData.startTime ? (
                                <option value={formData.startTime}>
                                    {formatTo12h(formData.startTime)}
                                </option>
                            ) : (
                                <option value="">--:--</option>
                            )}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label d-flex align-items-center">
                            <FaClock className="me-2" /> Hora de entrega
                        </label>
                        <select className="form-select" value={formData.endTime} disabled>
                            {formData.endTime ? (
                                <option value={formData.endTime}>
                                    {formatTo12h(formData.endTime)}
                                </option>
                            ) : (
                                <option value="">--:--</option>
                            )}
                        </select>

                    </div>
                </div>

                {/* USUARIO */}
                {(user?.role === Role.Administrador || user?.role === Role.Encargado) && (
                    <div className="mb-4">
                        <label className="form-label d-flex align-items-center">
                            <FaUser className="me-2" /> Usuario Prestamista
                        </label>
                        <Select
                            options={prestamistaOptions}
                            value={selectedPrestamista}
                            onChange={setSelectedPrestamista}
                            placeholder="Selecciona un usuario"
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isDisabled={true}
                        />
                    </div>
                )}

                {/* TIPO RESERVA */}
                <div className="mb-4">
                    <label className="form-label d-flex align-items-center">
                        <FaCalendarAlt className="me-2" /> Tipo de Reserva
                    </label>
                    {loadingTipoReserva ? (
                        <div className="d-flex justify-content-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : (
                        <Select
                            options={tipoReservaOptions}
                            value={formData.tipoReserva}
                            onChange={(selected) => setFormData(prev => ({
                                ...prev,
                                tipoReserva: selected,
                                equipment: []
                            }))}
                            placeholder="Selecciona el tipo de reserva"
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isDisabled={true}
                        />
                    )}
                </div>

                {/* Documento evento */}
                {formData.tipoReserva?.label === "Eventos" && (
                    <div className="mb-4">
                        <label className="form-label d-flex align-items-center">
                            <FaSave className="me-2" /> Documento del Evento (PDF o Word)
                        </label>
                        {uploadedFile ? (
                            <div className="mt-2">
                                <div className="d-flex align-items-center justify-content-between p-3 rounded border">
                                    <div>
                                        <strong>Archivo seleccionado:</strong> {uploadedFile.name}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUploadedFile(null)}
                                        className="btn btn-outline-danger btn-sm"
                                    >
                                        <FaTrash className="me-1" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ) : documentUrl ? (
                            <div className="mt-2">
                                <div className="d-flex align-items-center justify-content-between p-3 rounded border">
                                    <div>
                                        <strong>Documento actual:</strong>{" "}
                                        <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                                            Ver documento
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDocumentUrl(null);
                                        }}
                                        className="btn btn-outline-danger btn-sm"
                                    >
                                        <FaTrash className="me-1" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                {...getRootProps()}
                                className={`border rounded p-4 text-center cursor-pointer ${isDragActive ? "border-primary bg-light" : "border-secondary-subtle"
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="d-flex flex-column align-items-center justify-content-center">
                                    <FaUpload className="text-muted mb-2" size={24} />
                                    {isDragActive ? (
                                        <p className="text-primary mb-0">Suelta el documento aquí...</p>
                                    ) : (
                                        <>
                                            <p className="mb-1">Arrastra y suelta un documento aquí, o haz clic para seleccionar</p>
                                            <p className="text-muted small mb-0">
                                                Formatos: PDF, DOC, DOCX (Máx. 5MB)
                                            </p>
                                            {originalPrestamista && (
                                                <p className="text-info small mt-2">
                                                    Ya hay un documento cargado para esta reserva. Subir uno nuevo lo reemplazará.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Equipos */}
                <div className="mb-4">
                    <label className="form-label d-flex align-items-center">
                        <FaBoxes className="me-2" />
                        <span className="me-2">Equipos</span>
                        {!availabilityChecked && (
                            <small className="form-text text-muted ms-2">
                                Verificando disponibilidad de equipos...
                            </small>
                        )}
                        {checkingAvailability && (
                            <span className="ms-2 spinner-border spinner-border-sm"></span>
                        )}
                    </label>
                    {loadingEquipments ? (
                        <div className="d-flex justify-content-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : (
                        <Select
                            isMulti
                            options={filteredAvailableEquipmentOptions} // <== AQUÍ
                            value={formData.equipment}
                            onChange={(selected) => {
                                const selectedArray = selected || [];

                                const enriched = selectedArray.map((s) => {
                                    const full = availableEquipmentOptions.find((e) => e.value === s.value);
                                    return {
                                        ...s,
                                        tipoEquipoId: full?.tipoEquipoId,
                                        available: full?.available,
                                    };
                                });

                                // Permitir solo un equipo por tipo
                                const uniqueByTipo = new Map<number | undefined, EquipmentOption>();
                                enriched.forEach((item) => {
                                    uniqueByTipo.set(item.tipoEquipoId, item); // el último reemplaza al anterior
                                });

                                setFormData((prev) => ({
                                    ...prev,
                                    equipment: Array.from(uniqueByTipo.values()),
                                }));
                            }}
                            placeholder={
                                !isDateTimeComplete
                                    ? "Selecciona fecha y hora primero"
                                    : !formData.tipoReserva
                                        ? "Selecciona un tipo de reserva primero"
                                        : checkingAvailability
                                            ? "Verificando disponibilidad..."
                                            : availableEquipmentOptions.length === 0
                                                ? "No hay equipos disponibles para este tipo"
                                                : "Selecciona equipos disponibles"
                            }
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isDisabled={
                                !formData.tipoReserva ||
                                checkingAvailability ||
                                !isDateTimeComplete ||
                                !availabilityChecked
                            }
                            noOptionsMessage={() => "No hay opciones disponibles"}
                        />

                    )}
                </div>

                {/* Aula */}
                <div className="mb-4">
                    <label className="form-label d-flex align-items-center">
                        <FaSchool className="me-2" /> Aula
                    </label>
                    {loadingAulas ? (
                        <div className="d-flex justify-content-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : (
                        <Select
                            options={aulaOptions}
                            value={formData.aula}
                            onChange={(selected) => setFormData(prev => ({
                                ...prev,
                                aula: selected
                            }))}
                            placeholder="Selecciona aula"
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isDisabled={
                                !isDateTimeComplete ||
                                !formData.tipoReserva ||
                                formData.equipment.length === 0
                            }
                        />
                    )}
                </div>

                <div className="form-actions d-flex justify-content-between">
                    <button
                        type="button"
                        className="btn secondary-btn"
                        onClick={handleClear}
                    >
                        <FaBroom className="me-2" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn primary-btn"
                        disabled={
                            loading ||
                            checkingAvailability ||
                            !isDateTimeComplete ||
                            !formData.tipoReserva ||
                            formData.equipment.length === 0 ||
                            !formData.aula
                        }
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <FaSave className="me-2" />
                                Actualizar Reserva
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}