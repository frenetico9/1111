import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-gradient-to-br from-white to-light-blue p-6 text-center">
      <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 mb-8">
        <span className="absolute text-primary-blue opacity-10 text-[200px] sm:text-[250px] material-icons-outlined select-none">content_cut</span>
        <span className="absolute text-primary-blue opacity-30 text-[120px] sm:text-[150px] material-icons-outlined transform rotate-12 select-none">content_cut</span>
        <h1 className="relative text-7xl sm:text-9xl font-black text-primary-blue-dark select-none" style={{textShadow: '2px 2px 0px white, 4px 4px 0px rgba(0,0,0,0.05)'}}>404</h1>
      </div>

      <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark mb-4 -mt-4">Página Não Encontrada</h2>
      <p className="text-text-light mb-8 max-w-md mx-auto">
        Oops! Parece que a tesoura escorregou e cortamos o link errado. A página que você procura não existe ou foi movida.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <BackButton />
        <Link to="/">
          <Button variant="primary" size="md">
            <span className="material-icons-outlined mr-2">home</span>
            Ir para a Página Inicial
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;