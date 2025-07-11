import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { NAVALHA_LOGO_URL } from '../../constants';
import { useNotification } from '../../contexts/NotificationContext';
import { UserType } from '../../types';
import BackButton from '../../components/BackButton';

const LoginPage: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  const { login, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const from = location.state?.from?.pathname || "/";

  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (formValues) => {
      const loggedInUser = await login(formValues.email, formValues.password);
      if (loggedInUser) {
        addNotification({ message: 'Login bem-sucedido!', type: 'success' });
        if (from !== "/" && from !== "/login" && !from.startsWith('/signup')) {
            navigate(from, { replace: true });
        } else if (loggedInUser.type === UserType.ADMIN) {
          navigate('/admin/overview', { replace: true });
        } else if (loggedInUser.type === UserType.CLIENT) {
          navigate('/client/appointments', { replace: true });
        } else {
          navigate('/', { replace: true }); // Fallback
        }
      }
      // Error notification is handled by AuthContext or login function itself
    },
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};
      if (!formValues.email) newErrors.email = 'E-mail é obrigatório.';
      else if (!/\S+@\S+\.\S+/.test(formValues.email)) newErrors.email = 'E-mail inválido.';
      if (!formValues.password) newErrors.password = 'Senha é obrigatória.';
      return newErrors;
    },
  });

  return (
    <div className="flex bg-white">
      {/* Image Column */}
      <div 
        className="hidden md:block md:w-1/2 lg:w-2/3 bg-cover bg-center relative"
        style={{backgroundImage: "url('https://i.imgur.com/0ZF7FfV.png')"}}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-12 text-white">
            <h2 className="text-4xl font-bold mb-3">Sua agenda afiada, seus clientes satisfeitos.</h2>
            <p className="text-lg">Gerencie sua barbearia ou agende seu próximo corte com facilidade e estilo.</p>
        </div>
      </div>

      {/* Form Column */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <ReactRouterDOM.Link to="/" className="flex flex-col items-center mb-6 group">
            <div className="bg-primary-blue rounded-full p-3 w-32 h-32 flex items-center justify-center group-hover:opacity-80 transition-opacity">
              <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-full h-full" />
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-center text-primary-blue group-hover:opacity-80 transition-opacity">Login Navalha Digital</h2>
          </ReactRouterDOM.Link>
          <p className="mb-6 text-sm text-center text-gray-600">Acesse sua conta para continuar.</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="seu@email.com"
              autoComplete="email"
              leftIcon={<span className="material-icons-outlined text-gray-400">email</span>}
              disabled={isSubmitting || authLoading}
            />
            <div>
              <Input
                label="Senha"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Sua senha"
                autoComplete="current-password"
                leftIcon={<span className="material-icons-outlined text-gray-400">lock</span>}
                disabled={isSubmitting || authLoading}
                containerClassName="mb-1"
              />
              <div className="text-right text-xs">
                  <ReactRouterDOM.Link to="/forgot-password" className="font-medium text-primary-blue hover:underline">
                      Esqueceu a senha?
                  </ReactRouterDOM.Link>
              </div>
            </div>
            <Button type="submit" fullWidth isLoading={isSubmitting || authLoading} size="lg">
              Entrar
            </Button>
          </form>

          <p className="mt-8 text-xs sm:text-sm text-center text-gray-600">
            Não tem uma conta?{' '}
            <ReactRouterDOM.Link to="/signup/client" className="font-medium text-primary-blue hover:underline">
              Cadastre-se como Cliente
            </ReactRouterDOM.Link>
            <br className="sm:hidden"/> <span className="hidden sm:inline">ou</span>{' '}
            <ReactRouterDOM.Link to="/signup/barbershop" className="font-medium text-primary-blue hover:underline">
              Cadastre sua Barbearia
            </ReactRouterDOM.Link>
          </p>
            <div className="mt-6 text-center">
                <BackButton />
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;