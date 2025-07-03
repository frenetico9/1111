import React from 'react';
import Button from './Button';

interface TimeSlotPickerProps {
  availableSlots: string[]; // e.g., ["09:00", "09:30"]
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  loading?: boolean;
  slotsPerRow?: 2 | 3 | 4;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  availableSlots,
  selectedSlot,
  onSelectSlot,
  loading = false,
  slotsPerRow,
}) => {
  if (loading) {
     return <p className="text-center text-gray-500 dark:text-gray-400 my-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">Carregando horários...</p>;
  }

  if (!availableSlots || availableSlots.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 my-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">Nenhum horário disponível para esta data/seleção.</p>;
  }
  
  const gridClasses = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
  };
  const gridClass = slotsPerRow ? gridClasses[slotsPerRow] : 'grid-cols-3 sm:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm max-h-60 overflow-y-auto`}>
      {availableSlots.map(slot => (
        <Button
          key={slot}
          onClick={() => onSelectSlot(slot)}
          variant={selectedSlot === slot ? 'primary' : 'outline'}
          size="sm"
          className={`w-full text-xs sm:text-sm ${selectedSlot === slot ? 'font-semibold' : 'font-normal border-primary-blue/70 hover:border-primary-blue'}`}
          aria-pressed={selectedSlot === slot}
        >
          {slot}
        </Button>
      ))}
    </div>
  );
};

export default TimeSlotPicker;