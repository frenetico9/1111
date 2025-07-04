import React from 'react';

const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary-blue mb-3 pb-2 border-b-2 border-primary-blue/30">{title}</h2>
        <div className="space-y-4 text-text-light leading-relaxed">
            {children}
        </div>
    </section>
);


const TermsOfUsePage: React.FC = () => {
    return (
        <div className="py-12 md:py-16 bg-white animate-fade-in-up">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-dark">Termos de <span className="text-primary-blue">Uso</span></h1>
                    <p className="text-lg text-text-light mt-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <PolicySection title="1. Aceitação dos Termos">
                    <p>Ao se cadastrar e utilizar a plataforma Navalha Digital ("Plataforma"), você concorda em cumprir e estar legalmente vinculado a estes Termos de Uso. Se você não concorda com estes termos, não utilize a Plataforma.</p>
                </PolicySection>
                
                <PolicySection title="2. Descrição do Serviço">
                    <p>O Navalha Digital é uma plataforma que conecta clientes a barbearias ("Estabelecimentos"), permitindo que os clientes encontrem e agendem serviços online, e que os Estabelecimentos gerenciem seus negócios, incluindo agenda, equipe, serviços e clientes.</p>
                    <p>O Navalha Digital atua como um intermediário. Não somos responsáveis pela qualidade dos serviços prestados pelos Estabelecimentos ou pela conduta de seus funcionários. Qualquer disputa relacionada ao serviço prestado deve ser resolvida diretamente entre o cliente e o Estabelecimento.</p>
                </PolicySection>

                <PolicySection title="3. Responsabilidades dos Usuários">
                    <p><strong>Todos os Usuários (Clientes e Estabelecimentos):</strong></p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Você é responsável por manter a confidencialidade de sua senha e conta.</li>
                        <li>Você concorda em fornecer informações verdadeiras, precisas e completas durante o cadastro.</li>
                        <li>É proibido usar a Plataforma para qualquer finalidade ilegal ou não autorizada.</li>
                    </ul>
                    <p><strong>Clientes:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Ao agendar um serviço, você se compromete a comparecer no horário marcado. Cancelamentos devem ser feitos com a antecedência estipulada pelo Estabelecimento.</li>
                        <li>O pagamento pelos serviços é feito diretamente ao Estabelecimento, conforme as condições por ele definidas.</li>
                    </ul>
                    <p><strong>Estabelecimentos:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Você é o único responsável pela qualidade, preço e execução dos serviços oferecidos.</li>
                        <li>Você deve manter suas informações (horários, serviços, preços) atualizadas na Plataforma.</li>
                        <li>Você é responsável pelo tratamento dos dados dos clientes que agendam com você, em conformidade com a LGPD.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="4. Planos e Pagamentos (Para Estabelecimentos)">
                    <p>Oferecemos um plano gratuito e um plano pago ("Plano PRO"). As funcionalidades e limites de cada plano estão descritos na nossa página de <a href="#/plans" className="text-primary-blue hover:underline">Planos</a>.</p>
                    <p>Ao assinar o Plano PRO, você concorda em pagar as taxas de assinatura mensais. As cobranças são recorrentes e serão feitas no método de pagamento cadastrado. Você pode cancelar sua assinatura a qualquer momento, e o cancelamento se tornará efetivo no final do ciclo de faturamento atual.</p>
                </PolicySection>

                <PolicySection title="5. Limitação de Responsabilidade">
                    <p>O Navalha Digital não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou da incapacidade de usar a Plataforma, incluindo, mas não se limitando a, disputas entre clientes e Estabelecimentos, lucros cessantes ou perda de dados.</p>
                </PolicySection>

                <PolicySection title="6. Propriedade Intelectual">
                    <p>Todo o conteúdo da Plataforma, incluindo o logotipo, design, textos e software, é propriedade exclusiva do Navalha Digital e protegido por leis de direitos autorais. Você não pode copiar, modificar ou distribuir qualquer parte da Plataforma sem nossa permissão expressa.</p>
                </PolicySection>

                <PolicySection title="7. Modificação dos Termos">
                    <p>Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Se fizermos alterações, publicaremos os termos revisados na Plataforma e atualizaremos a data da "Última atualização". O uso continuado da Plataforma após tais alterações constitui sua aceitação dos novos termos.</p>
                </PolicySection>

            </div>
        </div>
    );
};

export default TermsOfUsePage;
