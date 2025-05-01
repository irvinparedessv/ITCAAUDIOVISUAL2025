import React, { useState } from 'react';
import api from '~/api/axios';
import { useLocation, useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
      });
      setMessage('Contraseña restablecida con éxito');
      setError('');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Hubo un problema, intenta de nuevo.');
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Restablecer Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Nueva Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label htmlFor="passwordConfirm">Confirmar Contraseña</label>
        <input
          type="password"
          id="passwordConfirm"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />
        <button type="submit">Restablecer contraseña</button>
      </form>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
};

export default ResetPassword;
