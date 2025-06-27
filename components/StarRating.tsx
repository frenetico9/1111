import React, { useState } from 'react';

interface StarRatingProps {
  count?: number;
  value: number; // Current rating
  onChange?: (rating: number) => void;
  size?: number; // font size of star
  color?: string; // color of filled star
  inactiveColor?: string; // color of empty star
  isEditable?: boolean;
  className?: string;
}

const StarIcon: React.FC<{
  filled: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  size: number;
  color: string;
  inactiveColor: string;
  isEditable: boolean;
}> = ({ filled, onClick, onMouseEnter, onMouseLeave, size, color, inactiveColor, isEditable }) => (
  <span
    onClick={isEditable ? onClick : undefined}
    onMouseEnter={isEditable ? onMouseEnter : undefined}
    onMouseLeave={isEditable ? onMouseLeave : undefined}
    style={{
      cursor: isEditable ? 'pointer' : 'default',
      color: filled ? color : inactiveColor,
      fontSize: `${size}px`,
      marginRight: `${size / 6}px`, // Adjust spacing between stars
      transition: 'color 0.1s ease-in-out, transform 0.1s ease-in-out',
      display: 'inline-block', // Ensures transform works
    }}
    className={isEditable && filled ? 'hover:transform hover:scale-125' : ''}
    role={isEditable ? "button" : "img"}
    aria-label={filled ? "Estrela preenchida" : "Estrela vazia"}
  >
    ★
  </span>
);


const StarRating: React.FC<StarRatingProps> = ({
  count = 5,
  value = 0,
  onChange,
  size = 24,
  color = "#FFC700", // Updated to accent-gold
  inactiveColor = "#E0E0E0", // A lighter gray for inactive
  isEditable = true,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rating: number) => {
    if (isEditable && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (isEditable) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (isEditable) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center ${className}`} aria-label={`Avaliação: ${value} de ${count} estrelas.`}>
      {Array.from({ length: count }, (_, i) => {
        const ratingValue = i + 1;
        return (
          <StarIcon
            key={i}
            filled={(hoverRating || value) >= ratingValue}
            onClick={() => handleClick(ratingValue)}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            size={size}
            color={color}
            inactiveColor={inactiveColor}
            isEditable={isEditable}
          />
        );
      })}
    </div>
  );
};

export default StarRating;