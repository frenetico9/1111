

import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarbershopProfile } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { DAYS_OF_WEEK, DEFAULT_BARBERSHOP_WORKING_HOURS } from '../../constants';

type SettingsFormData = Omit<BarbershopProfile, 'id' | 'email'>; // Email usually tied to auth user

const initialFormValues: SettingsFormData = {
  name: '',
  responsibleName: '',
  phone: '',
  address: '',
  description: '',
  logoUrl: '',
  coverImageUrl: '',
  workingHours: DEFAULT_BARBERSHOP_WORKING_HOURS,
};

const AdminSettingsPage: React.FC = () => {
  const { user, barbershopProfile, updateBarbershopProfile, loading: authLoading, refreshUserData } = useAuth();
  const { addNotification } = useNotification();

  const stableSetValues = useCallback((valuesToSet: Partial<SettingsFormData>) => {
    // This function's identity is stable, safe for useEffect dependency
    // But we need the actual setter from the hook
  }, []);


  const { values, errors, handleChange, handleSubmit, setValues, isSubmitting } = useForm<SettingsFormData>({
    initialValues: initialFormValues,
    onSubmit: async (formValues) => {
      if (!user || !barbershopProfile) return;
      try {
        const success = await updateBarbershopProfile({ id: barbershopProfile.id, ...formValues });
        if (success) {
          addNotification({ message: 'Configurações da barbearia atualizadas!', type: 'success' });
          await refreshUserData(); // Refresh to get updated profile in AuthContext
        } else {
          addNotification({ message: 'Erro ao atualizar configurações.', type: 'error' });
        }
      } catch (error) {
        addNotification({ message: `Erro: ${(error as Error).message}`, type: 'error' });
      }
    },
    validate: (formValues) => {
      const newErrors: Partial<Record<keyof SettingsFormData, string>> = {};
      if (!formValues.name) newErrors.name = 'Nome da barbearia é obrigatório.';
      if (!formValues.responsibleName) newErrors.responsibleName = 'Nome do responsável é obrigatório.';
      if (!formValues.phone) newErrors.phone = 'Telefone é obrigatório.';
      if (!formValues.address) newErrors.address = 'Endereço é obrigatório.';
      formValues.workingHours.forEach(h => {
        if (h.isOpen && h.start >= h.end) {
          if (!newErrors.workingHours) newErrors.workingHours = `Horário de ${DAYS_OF_WEEK[h.dayOfWeek]} inválido (início deve ser antes do fim).`;
        }
      });
      return newErrors;
    },
  });
  
  const stableSetValuesHook = setValues;

  useEffect(() => {
    if (barbershopProfile) {
      stableSetValuesHook({
        name: barbershopProfile.name,
        responsibleName: barbershopProfile.responsibleName,
        phone: barbershopProfile.phone,
        address: barbershopProfile.address,
        description: barbershopProfile.description || '',
        logoUrl: barbershopProfile.logoUrl || '',
        coverImageUrl: barbershopProfile.coverImageUrl || '',
        workingHours: barbershopProfile.workingHours?.length === 7 ? barbershopProfile.workingHours : DEFAULT_BARBERSHOP_WORKING_HOURS,
      });
    } else if (user) { 
        stableSetValuesHook({
            ...initialFormValues,
            name: user.barbershopName || '',
            responsibleName: user.name || '',
            phone: user.phone || '',
            address: user.address || '',
        });
    }
  }, [barbershopProfile, user, stableSetValuesHook]);

  const handleWorkingHourChange = (dayIndex: number, field: 'start' | 'end' | 'isOpen', value: string | boolean) => {
    const newWorkingHours = values.workingHours.map((wh, index) => 
      index === dayIndex ? { ...wh, [field]: value } : wh
    );
    setValues({ ...values, workingHours: newWorkingHours });
  };
  

  if (authLoading && !barbershopProfile && !user) return <LoadingSpinner fullPage label="Carregando configurações..." />;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-8">Configurações da Barbearia</h1>
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-light-blue">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text-dark border-b border-gray-300 pb-2 mb-6">Informações Gerais</h2>
            <Input label="Nome da Barbearia *" name="name" value={values.name} onChange={handleChange} error={errors.name} disabled={isSubmitting} />
            <Input label="Nome do Responsável *" name="responsibleName" value={values.responsibleName} onChange={handleChange} error={errors.responsibleName} disabled={isSubmitting}/>
            <Input label="Telefone de Contato *" name="phone" type="tel" value={values.phone} onChange={handleChange} error={errors.phone} disabled={isSubmitting}/>
            <Input label="Endereço Completo *" name="address" value={values.address} onChange={handleChange} error={errors.address} disabled={isSubmitting}/>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-dark mb-1">Descrição da Barbearia (Opcional)</label>
              <textarea name="description" id="description" rows={3} value={values.description} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-blue focus:border-primary-blue text-sm shadow-sm" disabled={isSubmitting}/>
            </div>
            <Input label="URL da Logo (Opcional)" name="logoUrl" value={values.logoUrl} onChange={handleChange} placeholder="https://exemplo.com/logo.png" disabled={isSubmitting}/>
            {values.logoUrl && (
                <div className="mt-2">
                    <img src={values.logoUrl} alt="Prévia da Logo" className="h-24 w-24 object-contain rounded-lg border p-1 shadow-sm bg-gray-50" 
                        onError={(e) => (e.currentTarget.style.display = 'none')} 
                        onLoad={(e) => (e.currentTarget.style.display = 'block')}
                    />
                     <p className="text-xs text-gray-500 mt-1">Se a imagem não aparecer, verifique a URL.</p>
                </div>
            )}
            <Input label="URL da Imagem de Capa (Opcional)" name="coverImageUrl" value={values.coverImageUrl} onChange={handleChange} placeholder="https://exemplo.com/capa.jpg" disabled={isSubmitting}/>

          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-dark border-b border-gray-300 pb-2 mb-6 pt-4">Horário de Funcionamento</h2>
            {errors.workingHours && <p className="text-red-500 text-xs mb-2">{errors.workingHours}</p>}
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((dayName, index) => (
                <div key={index} className={`grid grid-cols-1 sm:grid-cols-12 gap-x-3 gap-y-2 items-center p-3 rounded-md border ${values.workingHours[index]?.isOpen ? 'border-light-blue bg-light-blue/30' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center sm:col-span-3">
                     <input 
                        type="checkbox" 
                        id={`isOpen-${index}`}
                        checked={values.workingHours[index]?.isOpen || false}
                        onChange={(e) => handleWorkingHourChange(index, 'isOpen', e.target.checked)}
                        className="h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue mr-2"
                        disabled={isSubmitting} 
                      />
                    <label htmlFor={`isOpen-${index}`} className="text-sm font-medium text-text-dark">{dayName}</label>
                  </div>
                  <div className="sm:col-span-4">
                    <Input 
                        label="Início"
                        type="time" 
                        value={values.workingHours[index]?.start || '09:00'} 
                        onChange={(e) => handleWorkingHourChange(index, 'start', e.target.value)}
                        containerClassName="mb-0"
                        className="text-sm py-1.5"
                        disabled={isSubmitting || !values.workingHours[index]?.isOpen}
                    />
                  </div>
                  <div className="sm:col-span-4">
                     <Input 
                        label="Fim"
                        type="time" 
                        value={values.workingHours[index]?.end || '18:00'} 
                        onChange={(e) => handleWorkingHourChange(index, 'end', e.target.value)}
                        containerClassName="mb-0"
                        className="text-sm py-1.5"
                        disabled={isSubmitting || !values.workingHours[index]?.isOpen}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button type="submit" fullWidth isLoading={isSubmitting || authLoading} size="lg" className="mt-8">
            Salvar Configurações
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsPage;