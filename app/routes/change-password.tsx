// ChangePassword.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import api from '~/api/axios';

interface ChangePasswordData {
  email: string;
  password: string;
  password_confirmation: string;
}

interface ApiResponse {
  message: string;
}

interface ApiError {
  message: string;
}

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const query = new URLSearchParams(location.search);
    const email = query.get('email');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== passwordConfirmation) {
            setMessage('Las contraseñas no coinciden');
            return;
        }

        if (!email) {
            setMessage('No se proporcionó un email válido');
            return;
        }

        try {
            await api.post<ApiResponse>('/change-password', {
                email,
                password,
                password_confirmation: passwordConfirmation
            } as ChangePasswordData);
            
            setMessage('Contraseña cambiada exitosamente. Redirigiendo al login...');
            setSuccess(true);
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const serverError = error as AxiosError<ApiError>;
                if (serverError.response) {
                    setMessage(serverError.response.data.message);
                } else {
                    setMessage(error.message);
                }
            } else if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage('Ocurrió un error desconocido al cambiar la contraseña');
            }
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h4>Cambiar Contraseña</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        id="email"
                                        value={email || ''}
                                        readOnly
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Nueva Contraseña</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="passwordConfirmation" className="form-label">Confirmar Contraseña</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        id="passwordConfirmation"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Cambiar Contraseña</button>
                            </form>
                            {message && (
                                <div className={`alert ${success ? 'alert-success' : 'alert-danger'} mt-3`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;