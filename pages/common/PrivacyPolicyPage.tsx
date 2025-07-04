import React from 'react';

const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary-blue mb-3 pb-2 border-b-2 border-primary-blue/30">{title}</h2>
        <div className="space-y-4 text-text-light leading-relaxed">
            {children}
        </div>
    </section>
);

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="py-12 md:py-16 bg-white animate-fade-in-up">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-dark">Política de <span className="text-primary-blue">Privacidade</span></h1>
                    <p className="text-lg text-text-light mt-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                
                <PolicySection title="1. Introdução">
                    <p>A sua privacidade é importante para nós. É política do Navalha Digital respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar na nossa plataforma. Esta política de privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais.</p>
                </PolicySection>
                
                <PolicySection title="2. Coleta de Dados">
                    <p>Coletamos informações que você nos fornece diretamente, bem como dados gerados automaticamente durante o uso da plataforma.</p>
                    <ul className="list-disc list-inside ml-4">
                        <li><strong>Informações de Cadastro (Clientes e Barbearias):</strong> Nome, e-mail, telefone, senha de acesso. Para barbearias, coletamos também o nome do negócio, endereço e nome do responsável.</li>
                        <li><strong>Informações de Agendamento:</strong> Detalhes dos serviços agendados, datas, horários, profissional escolhido e eventuais observações.</li>
                        <li><strong>Dados de Uso:</strong> Informações sobre como você interage com a nossa plataforma, como páginas visitadas, cliques e tempo de permanência, para melhorar sua experiência.</li>
                        <li><strong>Cookies e Tecnologias Semelhantes:</strong> Utilizamos cookies para manter sua sessão ativa e entender suas preferências. Consulte nossa <a href="#/cookie-policy" className="text-primary-blue hover:underline">Política de Cookies</a> para mais detalhes.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="3. Uso das Informações">
                    <p>As informações que coletamos são usadas para os seguintes propósitos:</p>
                    <ul className="list-disc list-inside ml-4">
                        <li><strong>Operação da Plataforma:</strong> Para criar e gerenciar sua conta, processar agendamentos e facilitar a comunicação entre clientes e barbearias.</li>
                        <li><strong>Comunicação:</strong> Para enviar confirmações, lembretes de agendamento, notificações importantes sobre sua conta e responder às suas solicitações de suporte.</li>
                        <li><strong>Melhoria e Personalização:</strong> Para entender como nossos usuários utilizam a plataforma, personalizar sua experiência e desenvolver novas funcionalidades.</li>
                        <li><strong>Segurança:</strong> Para proteger contra fraudes, abusos e garantir a segurança da nossa plataforma e dos nossos usuários.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="4. Compartilhamento de Dados">
                    <p>Nós não vendemos suas informações pessoais. O compartilhamento ocorre apenas nas seguintes circunstâncias:</p>
                    <ul className="list-disc list-inside ml-4">
                        <li><strong>Com as Barbearias:</strong> Quando um cliente faz um agendamento, compartilhamos suas informações de contato e do agendamento com a barbearia selecionada para que o serviço possa ser prestado.</li>
                        <li><strong>Provedores de Serviço:</strong> Podemos compartilhar informações com empresas terceirizadas que nos auxiliam na operação da plataforma (ex: provedores de hospedagem, serviços de e-mail), que são contratualmente obrigadas a proteger seus dados.</li>
                        <li><strong>Obrigações Legais:</strong> Podemos divulgar suas informações se exigido por lei ou em resposta a processos legais válidos.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="5. Seus Direitos (LGPD)">
                    <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:</p>
                     <ul className="list-disc list-inside ml-4">
                        <li>Confirmar a existência de tratamento dos seus dados.</li>
                        <li>Acessar seus dados.</li>
                        <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                        <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
                        <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço.</li>
                        <li>Revogar o consentimento a qualquer momento.</li>
                    </ul>
                    <p>Para exercer seus direitos, entre em contato conosco através do e-mail <a href="mailto:privacidade@navalhadigital.com" className="text-primary-blue hover:underline">privacidade@navalhadigital.com</a>.</p>
                </PolicySection>
                 <PolicySection title="6. Alterações na Política de Privacidade">
                    <p>Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações, publicando a nova política nesta página. Recomendamos que você revise esta página periodicamente para quaisquer alterações.</p>
                </PolicySection>

            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
