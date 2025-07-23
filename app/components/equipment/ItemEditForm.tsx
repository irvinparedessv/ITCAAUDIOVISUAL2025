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
      const baseData = {
        tipo_equipo_id: String(item.tipo_equipo_id),
        marca_id: item.modelo?.marca_id ? String(item.modelo.marca_id) : "",
        modelo_id: String(item.modelo_id),
        estado_id: String(item.estado_id),
        tipo_reserva_id: item.tipo_reserva_id ? String(item.tipo_reserva_id) : "",
        detalles: item.detalles || "",
        fecha_adquisicion: item.fecha_adquisicion || "",
        imagen: null,
      caracteristicas: caracteristicas.map((c) => ({
  caracteristica_id: c.id,
  nombre: c.nombre,
  tipo_dato: c.tipo_dato,
  valor: c.valor
}))


      };

      if (item.tipo === "equipo") {
        const equipo = item as Equipo;
        setFormData({
          ...baseData,
          numero_serie: equipo.numero_serie || "",
          vida_util: equipo.vida_util ? String(equipo.vida_util) : "",
          cantidad: equipo.cantidad ? String(equipo.cantidad) : ""
        });
      } else {
        const insumo = item as Insumo;
        setFormData({
          ...baseData,
          cantidad: insumo.cantidad ? String(insumo.cantidad) : ""
        });
      }
    }
  }, [item, caracteristicas]);

  if (!formData) return <p>Cargando ítem...</p>;

  return (
    <ItemForm
      {...rest}
      initialValues={formData}
      onSubmit={onSubmit}
    />
  );
}