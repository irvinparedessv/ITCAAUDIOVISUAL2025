import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '~/api/axios';

const ConfirmAccount = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasConfirmed = useRef(false);

    // Limpieza del timeout al desmontar el componente
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!token || hasConfirmed.current) return;

        const confirmAccount = async () => {
            hasConfirmed.current = true;
            setStatus('loading');
            
            try {
                const response = await api.post(`/confirm-account/${token}`);
                
                if (!response.data.email) {
                    throw new Error('Email no recibido en la respuesta');
                }

                setStatus('success');
                setMessage('✅ ¡Cuenta confirmada con éxito! Redirigiendo...');

                // Timeout para redirección
                timeoutRef.current = setTimeout(() => {
                    navigate(`/change-password?email=${encodeURIComponent(response.data.email)}`, {
                        replace: true
                    });
                }, 3000); // 3 segundos de delay

            } catch (error: any) {
                setStatus('error');
                const errorData = error.response?.data || {};
                
                setMessage(errorData.message || 'Error al confirmar la cuenta');
                setDebugInfo(
                    errorData.debug || 
                    `Status: ${error.response?.status || 'Sin respuesta'}`
                );
                
                console.error('Error en confirmación:', error);
            }
        };

        confirmAccount();

    }, [token, navigate]);

    return (
        <div className="container mt-5">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h2 className="mb-0">Confirmación de Cuenta</h2>
                </div>
                <div className="card-body">
                    {status === 'loading' && (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-3">Verificando tu cuenta...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="alert alert-success">
                            <h4>¡Éxito!</h4>
                            <p>{message}</p>
                            <div className="progress mt-2">
                                <div 
                                    className="progress-bar progress-bar-striped progress-bar-animated" 
                                    style={{ width: '100%' }}
                                ></div>
                            </div>
                        </div>
                    )}

                   {status === 'error' && (
                    <div className="alert alert-danger">
                        <h4 className="alert-heading">⚠️ Requiere atención</h4>
                        <p className="mb-2">{message}</p>
                        
                        <hr className="my-2" />
                        
                        <div className="mt-3">
                        <h5 className="fw-bold mb-2">Por favor contactar al equipo de soporte:</h5>
                        <ul className="list-unstyled">
                            <li className="mb-1">
                            <i className="bi bi-envelope me-2"></i>
                            Email: <a href="mailto:soporte@tuapp.com" className="text-decoration-none">soporte@tuapp.com</a>
                            </li>
                            <li className="mb-1">
                            <i className="bi bi-telephone me-2"></i>
                            Teléfono: <a href="tel:+123456789" className="text-decoration-none">+1 (234) 567-89</a>
                            </li>
                        </ul>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmAccount;