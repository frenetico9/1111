import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import Input from '../../components/Input';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import { NAVALHA_LOGO_URL, MIN_PASSWORD_LENGTH } from '../../constants';
import { useNotification } from '../../contexts/NotificationContext';
import { mockVerifyForgotPassword, mockResetPassword } from '../../services/mockApiService';

const ForgotPasswordPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const { addNotification } = useNotification();
    const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
    const [verifiedEmail, setVerifiedEmail] = useState('');

    // Step 1: Verification Form
    const verificationForm = useForm({
        initialValues: { name: '', email: '', phone: '' },
        onSubmit: async (values) => {
            const success = await mockVerifyForgotPassword(values.name, values.email, values.phone);
            if (success) {
                addNotification({ message: 'Verificação bem-sucedida! Agora, crie uma nova senha.', type: 'success' });
                setVerifiedEmail(values.email);
                setStep('reset');
            } else {
                addNotification({ message: 'Dados não encontrados ou não correspondem. Verifique as informações.', type: 'error' });
            }
        },
        validate: (values) => {
            const errors: any = {};
            if (!values.name) errors.name = 'Nome completo é obrigatório.';
            if (!values.email) errors.email = 'E-mail é obrigatório.';
            if (!values.phone) errors.phone = 'Telefone é obrigatório.';
            return errors;
        }
    });

    // Step 2: Password Reset Form
    const resetForm = useForm({
        initialValues: { newPassword: '', confirmNewPassword: '' },
        onSubmit: async (values) => {
            try {
                const success = await mockResetPassword(verifiedEmail, values.newPassword);
                if (success) {
                    setStep('success');
                } else {
                    addNotification({ message: 'Ocorreu um erro ao redefinir a senha. Tente novamente.', type: 'error' });
                }
            } catch (error) {
                // This will catch the error for test accounts and other potential issues
                addNotification({ message: (error as Error).message, type: 'error' });
            }
        },
        validate: (values) => {
            const errors: any = {};
            if (!values.newPassword) {
                errors.newPassword = 'A nova senha é obrigatória.';
            } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
                errors.newPassword = `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
            }
            if (values.newPassword !== values.confirmNewPassword) {
                errors.confirmNewPassword = 'As senhas não coincidem.';
            }
            return errors;
        }
    });

    return (
        <div className="min-h-[calc(100vh-150px)] flex items-center justify-center p-6 bg-surface">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-light-blue">
                <ReactRouterDOM.Link to="/" className="flex flex-col items-center mb-6 group">
                    <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-24 h-24 mb-4" />
                    <h2 className="text-2xl font-bold text-center text-primary-blue">Redefinir Senha</h2>
                </ReactRouterDOM.Link>

                {step === 'verify' && (
                    <>
                        <p className="mb-6 text-sm text-center text-gray-600">Para redefinir sua senha, por favor, confirme seus dados cadastrados.</p>
                        <form onSubmit={verificationForm.handleSubmit} className="space-y-4">
                            <Input
                                label="Nome Completo"
                                name="name"
                                value={verificationForm.values.name}
                                onChange={verificationForm.handleChange}
                                error={verificationForm.errors.name}
                                disabled={verificationForm.isSubmitting}
                                placeholder="Seu nome completo"
                            />
                            <Input
                                label="E-mail"
                                name="email"
                                type="email"
                                value={verificationForm.values.email}
                                onChange={verificationForm.handleChange}
                                error={verificationForm.errors.email}
                                disabled={verificationForm.isSubmitting}
                                placeholder="seu@email.com"
                            />
                            <Input
                                label="Telefone"
                                name="phone"
                                type="tel"
                                value={verificationForm.values.phone}
                                onChange={verificationForm.handleChange}
                                error={verificationForm.errors.phone}
                                disabled={verificationForm.isSubmitting}
                                placeholder="(XX) XXXXX-XXXX"
                            />
                            <Button type="submit" fullWidth isLoading={verificationForm.isSubmitting} size="lg">
                                Verificar Dados
                            </Button>
                        </form>
                    </>
                )}

                {step === 'reset' && (
                     <>
                        <p className="mb-6 text-sm text-center text-gray-600">Verificação concluída. Agora, crie uma nova senha para o e-mail: <strong className="text-primary-blue">{verifiedEmail}</strong></p>
                        <form onSubmit={resetForm.handleSubmit} className="space-y-4">
                            <Input
                                label="Nova Senha"
                                name="newPassword"
                                type="password"
                                value={resetForm.values.newPassword}
                                onChange={resetForm.handleChange}
                                error={resetForm.errors.newPassword}
                                disabled={resetForm.isSubmitting}
                                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                            />
                             <Input
                                label="Confirmar Nova Senha"
                                name="confirmNewPassword"
                                type="password"
                                value={resetForm.values.confirmNewPassword}
                                onChange={resetForm.handleChange}
                                error={resetForm.errors.confirmNewPassword}
                                disabled={resetForm.isSubmitting}
                                placeholder="Repita a nova senha"
                            />
                            <Button type="submit" fullWidth isLoading={resetForm.isSubmitting} size="lg">
                                Redefinir Senha
                            </Button>
                        </form>
                    </>
                )}

                {step === 'success' && (
                    <div className="text-center">
                        <span className="material-icons-outlined text-6xl text-green-500 mb-4">check_circle_outline</span>
                        <h3 className="text-xl font-bold text-text-dark">Senha Redefinida!</h3>
                        <p className="my-4 text-sm text-gray-600">Sua senha foi alterada com sucesso. Agora você já pode fazer login com sua nova senha.</p>
                        <Button onClick={() => navigate('/login')} fullWidth size="lg">
                            Ir para o Login
                        </Button>
                    </div>
                )}
                
                <div className="mt-8 text-center">
                    <BackButton />
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;