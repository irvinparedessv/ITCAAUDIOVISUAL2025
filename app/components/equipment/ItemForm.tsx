import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { FaSave, FaTimes, FaBroom, FaUpload, FaTrash, FaLongArrowAltLeft, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { Marca, Modelo, Estado } from "../../types/item";
import type { TipoEquipo } from "~/types/tipoEquipo";
import type { TipoReserva } from "~/types/tipoReserva";
import api from "../../api/axios";
import MarcaModal from "./MarcaModal";
import ModeloModal from "./Modelo/ModeloModal";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import { useTheme } from "~/hooks/ThemeContext";
import { getModelosByMarca, getModelosByMarcaYTipo, getModelosByTipo, searchMarcas, searchTipoEquipo } from "~/services/itemService";

interface CaracteristicaForm {
  id: number;
  nombre: string;
  tipo_dato: string;
  valor: string;
}

export interface Props {
  initialValues?: any;
  loading: boolean;
  tiposEquipo: TipoEquipo[];
  tipoReservas: TipoReserva[];
  marcas: Marca[];
  modelos: Modelo[];
  estados: Estado[];
  onSubmit: (data: FormData) => Promise<void>;
  isEditing?: boolean;
}

export default function ItemForm({
  initialValues = null,
  loading,
  tiposEquipo,
  tipoReservas,
  marcas,
  modelos,
  estados,
  onSubmit,
  isEditing = false,
}: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo_equipo_id: "",
    marca_id: "",
    modelo_id: "",
    estado_id: "",
    tipo_reserva_id: "",
    detalles: "",
    fecha_adquisicion: "",
    numero_serie: "",
    vida_util: "",
    reposo: "",
    cantidad: "",
    imagen: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filteredModelos, setFilteredModelos] = useState<Modelo[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaForm[]>([]);
  const [loadingCaracteristicas, setLoadingCaracteristicas] = useState(false);
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showModeloModal, setShowModeloModal] = useState(false);


  // Determina si el tipo seleccionado es insumo
  const esInsumo = (() => {
    const tipo = tiposEquipo.find((t) => t.id === Number(form.tipo_equipo_id));
    return tipo?.categoria_id === 2;
  })();

  // Filtrar los estados para mostrar solo Disponible (1) y Daniado (2)
  const filteredEstados = estados.filter(e => e.id === 1 || e.id === 4);

  // 1. Estado para controlar el bloqueo - inicializado como true si estamos en modo creación
  const [bloquearEstado, setBloquearEstado] = useState(true);

  // 2. Efecto para manejar el bloqueo diferentemente en creación vs edición
  useEffect(() => {
    if (isEditing) {
      // En edición: bloquear por 2.2 segundos
      const timer = setTimeout(() => {
        setBloquearEstado(false);
      }, 2200);

      return () => clearTimeout(timer);
    } else {
      // En creación: mantener siempre bloqueado
      setBloquearEstado(true);
    }
  }, [isEditing]);

  // Inicialización del formulario
  useEffect(() => {
    if (initialValues) {
      //console.log('Initial values received:', initialValues);
      setForm(prev => ({
        ...prev,
        ...initialValues,
        imagen: null,
        cantidad: isEditing ? "" : initialValues.cantidad || "",

        numero_serie: initialValues.numero_serie || "",
        vida_util: initialValues.vida_util ? String(initialValues.vida_util) : "",
        reposo: initialValues.reposo ? String(initialValues.reposo) : "" // Cambiado aquí
      }));

      if (initialValues.caracteristicas) {
        setCaracteristicas(
          initialValues.caracteristicas.map((c: any) => ({
            id: c.caracteristica_id || c.id,
            nombre: c.nombre || c.caracteristica?.nombre,
            tipo_dato: c.tipo_dato || c.caracteristica?.tipo_dato,
            valor: c.valor?.toString() || ""
          }))
        );
      }
    }
    else if (!isEditing) {
      // Establecer estado "Disponible" por defecto en creación
      setForm(prev => ({
        ...prev,
        estado_id: "1" // ID del estado "Disponible"
      }));
    }
  }, [initialValues, isEditing]);

  // Filtrado de modelos por marca
  useEffect(() => {
    if (form.marca_id) {
      const filtrados = modelos.filter((m) => m.marca_id === Number(form.marca_id));
      setFilteredModelos(filtrados);
      if (!filtrados.some(m => m.id === Number(form.modelo_id))) {
        setForm(prev => ({ ...prev, modelo_id: "" }));
      }
    } else {
      setFilteredModelos([]);
      setForm(prev => ({ ...prev, modelo_id: "" }));
    }
  }, [form.marca_id, modelos, form.modelo_id]);

  // Carga de características (solo en modo creación)
  useEffect(() => {
    if (isEditing) return;

    const fetchCaracteristicas = async () => {
      if (form.tipo_equipo_id) {
        setLoadingCaracteristicas(true);
        try {
          const response = await api.get(`/tipo-equipos/${form.tipo_equipo_id}/caracteristicas`);
          setCaracteristicas(
            response.data.map((c: any) => ({
              id: c.id,
              nombre: c.nombre,
              tipo_dato: c.tipo_dato,
              valor: ""
            }))
          );
        } catch (error) {
          toast.error("Error al cargar características");
          console.error(error);
        } finally {
          setLoadingCaracteristicas(false);
        }
      } else {
        setCaracteristicas([]);
      }
    };

    fetchCaracteristicas();
  }, [form.tipo_equipo_id, isEditing]);

  const [modelosIniciales, setModelosIniciales] = useState<{ value: number, label: string }[]>([]);

  useEffect(() => {
    if (form.marca_id && form.tipo_equipo_id) {
      getModelosByMarcaYTipo(Number(form.marca_id), Number(form.tipo_equipo_id), undefined, true)
        .then(setModelosIniciales);
    } else {
      setModelosIniciales([]);
    }
  }, [form.marca_id, form.tipo_equipo_id]);



  // Dropzone para imágenes
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.type.match("image.*")) {
        toast.error("Solo se permiten archivos de imagen (JPEG, PNG, GIF)");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("La imagen no puede ser mayor a 5MB");
        return;
      }

      setForm((prev) => ({ ...prev, imagen: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif"] },
    maxFiles: 1,
    multiple: false,
  });

  const { darkMode } = useTheme();

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

  // Handlers
  const removeImage = () => {
    setForm((prev) => ({ ...prev, imagen: null }));
    setImagePreview(null);
  };

  const handleBack = () => navigate("/inventario");

  const handleClear = () => {
    setForm({
      tipo_equipo_id: "",
      marca_id: "",
      modelo_id: "",
      estado_id: "",
      tipo_reserva_id: "",
      detalles: "",
      fecha_adquisicion: "",
      numero_serie: "",
      vida_util: "",
      reposo: "",
      cantidad: "",
      imagen: null,
    });
    setImagePreview(null);
    setCaracteristicas([]);
  };

  const handleCaracteristicaChange = (id: number, valor: string) => {
    console.log("Cambiando característica", id, "a valor", valor);
    setCaracteristicas(prev =>
      prev.map(c => c.id === id ? { ...c, valor } : c)
    );
  };

  const handleAddMarca = async (nombre: string) => {
    const nombreNormalizado = nombre.trim().toLowerCase();
    if (!nombreNormalizado) return;

    const yaExiste = marcas.find(
      (m) => m.nombre.trim().toLowerCase() === nombreNormalizado
    );

    if (yaExiste) {
      setForm((prev) => ({
        ...prev,
        marca_id: String(yaExiste.id),
        modelo_id: "",
      }));
      setShowMarcaModal(false);
      toast.success("Marca ya existente seleccionada");
      return;
    }

    try {
      const response = await api.post("/marcas", { nombre: nombre.trim() });
      const nuevaMarca = response.data;
      marcas.push(nuevaMarca);

      setForm((prev) => ({
        ...prev,
        marca_id: String(nuevaMarca.id),
        modelo_id: "",
      }));
      setShowMarcaModal(false);
      toast.success("Marca agregada y seleccionada");
    } catch (error: any) {
      if (error.response?.status === 422 || error.response?.status === 409) {
        const existente = marcas.find(
          (m) => m.nombre.trim().toLowerCase() === nombreNormalizado
        );

        if (existente) {
          setForm((prev) => ({
            ...prev,
            marca_id: String(existente.id),
            modelo_id: "",
          }));
          setShowMarcaModal(false);
          toast.success("Marca ya existente seleccionada");
        } else {
          toast.error("Marca duplicada, pero no encontrada localmente");
        }
      } else {
        toast.error("Error al agregar marca");
      }
    }
  };

  const handleAddModelo = async (nombre: string, marca_id: number) => {
    const existente = modelos.find(
      (m) =>
        m.nombre.toLowerCase() === nombre.toLowerCase() &&
        String(m.marca_id) === String(marca_id)
    );

    if (existente) {
      setForm((prev) => ({
        ...prev,
        modelo_id: String(existente.id),
      }));
      setShowModeloModal(false);
      toast.success("Modelo ya existente seleccionado");
      return;
    }

    try {
      const response = await api.post("/modelos", { nombre, marca_id });
      const nuevoModelo = response.data;
      modelos.push(nuevoModelo);
      setForm((prev) => ({
        ...prev,
        modelo_id: String(nuevoModelo.id),
      }));
      setShowModeloModal(false);
      toast.success("Modelo agregado");
    } catch (error: any) {
      if (error.response?.status === 422 || error.response?.status === 409) {
        const existente = modelos.find(
          (m) =>
            m.nombre.toLowerCase() === nombre.toLowerCase() &&
            String(m.marca_id) === String(marca_id)
        );

        if (existente) {
          setForm((prev) => ({
            ...prev,
            modelo_id: String(existente.id),
          }));
          setShowModeloModal(false);
          toast.success("Modelo ya existente seleccionado");
        } else {
          toast.error("Modelo duplicado, pero no encontrado localmente");
        }
      } else {
        toast.error("Error al agregar modelo");
      }
    }
  };


  const loadMarcas = async (inputValue: string): Promise<Array<{ value: number; label: string }>> => {
    try {
      // 1. Obtener marcas con búsqueda
      const marcas = await searchMarcas(inputValue, inputValue ? 10 : 5);

      // 2. Validar y mapear la respuesta
      if (!Array.isArray(marcas)) {
        console.error("La respuesta no es un array:", marcas);
        throw new Error("Formato de respuesta inválido");
      }

      // 3. Mapear a formato para AsyncSelect
      return marcas.map((marca: Marca) => ({
        value: marca.id,
        label: marca.nombre
      }));

    } catch (error: any) {
      console.error("Error en loadMarcas:", {
        error,
        inputValue,
        backendError: error.response?.data
      });

      toast.error(error.response?.data?.message || "Error al cargar marcas");
      return []; // Retorna array vacío para que el select no falle
    }
  };

  interface BackendValidationError {
    message?: string;
    errors?: Record<string, string[]>;
  }

  interface BackendError extends Error {
    response?: {
      data?: BackendValidationError;
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();

    // Validación de campos requeridos
    if (!form.tipo_equipo_id) return toast.error("Seleccione un tipo de equipo");
    if (!form.tipo_reserva_id) return toast.error("Seleccione un tipo de reserva");
    if (!form.marca_id) return toast.error("Seleccione una marca");
    if (!form.modelo_id) return toast.error("Seleccione un modelo");
    if (!form.estado_id) return toast.error("Seleccione un estado");
    if (!form.detalles?.trim()) return toast.error("Ingrese los detalles");
    if (!form.fecha_adquisicion) return toast.error("Ingrese la fecha de adquisición");

    // Validaciones específicas por tipo
    if (esInsumo) {
      if (!isEditing) {
        if (!form.cantidad || Number(form.cantidad) <= 0) {
          return toast.error("La cantidad debe ser mayor a cero");
        }
        if (Number(form.cantidad) > 100) {
          return toast.error("La cantidad no puede ser mayor a 100");
        }
      }
    } else {
      if (!form.numero_serie?.trim()) {
        return toast.error("Ingrese el número de serie");
      }
      if (!form.vida_util || Number(form.vida_util) <= 0) {
        return toast.error("Ingrese una vida útil válida (mayor a 0 horas)");
      }
      if (Number(form.reposo) < 0) { // Cambiado aquí
        return toast.error("Ingrese un valor de reposo válido (≥ 0 minutos)");
      }
    }

    // Validación de características
    const caracteristicasInvalidas = caracteristicas.filter(
      c => !c.valor || c.valor.trim() === ""
    );

    if (caracteristicasInvalidas.length > 0) {
      return toast.error(
        `Complete las características: ${caracteristicasInvalidas.map(c => c.nombre).join(", ")}`
      );
    }

    // Confirmación para edición
    if (isEditing) {
      const toastId = `update-confirmation-${initialValues?.id || ''}`;

      toast.dismiss();

      const confirmation = await new Promise((resolve) => {
        toast(
          (t) => (
            <div>
              <p>¿Seguro que deseas actualizar este ítem?</p>
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    resolve(true);
                    toast.dismiss(t.id);
                  }}
                >
                  Sí, actualizar
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    resolve(false);
                    toast.dismiss(t.id);
                  }}
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
      });

      if (!confirmation) return;
    }

    try {
      const formData = new FormData();

      // Configuración básica
      formData.append("tipo", esInsumo ? "insumo" : "equipo");
      if (isEditing) formData.append("_method", "PUT");

      // Datos principales
      formData.append("tipo_equipo_id", form.tipo_equipo_id);
      formData.append("modelo_id", form.modelo_id);
      formData.append("estado_id", form.estado_id);
      formData.append("detalles", form.detalles);
      formData.append("fecha_adquisicion", form.fecha_adquisicion);
      formData.append("tipo_reserva_id", form.tipo_reserva_id);

      // Datos específicos por tipo
      if (esInsumo) {
        if (!isEditing || form.cantidad) {
          formData.append("cantidad", form.cantidad);
        }
      } else {
        formData.append("numero_serie", form.numero_serie);
        if (form.vida_util) {
          formData.append("vida_util", form.vida_util);
        }
        if (form.reposo) { // Cambiado aquí
          formData.append("reposo", form.reposo);
        }
      }

      // Características
      if (caracteristicas.length > 0) {
        formData.append(
          "caracteristicas",
          JSON.stringify(
            caracteristicas.map(c => ({
              caracteristica_id: c.id,
              valor: c.valor
            }))
          )
        );
      }

      // Imagen
      if (form.imagen) {
        formData.append("imagen", form.imagen);
      } else if (isEditing && !imagePreview && initialValues?.imagen_url) {
        formData.append("remove_image", "true");
      }

      // Enviar datos
      await onSubmit(formData);

      // Feedback al usuario
      toast.success(`Ítem ${isEditing ? 'actualizado' : 'creado'} correctamente`);

      // Reset solo para creación exitosa
      if (!isEditing) handleClear();

      // 👉 Navegación después del éxito
      navigate('/inventario');

    } catch (error) {
      console.error("Error en handleSubmit:", error);

      const backendError = error as BackendError;
      const responseData = backendError.response?.data;

      // 🔍 MOSTRAR EN CONSOLA PARA DEPURAR
      console.log("Respuesta del backend:", responseData);

      // 🟡 Si hay errores específicos del backend (por campo)
      if (responseData?.errors) {
        const errors = responseData.errors;

        // ✅ Mostrar todos los errores del backend como toasts
        Object.values(errors).forEach((messages) => {
          messages.forEach((msg: string) => toast.error(msg));
        });

        // 🛑 DETENER ejecución aquí para evitar mostrar mensaje general
        return;
      }

      // 🔴 Si no hay errores de validación, mostramos el mensaje general del backend
      const errorMessage =
        responseData?.message ||
        (error instanceof Error ? error.message : "Error desconocido");

      toast.error(`Error al ${isEditing ? "actualizar" : "crear"}: ${errorMessage}`);
    }


  };

  const getLocalDateString = () => {
    const now = new Date();
    // Ajustamos a la fecha local correcta
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  // Función para renderizar el mensaje "No editable" en modo edición
  const renderNotEditableMessage = () => {
    if (isEditing) {
      return <small className="text-muted d-block mt-1">Este campo no se puede editar</small>;
    }
    return null;
  };

  return (
    <div className="form-container position-relative">
      <div className="d-flex align-items-center gap-2 gap-md-3 mb-4">
        <FaLongArrowAltLeft onClick={handleBack} title="Regresar" style={{ cursor: "pointer", fontSize: "2rem" }} />
        <h2 className="fw-bold m-0">{isEditing ? 'Editar' : 'Crear Nuevo'} Ítem</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="tipo_equipo" className="form-label">
              Tipo de Equipo
            </label>
            <AsyncSelect
              id="tipo_equipo"
              loadOptions={searchTipoEquipo}
              defaultOptions
              cacheOptions
              placeholder="Buscar tipo..."
              noOptionsMessage={({ inputValue }) =>
                inputValue ? "No se encontraron resultados" : "Escribe para buscar"
              }
              loadingMessage={() => "Buscando..."}
              value={form.tipo_equipo_id ? {
                value: Number(form.tipo_equipo_id),
                label: tiposEquipo.find(t => t.id === Number(form.tipo_equipo_id))?.nombre || ''
              } : null}
              onChange={(selected) => {
                setForm({
                  ...form,
                  tipo_equipo_id: selected ? String(selected.value) : '',
                  marca_id: '', // Resetear marca al cambiar tipo
                  modelo_id: '', // Resetear modelo al cambiar tipo
                });
              }}
              isDisabled={loading || isEditing}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />

            {isEditing && renderNotEditableMessage()}
          </div>

          <div className="col-md-6">
            <label htmlFor="tipo_reserva" className="form-label">
              Tipo de Reserva
            </label>
            <Select
              id="tipo_reserva"
              options={tipoReservas.map(t => ({ value: t.id, label: t.nombre }))}
              value={tipoReservas.find(t => t.id === Number(form.tipo_reserva_id)) ?
                { value: Number(form.tipo_reserva_id), label: tipoReservas.find(t => t.id === Number(form.tipo_reserva_id))?.nombre || '' }
                : null}
              onChange={(selected) => setForm({ ...form, tipo_reserva_id: selected ? String(selected.value) : '' })}
              placeholder="Buscar tipo de reserva..."
              isDisabled={loading}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="marca" className="form-label">
              Marca
            </label>
            <div className="d-flex gap-2">
              <AsyncSelect
                id="marca"
                cacheOptions
                defaultOptions
                loadOptions={loadMarcas}
                value={
                  form.marca_id
                    ? {
                      value: Number(form.marca_id),
                      label:
                        marcas.find((m) => m.id === Number(form.marca_id))?.nombre || '',
                    }
                    : null
                }
                onChange={(selected) => {
                  setForm((prev) => ({
                    ...prev,
                    marca_id: selected ? String(selected.value) : '',
                    modelo_id: '', // Reset modelo al cambiar marca
                  }));
                }}
                placeholder={
                  !form.tipo_equipo_id
                    ? 'Selecciona un tipo de equipo primero'
                    : "Buscar marca..."
                }
                isDisabled={loading || isEditing || !form.tipo_equipo_id}
                styles={customSelectStyles}
                menuPortalTarget={document.body}
                className="flex-grow-1"
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? 'No se encontraron marcas' : 'Escribe para buscar...'
                }
                loadingMessage={() => 'Buscando marcas...'}
                components={{
                  IndicatorSeparator: null, // Elimina el separador si no lo necesitas
                }}
              />
              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowMarcaModal(true)}
                  style={{ height: '48px', width: '48px' }}
                  disabled={!form.tipo_equipo_id || isEditing}
                >
                  <FaPlus />
                </button>
              )}
            </div>
            {isEditing && renderNotEditableMessage()}
          </div>

          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="modelo" className="form-label">
              Modelo
            </label>
            <div className="d-flex gap-2">
              <AsyncSelect
                id="modelo"
                cacheOptions
                defaultOptions={modelosIniciales}
                loadOptions={async (inputValue) => {
                  if (!form.marca_id || !form.tipo_equipo_id) return [];
                  return await getModelosByMarcaYTipo(
                    Number(form.marca_id),
                    Number(form.tipo_equipo_id),
                    inputValue,
                    !inputValue // loadInitial=true cuando no hay inputValue
                  );
                }}
                value={
                  form.modelo_id
                    ? {
                      value: Number(form.modelo_id),
                      label:
                        filteredModelos.find((m) => m.id === Number(form.modelo_id))?.nombre || '',
                    }
                    : null
                }
                onChange={(selected) =>
                  setForm({ ...form, modelo_id: selected ? String(selected.value) : '' })
                }
                placeholder={
                  !form.tipo_equipo_id
                    ? 'Selecciona un tipo de equipo primero'
                    : !form.marca_id
                      ? 'Selecciona una marca primero'
                      : 'Buscar modelo...'
                }

                isDisabled={!form.marca_id || !form.tipo_equipo_id || isEditing}
                styles={customSelectStyles}
                menuPortalTarget={document.body}
                className="flex-grow-1"
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? 'No se encontraron modelos' : 'Cargando...'
                }
                loadingMessage={() => 'Buscando modelos...'}
                components={{
                  IndicatorSeparator: null,
                }}
              />
              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModeloModal(true)}
                  disabled={!form.marca_id || !form.tipo_equipo_id || isEditing}

                  style={{ height: '48px', width: '48px' }}
                >
                  <FaPlus />
                </button>
              )}
            </div>
            {isEditing && renderNotEditableMessage()}
          </div>


          <div className="col-md-4">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <Select
              id="estado"
              options={filteredEstados.map(e => ({ value: e.id, label: e.nombre }))}
              value={filteredEstados.find(e => e.id === Number(form.estado_id)) ?
                { value: Number(form.estado_id), label: filteredEstados.find(e => e.id === Number(form.estado_id))?.nombre || '' }
                : isEditing ? null : { value: 1, label: 'Disponible' }}
              onChange={(selected) => {
                if (!bloquearEstado) { // Solo permitir cambios si no está bloqueado
                  setForm({ ...form, estado_id: selected ? String(selected.value) : '' });
                }
              }}
              placeholder={isEditing ? (bloquearEstado ? "Cargando..." : "Seleccionar estado...") : "Disponible"}
              isDisabled={loading || bloquearEstado || !isEditing} // Bloqueado si: loading, bloquearEstado, o no es edición
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />
            {isEditing && bloquearEstado && (
              <small className="text-muted d-block mt-1">Cargando opciones, espere...</small>
            )}
            {!isEditing && (
              <small className="text-muted d-block mt-1">Este campo no se puede modificar</small>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="detalles" className="form-label">
            Detalles
          </label>
          <textarea
            id="detalles"
            className="form-control"
            rows={3}
            value={form.detalles}
            onChange={(e) => setForm({ ...form, detalles: e.target.value })}
            placeholder="Descripción detallada del ítem"
          />
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="fecha_adquisicion" className="form-label">
              Fecha de Adquisición
            </label>
            <input
              id="fecha_adquisicion"
              type="date"
              className="form-control"
              value={form.fecha_adquisicion}
              onChange={(e) => {
                const selectedDate = e.target.value;
                const today = getLocalDateString(); // Usamos nuestra función helper
                if (selectedDate <= today) {
                  setForm({ ...form, fecha_adquisicion: selectedDate });
                } else {
                  toast.error("No se pueden seleccionar fechas futuras");
                }
              }}
              max={getLocalDateString()} // Fecha máxima basada en hora local
            />
          </div>

          {form.tipo_equipo_id && (
            esInsumo ? (
              !isEditing && (
                <div className="col-md-6">
                  <label htmlFor="cantidad" className="form-label">
                    Cantidad
                  </label>
                  <input
                    id="cantidad"
                    type="number"
                    min={1}
                    max={10} // Máximo 100
                    className="form-control"
                    value={form.cantidad}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validar que no sea mayor a 100
                      if (value === "" || (Number(value) >= 1 && Number(value) <= 10)) {
                        setForm({ ...form, cantidad: value });
                      }
                    }}
                    placeholder="Cantidad disponible"
                  />
                  {isEditing && renderNotEditableMessage()}
                </div>
              )
            ) : (
              <>
                <div className="col-md-3">
                  <label htmlFor="numero_serie" className="form-label">
                    Número de Serie
                  </label>
                  <input
                    id="numero_serie"
                    type="text"
                    className="form-control"
                    value={form.numero_serie}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      setForm({ ...form, numero_serie: value });
                    }}
                    placeholder="Número de serie"
                    readOnly={isEditing}
                  />
                  {isEditing && renderNotEditableMessage()}
                </div>
                <div className="col-md-3">
                  <label htmlFor="vida_util" className="form-label">
                    Vida Útil (Horas)
                  </label>
                  <input
                    id="vida_util"
                    type="number"
                    min={0}
                    className="form-control"
                    value={form.vida_util}
                    onChange={(e) => setForm({ ...form, vida_util: e.target.value })}
                    placeholder="horas de vida útil"
                  />
                </div>
                <div className="col-md-3" style={{ paddingTop: '20px' }}>

                  <label htmlFor="reposo" className="form-label">
                    Reposo (Min)
                  </label>
                  <input
                    id="reposo"
                    type="number"
                    min={0}
                    className="form-control"
                    value={form.reposo}
                    onChange={(e) => setForm({ ...form, reposo: e.target.value })}
                    placeholder="minutos de reposo"
                  />
                  <small className="text-muted">Tiempo mínimo entre usos</small>
                </div>
              </>
            )
          )}
        </div>

        {caracteristicas.length > 0 && (
          <div className="mb-4">
            <h5 className="mb-3">Características del Equipo</h5>
            <div className="border rounded p-3">
              {caracteristicas.map((caracteristica) => (
                <div key={caracteristica.id} className="mb-3">
                  <label htmlFor={`caracteristica-${caracteristica.id}`} className="form-label">
                    {caracteristica.nombre}
                    <span className="badge bg-info ms-2">
                      {caracteristica.tipo_dato}
                    </span>
                  </label>

                  {caracteristica.tipo_dato === "boolean" ? (
                    <select
                      id={`caracteristica-${caracteristica.id}`}
                      className="form-select"
                      value={caracteristica.valor}
                      onChange={(e) => handleCaracteristicaChange(caracteristica.id, e.target.value)}
                      disabled={isEditing}
                    >
                      <option value="">Seleccione...</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      id={`caracteristica-${caracteristica.id}`}
                      type={
                        caracteristica.tipo_dato === "integer"
                          ? "number"
                          : caracteristica.tipo_dato === "decimal"
                            ? "number"
                            : "text"
                      }
                      step={caracteristica.tipo_dato === "decimal" ? "0.01" : undefined}
                      className="form-control"
                      value={caracteristica.valor}
                      onChange={(e) => handleCaracteristicaChange(caracteristica.id, e.target.value)}
                      placeholder={`Valor para ${caracteristica.nombre.toLowerCase()}`}
                    />
                  )}

                </div>
              ))}
            </div>
          </div>
        )}



        <div className="form-actions">
          <button type="submit" className="btn primary-btn" disabled={loading}>
            <FaSave className="me-2" />
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
          {/* Mostrar botón Limpiar solo cuando no esté en modo edición */}
          {!isEditing && (
            <button
              type="button"
              className="btn secondary-btn"
              onClick={handleClear}
              disabled={loading}
            >
              <FaBroom className="me-2" />
              Limpiar
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={loading}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>

      {!isEditing && (
        <>
          <MarcaModal
            show={showMarcaModal}
            onHide={() => setShowMarcaModal(false)}
            onAdd={handleAddMarca}
          />

          <ModeloModal
            show={showModeloModal}
            onHide={() => setShowModeloModal(false)}
            marcaSeleccionada={marcas.find((m) => m.id === Number(form.marca_id))}
            tipoEquipoSeleccionado={tiposEquipo.find((t) => t.id === Number(form.tipo_equipo_id))}
            onAdd={(nombre) => {
              const marcaId = Number(form.marca_id);
              if (marcaId) {
                return handleAddModelo(nombre, marcaId);
              } else {
                return Promise.reject("Marca no seleccionada");
              }
            }}

          />
        </>
      )}
    </div>
  );
}