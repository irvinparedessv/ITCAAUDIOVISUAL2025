import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

interface Option {
  id: number;
  nombre: string;
}

interface MantenimientoFormData {
  equipo_id: number;
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;
  hora_mantenimiento_final: string;
  detalles?: string;
  tipo_id: number;
  user_id: number;
  futuro_mantenimiento_id?: number;
  vida_util?: number;
}

const MantenimientoEdit: React.FC = () => {
  const { id } = useParams(); // viene desde la URL /mantenimiento/editar/:id
  const navigate = useNavigate();

  const [formData, setFormData] = useState<MantenimientoFormData | null>(null);

  const [equipos, setEquipos] = useState<Option[]>([]);
  const [tipos, setTipos] = useState<Option[]>([]);
  const [usuarios, setUsuarios] = useState<Option[]>([]);
  const [futuros, setFuturos] = useState<Option[]>([]);

  const fetchOptions = async () => {
    const [equiposRes, tiposRes, usuariosRes, futurosRes] = await Promise.all([
      axios.get('/api/equipos'),
      axios.get('/api/tipo_mantenimientos'),
      axios.get('/api/users'),
      axios.get('/api/futuro_mantenimientos'),
    ]);

    setEquipos(equiposRes.data);
    setTipos(tiposRes.data);
    setUsuarios(usuariosRes.data);
    setFuturos(futurosRes.data);
  };

  const fetchMantenimiento = async () => {
    try {
      const res = await axios.get(`/api/mantenimientos/${id}`);
      const mantenimiento = res.data;

      setFormData({
        equipo_id: mantenimiento.equipo_id,
        fecha_mantenimiento: mantenimiento.fecha_mantenimiento,
        hora_mantenimiento_inicio: mantenimiento.hora_mantenimiento_inicio,
        hora_mantenimiento_final: mantenimiento.hora_mantenimiento_final,
        detalles: mantenimiento.detalles || '',
        tipo_id: mantenimiento.tipo_id,
        user_id: mantenimiento.user_id,
        futuro_mantenimiento_id: mantenimiento.futuro_mantenimiento_id || '',
        vida_util: mantenimiento.vida_util || '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar mantenimiento');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/mantenimientos/${id}`, formData);
      toast.success('Mantenimiento actualizado correctamente');
      navigate('/mantenimiento');
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar mantenimiento');
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchMantenimiento();
  }, []);

  if (!formData) return <p className="text-center mt-10">Cargando mantenimiento...</p>;

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Editar Mantenimiento</h2>

      <div>
        <label>Equipo</label>
        <select name="equipo_id" value={formData.equipo_id} onChange={handleChange} required className="w-full p-2 border rounded">
          <option value="">Seleccione un equipo</option>
          {equipos.map(equipo => (
            <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Fecha de mantenimiento</label>
        <input type="date" name="fecha_mantenimiento" value={formData.fecha_mantenimiento} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Hora inicio</label>
          <input type="time" name="hora_mantenimiento_inicio" value={formData.hora_mantenimiento_inicio} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>Hora final</label>
          <input type="time" name="hora_mantenimiento_final" value={formData.hora_mantenimiento_final} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>
      </div>

      <div>
        <label>Detalles</label>
        <textarea name="detalles" value={formData.detalles || ''} onChange={handleChange} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label>Tipo de Mantenimiento</label>
        <select name="tipo_id" value={formData.tipo_id} onChange={handleChange} required className="w-full p-2 border rounded">
          <option value="">Seleccione un tipo</option>
          {tipos.map(tipo => (
            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Responsable (usuario)</label>
        <select name="user_id" value={formData.user_id} onChange={handleChange} required className="w-full p-2 border rounded">
          <option value="">Seleccione un usuario</option>
          {usuarios.map(user => (
            <option key={user.id} value={user.id}>{user.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Futuro Mantenimiento (opcional)</label>
        <select name="futuro_mantenimiento_id" value={formData.futuro_mantenimiento_id || ''} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Ninguno</option>
          {futuros.map(fut => (
            <option key={fut.id} value={fut.id}>{fut.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Vida útil (meses)</label>
        <input type="number" name="vida_util" value={formData.vida_util || ''} onChange={handleChange} className="w-full p-2 border rounded" min={0} />
      </div>

      <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">Actualizar Mantenimiento</button>
    </form>
  );
};

export default MantenimientoEdit;
