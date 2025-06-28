


import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { NAVALHA_LOGO_URL, MIN_PASSWORD_LENGTH } from '../../constants';
import { useNotification } from '../../contexts/NotificationContext';
import BackButton from '../../components/BackButton';

const BarbershopSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupBarbershop, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();

  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: {
      barbershopName: '',
      responsibleName: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async (formValues) => {
      const newUser = await signupBarbershop(
        formValues.barbershopName,
        formValues.responsibleName,
        formValues.email,
        formValues.phone,
        formValues.address,
        formValues.password
      );
      if (newUser) {
        addNotification({ message: 'Cadastro da barbearia realizado com sucesso! Faça login para configurar.', type: 'success' });
        navigate('/login');
      }
      // Error notification handled by AuthContext or signup function
    },
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};
      if (!formValues.barbershopName.trim()) newErrors.barbershopName = 'Nome da barbearia é obrigatório.';
      if (!formValues.responsibleName.trim()) newErrors.responsibleName = 'Nome do responsável é obrigatório.';
      if (!formValues.email.trim()) newErrors.email = 'E-mail é obrigatório.';
      else if (!/\S+@\S+\.\S+/.test(formValues.email)) newErrors.email = 'E-mail inválido.';
      if (!formValues.phone.trim()) newErrors.phone = 'Telefone é obrigatório.';
      else if (!/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(formValues.phone)) newErrors.phone = 'Telefone inválido. Formato: (XX) XXXXX-XXXX ou XXXXXXXX.';
      if (!formValues.address.trim()) newErrors.address = 'Endereço é obrigatório.';
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
        style={{backgroundImage: "url('https://i.imgur.com/ANaRyNn.png')"}}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-12 text-white">
            <h2 className="text-4xl font-bold mb-3">Transforme a gestão do seu negócio.</h2>
            <p className="text-lg">Junte-se ao Navalha Digital e leve sua barbearia para o próximo nível.</p>
        </div>
      </div>

      {/* Form Column */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="flex flex-col items-center mb-6 group">
            <div className="bg-primary-blue rounded-full p-3 sm:p-4 w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center group-hover:opacity-80 transition-opacity">
              <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-full h-full" />
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-center text-primary-blue group-hover:opacity-80 transition-opacity">Cadastro de Barbearia</h2>
          </Link>
          <p className="mb-6 text-sm text-center text-gray-600">Traga seu negócio para o Navalha Digital e simplifique sua gestão.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome da Barbearia"
              name="barbershopName"
              value={values.barbershopName}
              onChange={handleChange}
              error={errors.barbershopName}
              placeholder="Ex: Barbearia Estilo Único"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Nome do Responsável"
              name="responsibleName"
              value={values.responsibleName}
              onChange={handleChange}
              error={errors.responsibleName}
              placeholder="Seu nome completo"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="E-mail de Contato da Barbearia"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="contato@suabarbearia.com"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Telefone Comercial (com DDD)"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="(XX) XXXXX-XXXX"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Endereço Completo da Barbearia"
              name="address"
              value={values.address}
              onChange={handleChange}
              error={errors.address}
              placeholder="Rua, Número, Bairro, Cidade - UF"
              disabled={isSubmitting || authLoading}
            />
            <Input
              label="Senha de Acesso ao Painel"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
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
              disabled={isSubmitting || authLoading}
            />
            <Button type="submit" fullWidth isLoading={isSubmitting || authLoading} size="lg" className="mt-2">
              Cadastrar Barbearia
            </Button>
          </form>

          <p className="mt-8 text-xs sm:text-sm text-center text-gray-600">
            Já possui uma conta de barbearia?{' '}
            <Link to="/login" className="font-medium text-primary-blue hover:underline">
              Faça Login
            </Link>
          </p>
          <p className="mt-2 text-xs sm:text-sm text-center text-gray-600">
            Deseja apenas agendar um serviço?{' '}
            <Link to="/signup/client" className="font-medium text-primary-blue hover:underline">
              Cadastre-se como Cliente
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

export default BarbershopSignupPage;