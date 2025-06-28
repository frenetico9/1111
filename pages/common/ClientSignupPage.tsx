


import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { NAVALHA_LOGO_URL, MIN_PASSWORD_LENGTH } from '../../constants';
import { useNotification } from '../../contexts/NotificationContext';
import BackButton from '../../components/BackButton';

const ClientSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupClient, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();

  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async (formValues) => {
      const newUser = await signupClient(formValues.name, formValues.email, formValues.phone, formValues.password);
      if (newUser) {
        addNotification({ message: 'Cadastro realizado com sucesso! Faça login para continuar.', type: 'success' });
        navigate('/login');
      }
      // Error notification is handled by AuthContext or signupClient itself
    },
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};
      if (!formValues.name.trim()) newErrors.name = 'Nome é obrigatório.';
      if (!formValues.email.trim()) newErrors.email = 'E-mail é obrigatório.';
      else if (!/\S+@\S+\.\S+/.test(formValues.email)) newErrors.email = 'E-mail inválido.';
      if (!formValues.phone.trim()) newErrors.phone = 'Telefone é obrigatório.';
       else if (!/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(formValues.phone)) newErrors.phone = 'Telefone inválido. Formato: (XX) XXXXX-XXXX ou XXXXXXXX.';
      if (!formValues.password) newErrors.password = 'Senha é obrigatória.';
      else if (formValues.password.length < MIN_PASSWORD_LENGTH) newErrors.password = `Senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
      if (formValues.password !== formValues.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';
      return newErrors;
    },
  });

  return (
    <div className="min-h-[calc(100vh-150px)] flex bg-white">
      {/* Image Column */}
      <div 
        className="hidden md:block md:w-1/2 lg:w-2/3 bg-cover bg-center relative"
        style={{backgroundImage: "url('https://i.imgur.com/9KLWBaO.png')"}}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-12 text-white">
            <h2 className="text-4xl font-bold mb-3">Encontre seu estilo. Agende com um clique.</h2>
            <p className="text-lg">Crie sua conta e descubra as melhores barbearias perto de você.</p>
        </div>
      </div>

      {/* Form Column */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="flex flex-col items-center mb-6 group">
            <div className="bg-primary-blue rounded-full p-3 sm:p-4 w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center group-hover:opacity-80 transition-opacity">
              <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-full h-full" />
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-center text-primary-blue group-hover:opacity-80 transition-opacity">Cadastro de Cliente</h2>
          </Link>
          <p className="mb-6 text-sm text-center text-gray-600">Crie sua conta para agendar serviços de forma rápida e fácil.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome Completo"
              name="name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Seu nome como será exibido"
              autoComplete="name"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Telefone (com DDD)"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="(XX) XXXXX-XXXX"
              autoComplete="tel"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              autoComplete="new-password"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Confirmar Senha"
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Repita a senha criada"
              autoComplete="new-password"
              disabled={isSubmitting || authLoading}
            />
            <Button type="submit" fullWidth isLoading={isSubmitting || authLoading} size="lg" className="mt-2">
              Criar Conta de Cliente
            </Button>
          </form>

          <p className="mt-8 text-xs sm:text-sm text-center text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-primary-blue hover:underline">
              Faça Login
            </Link>
          </p>
          <p className="mt-2 text-xs sm:text-sm text-center text-gray-600">
            Representa uma barbearia?{' '}
            <Link to="/signup/barbershop" className="font-medium text-primary-blue hover:underline">
              Cadastre sua Barbearia aqui
            </Link>
          </p>
          <div className="mt-6 text-center">
            <BackButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSignupPage;