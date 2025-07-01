import React, { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  endOfDay,
  isAfter,
  subMonths,
  startOfMonth,
  startOfDay,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Button from './Button';

interface DatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  highlightDates?: Date[];
  disabledDates?: Date[];
  availableWeekdays?: number[]; // 0 for Sunday, 1 for Monday...
  className?: string;
}

const ChevronLeftIcon = () => <span className="material-icons-outlined">chevron_left</span>;
const ChevronRightIcon = () => <span className="material-icons-outlined">chevron_right</span>;


const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  minDate: rawMinDate,
  maxDate: rawMaxDate,
  highlightDates = [],
  disabledDates = [],
  availableWeekdays = [0,1,2,3,4,5,6], // All days available by default
  className = ""
}) => {
  const minDate = rawMinDate ? startOfDay(rawMinDate) : undefined;
  const maxDate = rawMaxDate ? endOfDay(rawMaxDate) : undefined;
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate || minDate || new Date()));

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  }), [currentMonth]);

  const firstDayOfMonthOffset = getDay(startOfMonth(currentMonth)); 

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const isDateDisabled = (day: Date): boolean => {
    const dayStart = startOfDay(day);
    if (!availableWeekdays.includes(getDay(dayStart))) return true;
    if (minDate && isBefore(dayStart, minDate)) return true;
    if (maxDate && isAfter(dayStart, maxDate)) return true; // use isAfter for maxDate
    return disabledDates.some(disabledDate => isSameDay(startOfDay(disabledDate), dayStart));
  };

  const handleDateClick = (day: Date) => {
    if (isDateDisabled(day)) return;
    onChange(day);
  };

  const canGoPrev = !minDate || isAfter(currentMonth, startOfMonth(minDate));
  const canGoNext = !maxDate || isBefore(currentMonth, startOfMonth(maxDate));

  return (
    <div className={`p-4 bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-xs mx-auto ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handlePrevMonth} variant="ghost" size="sm" className="p-1.5" disabled={!canGoPrev} aria-label="Mês anterior">
            <ChevronLeftIcon />
        </Button>
        <span className="text-md font-semibold text-primary-blue capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <Button onClick={handleNextMonth} variant="ghost" size="sm" className="p-1.5" disabled={!canGoNext} aria-label="Próximo mês">
            <ChevronRightIcon />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayAbbr => (
          <div key={dayAbbr} className="font-medium">{dayAbbr}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonthOffset }).map((_, index) => (
          <div key={`empty-${index}`} className="p-1.5 rounded-full"></div>
        ))}
        {daysInMonth.map(day => {
          const isDisabled = isDateDisabled(day);
          const isSelected = selectedDate && isSameDay(startOfDay(day), startOfDay(selectedDate));
          // For highlight, ensure we compare startOfDay for consistency
          const isHighlighted = highlightDates.some(hd => isSameDay(startOfDay(hd), startOfDay(day)));

          let dayClasses = `p-1.5 rounded-full text-sm focus:outline-none transition-colors duration-150 aspect-square flex items-center justify-center font-medium `;
          if (isDisabled) {
            dayClasses += 'text-gray-300 cursor-not-allowed bg-gray-50';
          } else {
            dayClasses += 'hover:bg-light-blue cursor-pointer ';
            if (isSelected) {
              dayClasses += 'bg-primary-blue text-white font-semibold shadow-md';
            } else if (isHighlighted) {
              dayClasses += 'bg-green-100 text-green-700 font-medium ring-1 ring-green-300';
            } else {
              dayClasses += 'text-gray-700 hover:text-primary-blue';
            }
          }

          return (
            <button
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={dayClasses}
              aria-pressed={isSelected}
              aria-label={format(day, 'd MMMM yyyy', { locale: ptBR })}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DatePicker;