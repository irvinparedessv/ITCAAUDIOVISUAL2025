import React, { useState } from 'react';
import api from '~/api/axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/forgot-password', { email });
      setMessage(response.data.message);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Hubo un problema, intenta de nuevo.');
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Olvidé mi Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar enlace de restablecimiento</button>
      </form>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
};

export default ForgotPassword;
