import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Pagination } from 'react-bootstrap';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUsuarios, deleteUsuario } from '~/services/userService';
import type { User } from '~/types/user';
import { FaUserCircle, FaEdit, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const rolesMap: Record<number, string> = {
  1: 'Administrador',
  2: 'Encargado',
  3: 'Prestamista',
};

const UsuarioList = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPorPagina = 5;

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id: number) => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas desactivar a este usuario? Esta acción es irreversible.'
    );

    if (confirmDelete) {
      try {
        await deleteUsuario(id);
        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((u) =>
            u.id === id ? { ...u, estado: 0 } : u
          )
        );
        toast.success('Usuario desactivado correctamente');
      } catch (error) {
        toast.error('Error al desactivar el usuario');
      }
    } else {
      toast.info('Acción cancelada por el usuario');
    }
  };

  const indexUltimo = currentPage * usuariosPorPagina;
  const indexPrimero = indexUltimo - usuariosPorPagina;
  const usuariosActuales = usuarios.slice(indexPrimero, indexUltimo);

  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);

  const items: React.ReactNode[] = [];
  for (let number = 1; number <= totalPaginas; number++) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => setCurrentPage(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Lista de Usuarios</h2>

      {/* BOTÓN DE CREAR USUARIO */}
      <div className="d-flex justify-content-end mb-3">
        <Link to="/formUsuario" className="btn btn-primary">
          Crear Usuario
        </Link>
      </div>

      {loading ? (
        <p className="text-center">Cargando usuarios...</p>
      ) : (
        <div className="w-100" style={{ overflowX: 'auto' }}>
          <Table
            striped
            bordered
            hover
            responsive
            className="text-center text-sm"
            style={{
              fontSize: '0.8rem',
              minWidth: '850px',
            }}
          >
            <thead className="table-primary">
              <tr>
                <th style={{ width: '50px' }}>Imagen</th>
                <th style={{ width: '150px' }}>Nombre</th>
                <th style={{ width: '180px' }}>Correo</th>
                <th style={{ width: '120px' }}>Teléfono</th>
                <th style={{ width: '150px' }}>Dirección</th>
                <th style={{ width: '100px' }}>Rol</th>
                <th style={{ width: '80px' }}>Estado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="align-middle">
              {usuariosActuales.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    {usuario.image ? (
                      <img
                        src={`http://localhost:8000/storage/${usuario.image}`}
                        alt={usuario.first_name}
                        className="rounded-circle object-cover"
                        style={{ width: '40px', height: '40px' }}
                      />
                    ) : (
                      <FaUserCircle size={40} className="text-secondary" />
                    )}
                  </td>
                  <td>{usuario.first_name} {usuario.last_name}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.phone || 'N/A'}</td>
                  <td>{usuario.address || 'N/A'}</td>
                  <td>{rolesMap[usuario.role_id] || 'Desconocido'}</td>
                  <td>
                    {usuario.estado === 1 ? (
                      <Badge bg="success" style={{ fontSize: '0.8rem' }}>Activo</Badge>
                    ) : usuario.estado === 0 ? (
                      <Badge bg="danger" style={{ fontSize: '0.8rem' }}>Inactivo</Badge>
                    ) : (
                      <Badge bg="warning" style={{ fontSize: '0.8rem' }}>Pendiente</Badge>
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-around" style={{ gap: '10px' }}>
                      <Link
                        to={`/editarUsuario/${usuario.id}`}
                        className="btn btn-warning"
                        style={{ fontSize: '1.1rem', padding: '0' }}
                      >
                        <FaEdit />
                      </Link>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        style={{ fontSize: '1.1rem', padding: '0' }}
                        onClick={() => eliminarUsuario(usuario.id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {totalPaginas > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination className="mt-3">{items}</Pagination>
            </div>
          )}
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UsuarioList;
