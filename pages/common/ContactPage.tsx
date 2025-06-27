import React, { useState } from 'react';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useForm } from '../../hooks/useForm';
import { useNotification } from '../../contexts/NotificationContext';

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-border-color">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4 text-text-dark hover:text-primary-blue transition-colors"
                aria-expanded={isOpen}
            >
                <span className="font-semibold">{question}</span>
                <span className={`material-icons-outlined transition-transform transform ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>
            {isOpen && (
                <div className="pb-4 pr-6 text-sm text-text-light leading-relaxed animate-fade-in-up">
                    {children}
                </div>
            )}
        </div>
    );
};


const ContactPage: React.FC = () => {
    const { addNotification } = useNotification();
    const { values, errors, handleChange, handleSubmit, isSubmitting, resetForm } = useForm({
        initialValues: { name: '', email: '', subject: 'Suporte Técnico', message: '' },
        onSubmit: async (formValues) => {
            // Simulate API call
            await new Promise(res => setTimeout(res, 1000));
            console.log('Form submitted:', formValues);
            addNotification({ message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.', type: 'success' });
            resetForm();
        },
        validate: (formValues) => {
            const errors: any = {};
            if (!formValues.name) errors.name = 'Nome é obrigatório.';
            if (!formValues.email) errors.email = 'E-mail é obrigatório.';
            if (!formValues.message) errors.message = 'A mensagem não pode estar em branco.';
            return errors;
        }
    });

    return (
        <div className="py-12 md:py-20 bg-white animate-fade-in-up">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-dark">Entre em <span className="text-primary-blue">Contato</span></h1>
                    <p className="text-lg text-text-light mt-4 max-w-3xl mx-auto">
                        Tem alguma dúvida ou sugestão? Nossa equipe está pronta para ajudar.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 bg-surface p-8 rounded-2xl shadow-lg border border-border-color">
                    {/* Contact Form */}
                    <div>
                        <h2 className="text-2xl font-bold text-primary-blue mb-4">Envie uma Mensagem</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Seu Nome" name="name" value={values.name} onChange={handleChange} error={errors.name} disabled={isSubmitting} />
                            <Input label="Seu E-mail" name="email" type="email" value={values.email} onChange={handleChange} error={errors.email} disabled={isSubmitting} />
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-text-dark mb-1">Assunto</label>
                                <select id="subject" name="subject" value={values.subject} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg bg-white border-gray-300 hover:border-gray-400 focus:ring-primary-blue focus:border-primary-blue shadow-sm" disabled={isSubmitting}>
                                    <option>Suporte Técnico</option>
                                    <option>Vendas e Planos</option>
                                    <option>Parcerias</option>
                                    <option>Assuntos Gerais</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-text-dark mb-1">Sua Mensagem</label>
                                <textarea id="message" name="message" rows={4} value={values.message} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg shadow-sm ${errors.message ? 'border-red-500' : 'border-gray-300'}`} disabled={isSubmitting}></textarea>
                                {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message}</p>}
                            </div>
                            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>Enviar Mensagem</Button>
                        </form>
                    </div>
                    {/* Contact Info */}
                    <div className="bg-light-blue p-8 rounded-lg">
                        <h2 className="text-2xl font-bold text-primary-blue mb-6">Outros Canais</h2>
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <span className="material-icons-outlined text-primary-blue text-3xl">email</span>
                                <div className="ml-4">
                                    <h4 className="font-semibold text-text-dark">E-mail</h4>
                                    <p className="text-text-light text-sm">Para dúvidas gerais e suporte.</p>
                                    <a href="mailto:contato@navalhadigital.com" className="text-primary-blue hover:underline">contato@navalhadigital.com</a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="material-icons-outlined text-primary-blue text-3xl">support_agent</span>
                                <div className="ml-4">
                                    <h4 className="font-semibold text-text-dark">Telefone</h4>
                                    <p className="text-text-light text-sm">Para suporte comercial (Seg-Sex, 9h-18h).</p>
                                    <p className="text-text-dark font-medium">(11) 4002-8922</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="material-icons-outlined text-primary-blue text-3xl">location_on</span>
                                <div className="ml-4">
                                    <h4 className="font-semibold text-text-dark">Endereço</h4>
                                    <p className="text-text-light text-sm">Nosso escritório (visitas com hora marcada).</p>
                                    <p className="text-text-dark font-medium">Av. Faria Lima, 404, São Paulo - SP</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-20">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-text-dark">Perguntas Frequentes (FAQ)</h2>
                         <p className="text-md text-text-light mt-2">Encontre respostas rápidas para as dúvidas mais comuns.</p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <FaqItem question="Como funciona o período de teste do Plano PRO?">
                            <p>O Navalha Digital não possui um período de teste formal para o plano PRO. No entanto, o nosso Plano Grátis é robusto e totalmente funcional, permitindo que você experimente as funcionalidades essenciais de gestão de agenda e clientes sem custo e sem limite de tempo. Você pode fazer o upgrade para o PRO a qualquer momento para desbloquear recursos avançados como relatórios e destaque nas buscas.</p>
                        </FaqItem>
                        <FaqItem question="Posso cancelar minha assinatura a qualquer momento?">
                            <p>Sim! Você tem total liberdade para cancelar sua assinatura do Plano PRO quando quiser. Ao cancelar, você continuará com acesso a todos os recursos PRO até o final do seu ciclo de faturamento atual. Após essa data, sua conta será automaticamente migrada para o Plano Grátis, mantendo seus dados e agendamentos.</p>
                        </FaqItem>
                        <FaqItem question="Meus dados estão seguros na plataforma?">
                            <p>A segurança dos seus dados é nossa prioridade máxima. Utilizamos as melhores práticas de segurança do mercado, incluindo criptografia de ponta a ponta e servidores seguros, para proteger todas as informações da sua barbearia e de seus clientes. Seguimos rigorosamente a Lei Geral de Proteção de Dados (LGPD).</p>
                        </FaqItem>
                         <FaqItem question="O que acontece se eu ultrapassar o limite de 20 agendamentos no Plano Grátis?">
                            <p>Ao atingir o limite de 20 agendamentos no mês no Plano Grátis, o sistema não permitirá novos agendamentos online até o início do próximo mês. Você ainda terá acesso total ao seu painel para gerenciar os agendamentos existentes. Para continuar recebendo agendamentos sem interrupções, recomendamos fazer o upgrade para o Plano PRO, que oferece agendamentos ilimitados.</p>
                        </FaqItem>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;