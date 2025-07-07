# Corte Certo Barbearia - Sistema de Agendamento

Este é o sistema de agendamento online e gestão para a **Corte Certo Barbearia**. A aplicação web foi projetada para modernizar e simplificar a gestão do nosso salão, oferecendo um ecossistema robusto com duas interfaces principais: um painel administrativo poderoso para os nossos gerentes e uma experiência de usuário fluida e intuitiva para os clientes.

O projeto foi construído para ser uma aplicação web moderna, responsiva e rica em funcionalidades, integrando tecnologias de ponta e focando em uma excelente experiência de usuário (UI/UX).

---

## Funcionalidades Principais

### Para a Gestão (Painel Admin)
- **Visão Geral (Dashboard):** Acompanhe métricas vitais como faturamento, número de agendamentos e avaliação média em um painel visualmente rico com gráficos.
- **Gestão de Agendamentos:** Crie, visualize, edite, cancele e marque agendamentos como concluídos. Filtre por data e status para ter controle total.
- **Gestão de Serviços:** Cadastre e edite os serviços oferecidos. Use o **Assistente de IA com Google Gemini API** para gerar sugestões criativas de novos serviços.
- **Gestão de Equipe:** Adicione barbeiros à nossa equipe, defina seus horários de trabalho específicos e atribua os serviços que cada um realiza.
- **Gestão de Clientes (CRM):** Acesse um histórico completo dos seus clientes, incluindo agendamentos passados e informações de contato.
- **Gestão de Avaliações:** Visualize e responda às avaliações deixadas pelos clientes, construindo uma reputação online positiva.
- **Página Pública Personalizável:** Configure as informações da barbearia, como horário de funcionamento e logo, que serão exibidas na página pública.

### Para Clientes
- **Agendamento Online 24/7:** Agende serviços a qualquer hora e de qualquer lugar, escolhendo o serviço, profissional (opcional), data e horário de forma simples e rápida.
- **Painel do Cliente:** Gerencie seus agendamentos futuros, veja seu histórico e deixe avaliações para os serviços concluídos.
- **Perfil Pessoal:** Atualize suas informações de contato e senha.

---

## Tecnologias Utilizadas
- **Frontend:** React, TypeScript, Tailwind CSS, React Router.
- **Backend (Simulado):** A persistência de dados é simulada utilizando Vercel Postgres (Neon DB), permitindo que os dados sejam mantidos entre as sessões. Todas as operações (CRUD) são feitas através de um `mockApiService` que interage com o banco de dados.
- **Inteligência Artificial:** Integração com a **Google Gemini API** para a funcionalidade de sugestão de serviços.

---

## Como Executar Localmente

**Pré-requisitos:** Node.js

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure a Chave da API do Gemini:**
    - Crie um arquivo chamado `.env.local` na raiz do projeto.
    - Dentro deste arquivo, adicione sua chave da API do Gemini:
      ```
      GEMINI_API_KEY=SUA_CHAVE_DE_API_AQUI
      ```

3.  **Execute a aplicação:**
    ```bash
    npm run dev
    ```