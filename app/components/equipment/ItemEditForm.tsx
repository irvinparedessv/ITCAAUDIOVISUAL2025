import { useEffect, useState } from "react";
import type { Item, Equipo, Insumo } from "~/types/item";
import type { Props as ItemFormProps } from "~/components/equipment/ItemForm";
import ItemForm from "~/components/equipment/ItemForm";

interface CaracteristicaConValor {
  id: number;
  nombre: string;
  tipo_dato: string;
  valor: string;
}

interface Props extends Omit<ItemFormProps, "onSubmit" | "initialValues"> {
  item: Item;
  caracteristicas: CaracteristicaConValor[];
  onSubmit: (data: any) => Promise<void>;
}

export default function ItemEditForm({ item, caracteristicas, onSubmit, ...rest }: Props) {
  const [formData, setFormData] = useState<any | null>(null);

  useEffect(() => {
    if (item) {
      // Preparar datos base comunes a todos los items
      const baseData = {
        tipo_equipo_id: String(item.tipo_equipo_id),
        marca_id: item.modelo?.marca_id ? String(item.modelo.marca_id) : "",
        modelo_id: String(item.modelo_id),
        estado_id: String(item.estado_id),
        tipo_reserva_id: item.tipo_reserva_id ? String(item.tipo_reserva_id) : "",
        detalles: item.detalles || "",
        fecha_adquisicion: item.fecha_adquisicion || "",
        imagen: null,
        // Preparar características en el formato correcto
        caracteristicas: caracteristicas.map(c => ({
          id: c.id,
          nombre: c.nombre,
          tipo_dato: c.tipo_dato,
          valor: c.valor.toString() // Asegurar que sea string
        }))
      };

      // Datos específicos para equipos
      if (item.tipo === "equipo" || 'numero_serie' in item) {
        const equipo = item as Equipo;
        setFormData({
          ...baseData,
          numero_serie: equipo.numero_serie || "",
          vida_util: equipo.vida_util !== undefined ? String(equipo.vida_util) : "",
          cantidad: "" // No usar cantidad para equipos en edición
        });
      } 
      // Datos específicos para insumos
      else {
        const insumo = item as Insumo;
        setFormData({
          ...baseData,
          numero_serie: "", // Vacío para insumos
          vida_util: "", // Vacío para insumos
          cantidad: insumo.cantidad ? String(insumo.cantidad) : "1" // Default 1 para insumos
        });
      }
    }
  }, [item, caracteristicas]);

  if (!formData) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <ItemForm
      {...rest}
      initialValues={formData}
      onSubmit={onSubmit}
      isEditing={true}
    />
  );
}