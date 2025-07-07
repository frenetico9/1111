import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface LgpdConsentModalProps {
  onAccept: () => void;
}

const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({ onAccept }) => {
  return (
    <Modal 
      isOpen={true} 
      onClose={() => { /* Modal should not be closable by user action other than accept */ }} 
      title="Consentimento de Uso de Dados (LGPD)"
      closeOnEscape={false}
      closeOnClickOutside={false}
      size="lg"
    >
      <div className="space-y-3 text-sm text-text-light leading-relaxed">
        <p>
          Bem-vindo ao <strong>Navalha Digital</strong>! Para utilizarmos nossos serviços de agendamento e gestão para barbearias,
          precisamos do seu consentimento para coletar e processar seus dados pessoais, conforme descrito em nossa
          Política de Privacidade (simulada).
        </p>
        <p>
          Os dados coletados (como nome, e-mail, telefone e informações de agendamento) são utilizados exclusivamente para:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1 text-text-dark">
          <li>Permitir o agendamento de serviços nas barbearias parceiras.</li>
          <li>Facilitar a comunicação entre você e a barbearia selecionada.</li>
          <li>Melhorar sua experiência em nossa plataforma e fornecer suporte.</li>
          <li>Para administradores de barbearias, gerenciar seus negócios na plataforma.</li>
        </ul>
        <p>
          Seus dados não serão compartilhados com terceiros para fins não relacionados aos serviços oferecidos,
          exceto quando exigido por lei ou com seu consentimento explícito. Você pode gerenciar suas preferências de dados e solicitar
          a exclusão a qualquer momento, conforme nossa política.
        </p>
        <p className="font-medium text-text-dark">
          Ao clicar em "Aceitar e Continuar", você declara que leu e concorda com o uso dos seus dados
          conforme descrito.
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onAccept} variant="primary" size="md">
          Aceitar e Continuar
        </Button>
      </div>
    </Modal>
  );
};

export default LgpdConsentModal;