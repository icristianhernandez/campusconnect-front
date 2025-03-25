import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase'


function LoginForm() {
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmitLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailRef.current.value,
                password: passwordRef.current.value,
            });
            
            if (error) {
                if (error.message === 'Invalid login credentials') {
                    setError('Credenciales de inicio de sesión inválidas');
                } else {
                    setError(error.message);
                }
                return;
            }
            else {
                navigate('/feed');
            }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className='LoginForm login-form' onSubmit={handleSubmitLogin}>
            <div>
                <input 
                    type="email" 
                    id="email"
                    className='login-form-input' 
                    ref={emailRef}
                    placeholder='Introduzca su email'
                    maxLength={64}
                    disabled={loading}
                    required
                />
            </div>
            <div>
                <input 
                    type="password"
                    id='password'
                    className='login-form-input'
                    ref={passwordRef}
                    placeholder='Introduzca su contraseña'
                    maxLength={30}
                    disabled={loading}
                    required
                />
            </div>

            <div className='login-form-status'>
                {error ? (
                    <p className="login-error">{error}</p>
                ) : loading ? (
                    <p>Iniciando sesión...</p>
                ) : (
                    <p>Te estamos esperando...</p>
                )}
            </div>

            <div>
                <button 
                    className='login-form-submit' 
                    type="submit" 
                    disabled={loading}
                >
                    {loading ? 'Iniciando...' : 'Entrar'}
                </button>
            </div>
                
        </form>
    );
}

export default LoginForm;
