import React from 'react';

const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary-blue mb-3 pb-2 border-b-2 border-primary-blue/30">{title}</h2>
        <div className="space-y-4 text-text-light leading-relaxed">
            {children}
        </div>
    </section>
);


const CookiePolicyPage: React.FC = () => {
    return (
        <div className="py-12 md:py-16 bg-white animate-fade-in-up">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-dark">Política de <span className="text-primary-blue">Cookies</span></h1>
                    <p className="text-lg text-text-light mt-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                
                <PolicySection title="1. O que são cookies?">
                    <p>Cookies são pequenos arquivos de texto que os sites que você visita colocam no seu dispositivo (computador, smartphone, tablet). Eles são amplamente utilizados para fazer os sites funcionarem, ou funcionarem de forma mais eficiente, bem como para fornecer informações aos proprietários do site.</p>
                </PolicySection>
                
                <PolicySection title="2. Como e por que usamos cookies?">
                    <p>Nós usamos cookies para melhorar a experiência de uso da plataforma Navalha Digital. Eles nos ajudam a entender como nosso site é usado e a personalizar o conteúdo para você.</p>
                    <p>Aqui estão os tipos de cookies que utilizamos:</p>
                    <ul className="list-disc list-inside ml-4">
                        <li>
                            <strong>Cookies Essenciais (Estritamente Necessários):</strong> Estes cookies são indispensáveis para o funcionamento da plataforma. Eles permitem que você navegue no site e use suas funcionalidades, como acessar áreas seguras (login) e manter sua sessão ativa. Sem esses cookies, os serviços que você solicitou não podem ser fornecidos.
                        </li>
                         <li>
                            <strong>Cookies de Desempenho e Análise:</strong> (Atualmente em simulação) Estes cookies coletam informações sobre como os visitantes usam nosso site, por exemplo, quais páginas os visitantes acessam com mais frequência e se eles recebem mensagens de erro de páginas da web. Esses cookies não coletam informações que identificam um visitante. Todas as informações que esses cookies coletam são agregadas e, portanto, anônimas. Elas são usadas apenas para melhorar o funcionamento do site.
                        </li>
                        <li>
                            <strong>Cookies de Funcionalidade:</strong> (Atualmente em simulação) Estes cookies permitem que o site se lembre das escolhas que você faz (como seu nome de usuário, idioma ou a região em que você está) e fornecem recursos aprimorados e mais pessoais. Por exemplo, eles podem ser usados para lembrar os detalhes do seu login ou preferências de filtro.
                        </li>
                    </ul>
                </PolicySection>

                <PolicySection title="3. Gerenciando suas preferências de cookies">
                    <p>A maioria dos navegadores permite que você controle os cookies através de suas configurações. Você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado.</p>
                    <p>No entanto, se você optar por bloquear todos os cookies (incluindo os essenciais), talvez não consiga acessar todas ou partes da nossa plataforma. A funcionalidade de login, por exemplo, depende de cookies para funcionar corretamente.</p>
                    <p>Para saber mais sobre cookies, incluindo como ver quais cookies foram configurados e como gerenciá-los e excluí-los, visite <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline">www.allaboutcookies.org</a>.</p>
                </PolicySection>

                <PolicySection title="4. Consentimento">
                     <p>Ao usar nossa plataforma, presumimos que você concorda com o uso de cookies essenciais. Para os outros tipos de cookies, solicitaremos seu consentimento através de um banner de consentimento (atualmente simulado pela aceitação da LGPD ao entrar no site pela primeira vez).</p>
                </PolicySection>
            </div>
        </div>
    );
};

export default CookiePolicyPage;
