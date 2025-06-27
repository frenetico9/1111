import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { MIN_PASSWORD_LENGTH } from '../../constants';

const ClientProfilePage: React.FC = () => {
  const { user, loading: authLoading, refreshUserData, updateClientProfile } = useAuth();
  const { addNotification } = useNotification();

  const { values, errors, handleChange, handleSubmit, setValues, isSubmitting, setErrors, updateSingleValue } = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      // Password change fields (optional)
      currentPassword: '', 
      newPassword: '',
      confirmNewPassword: '',
    },
    onSubmit: async (formValues) => {
      if (!user) return;
      try {
        let profileUpdated = false;
        // Update basic info if changed
        if (formValues.name !== user.name || formValues.email !== user.email || formValues.phone !== user.phone) {
            const success = await updateClientProfile(user.id, {
                name: formValues.name,
                email: formValues.email, // Assuming email can be updated, might need verification in real app
                phone: formValues.phone,
            });
            if (success) {
                profileUpdated = true;
            } else {
                addNotification({ message: 'Erro ao atualizar informações básicas do perfil.', type: 'error'});
            }
        } else {
            profileUpdated = true; // No changes to basic info, but password might change
        }

        // Handle password change if fields are filled
        if (formValues.newPassword) { // Only attempt if newPassword is set
          if (!formValues.currentPassword) {
            setErrors(prevErrors => ({...prevErrors, currentPassword: 'Senha atual é obrigatória para alterar a senha.'}));
            addNotification({ message: 'Senha atual é obrigatória para alterar a senha.', type: 'error'});
            return; // Stop submission
          }
          // Simulate password change - In a real app, this needs a separate, secure endpoint
          // For mock, assume currentPassword is correct if newPassword is provided
          console.log('Simulating password change for user:', user.id);
          addNotification({ message: 'Senha alterada com sucesso! (Simulado)', type: 'success'});
          profileUpdated = true; // Consider it an update
        }
        
        if (profileUpdated) {
             addNotification({ message: 'Perfil atualizado com sucesso!', type: 'success'});
             await refreshUserData(); // Refresh user data in AuthContext
             // Clear password fields after successful submission
             updateSingleValue('currentPassword', '');
             updateSingleValue('newPassword', '');
             updateSingleValue('confirmNewPassword', '');
        }

      } catch (error) {
        addNotification({ message: `Erro ao atualizar perfil: ${(error as Error).message}`, type: 'error'});
      }
    },
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};
      if (!formValues.name.trim()) newErrors.name = 'Nome é obrigatório.';
      if (!formValues.email.trim()) newErrors.email = 'E-mail é obrigatório.';
      else if (!/\S+@\S+\.\S+/.test(formValues.email)) newErrors.email = 'E-mail inválido.';
      if (!formValues.phone.trim()) newErrors.phone = 'Telefone é obrigatório.';
      else if (!/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(formValues.phone)) newErrors.phone = 'Telefone inválido. Formato: (XX) XXXXX-XXXX ou XXXXXXXX.';
      
      // Password validation only if new password is being set
      if (formValues.newPassword) {
        if (!formValues.currentPassword) {
          newErrors.currentPassword = 'Senha atual é obrigatória para alterar a senha.';
        }
        if (formValues.newPassword.length < MIN_PASSWORD_LENGTH) {
          newErrors.newPassword = `Nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
        }
        if (formValues.newPassword !== formValues.confirmNewPassword) {
          newErrors.confirmNewPassword = 'As senhas não coincidem.';
        }
      } else if (formValues.currentPassword && !formValues.newPassword) {
        newErrors.newPassword = 'Nova senha é obrigatória se a senha atual for fornecida.';
      }
      return newErrors;
    },
  });

  useEffect(() => {
    if (user) {
      setValues({ // This is updateValues from useForm
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [user, setValues]);

  if (authLoading && !user) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;
  if (!user) return <p className="text-center p-8">Usuário não encontrado.</p>; // Should be caught by ProtectedRoute

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-8">Meu Perfil</h1>
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-light-blue">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text-dark border-b border-gray-300 pb-2 mb-6">Informações Pessoais</h2>
            <Input
              label="Nome Completo"
              name="name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
              disabled={isSubmitting}
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isSubmitting} // Email usually not editable or requires verification, but mock allows
            />
            <Input
              label="Telefone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="(XX) XXXXX-XXXX"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-dark border-b border-gray-300 pb-2 mb-6 pt-4">Alterar Senha (Opcional)</h2>
            <Input
              label="Senha Atual"
              name="currentPassword"
              type="password"
              value={values.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              autoComplete="current-password"
              placeholder="Deixe em branco se não for alterar"
              disabled={isSubmitting}
            />
            <Input
              label="Nova Senha"
              name="newPassword"
              type="password"
              value={values.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              autoComplete="new-password"
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              disabled={isSubmitting}
            />
            <Input
              label="Confirmar Nova Senha"
              name="confirmNewPassword"
              type="password"
              value={values.confirmNewPassword}
              onChange={handleChange}
              error={errors.confirmNewPassword}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              disabled={isSubmitting}
            />
          </div>
          
          <Button type="submit" fullWidth isLoading={isSubmitting} size="lg" className="mt-2">
            Salvar Alterações
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClientProfilePage;