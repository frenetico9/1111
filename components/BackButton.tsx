import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

const BackButton: React.FC<{className?: string}> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(-1)}
      className={className}
      leftIcon={<span className="material-icons-outlined text-sm -ml-1 mr-1">arrow_back</span>}
    >
      Voltar
    </Button>
  );
};

export default BackButton;
