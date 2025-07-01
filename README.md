# Navalha Digital - Plataforma de Agendamento para Barbearias

Navalha Digital é uma aplicação web completa, projetada para modernizar e simplificar a gestão de barbearias e salões de beleza masculinos. A plataforma oferece um ecossistema robusto com duas interfaces principais: um painel administrativo poderoso para os donos de barbearia e uma experiência de usuário fluida e intuitiva para os clientes.

O projeto foi construído para demonstrar a criação de uma aplicação web moderna, responsiva e rica em funcionalidades, integrando tecnologias de ponta e focando em uma excelente experiência de usuário (UI/UX).

---

## Funcionalidades Principais

### Para Donos de Barbearia (Painel Admin)
- **Visão Geral (Dashboard):** Acompanhe métricas vitais como faturamento, número de agendamentos e avaliação média em um painel visualmente rico com gráficos.
- **Gestão de Agendamentos:** Crie, visualize, edite, cancele e marque agendamentos como concluídos. Filtre por data e status para ter controle total.
- **Gestão de Serviços:** Cadastre, edite, ative ou desative os serviços oferecidos.
- **Gestão de Equipe:** Adicione barbeiros à sua equipe, defina seus horários de trabalho específicos e atribua os serviços que cada um realiza.
- **Gestão de Clientes (CRM):** Acesse um histórico completo dos seus clientes, incluindo agendamentos passados e informações de contato.
- **Gestão de Avaliações:** Visualize e responda às avaliações deixadas pelos clientes, construindo uma reputação online positiva.
- **Gestão de Assinatura:** Gerencie o plano de assinatura da barbearia, com opções de um plano Grátis e um plano PRO com funcionalidades avançadas.
- **Página Pública Personalizável:** Configure as informações da sua barbearia, como horário de funcionamento e logo, que serão exibidas na sua página pública.

### Para Clientes
- **Busca de Barbearias:** Encontre as melhores barbearias com filtros por nome, cidade e avaliação. Barbearias com plano PRO ganham destaque nos resultados.
- **Agendamento Online 24/7:** Agende serviços a qualquer hora e de qualquer lugar, escolhendo o serviço, profissional (opcional), data e horário de forma simples e rápida.
- **Painel do Cliente:** Gerencie seus agendamentos futuros, veja seu histórico e deixe avaliações para os serviços concluídos.
- **Perfil Pessoal:** Atualize suas informações de contato e senha.

---

## Tecnologias Utilizadas
- **Frontend:** React, TypeScript, Tailwind CSS, React Router.
- **Backend (Simulado):** A persistência de dados é simulada utilizando Vercel Postgres (Neon DB), permitindo que os dados sejam mantidos entre as sessões. Todas as operações (CRUD) são feitas através de um `mockApiService` que interage com o banco de dados.
