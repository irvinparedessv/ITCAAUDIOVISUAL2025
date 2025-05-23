import { useEffect, useState } from 'react';
import api from '~/api/axios'
import type { Bitacora } from '~/types/bitacora';

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<Bitacora[]>([]);

  useEffect(() => {
    api.get('/bitacora').then(res => {
      setRegistros(res.data.data);
    });
  }, []);

  return (
    <div>
      <h2>Bitácora del Sistema</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Módulo</th>
            <th>Acción</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.nombre_usuario}</td>
              <td>{log.modulo}</td>
              <td>{log.accion}</td>
              <td>{log.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
