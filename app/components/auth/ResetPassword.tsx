import React, { useState } from 'react';
import api from '~/api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaSave, FaTimes, FaKey } from 'react-icons/fa';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
      });
      
      toast.success('Contraseña restablecida con éxito');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hubo un problema al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        <FaKey className="me-2" />
        Restablecer Contraseña
      </h2>
      
      <p className="text-center mb-4">Estás restableciendo la contraseña para: <strong>{email}</strong></p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">Nueva Contraseña</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="passwordConfirm" className="form-label">Confirmar Contraseña</label>
          <input
            id="passwordConfirm"
            type="password"
            className="form-control"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            placeholder="Repite tu contraseña"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn primary-btn"
            disabled={isLoading}
          >
            <FaSave className="me-2" />
            {isLoading ? 'Procesando...' : 'Guardar Nueva Contraseña'}
          </button>
          
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleCancel}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;