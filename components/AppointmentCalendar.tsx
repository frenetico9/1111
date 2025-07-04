import React from 'react';
import { Appointment } from '../types';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { addDays } from 'date-fns/addDays';
import { isSameDay } from 'date-fns/isSameDay';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';

interface AppointmentCalendarProps {
    appointments: Appointment[];
    currentDate: Date;
    onAppointmentClick: (appointment: Appointment) => void;
    onEmptySlotClick: (date: string, time: string) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
    appointments,
    currentDate,
    onAppointmentClick,
    onEmptySlotClick
}) => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const timeSlots = Array.from({ length: 28 }, (_, i) => { // 8:00 to 21:30
        const hour = 8 + Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });
    
    const getAppointmentsForSlot = (day: Date, time: string) => {
        return appointments.filter(app => 
            isSameDay(parseISO(app.date), day) && 
            app.time === time &&
            app.status === 'scheduled'
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-light-blue dark:border-gray-700 overflow-x-auto">
            <div className="grid grid-cols-8 min-w-[1000px]">
                {/* Time column header */}
                <div className="sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-b border-gray-200 dark:border-gray-700"></div>
                {/* Day headers */}
                {days.map(day => (
                    <div key={day.toString()} className="text-center p-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-primary-blue capitalize">{format(day, 'E', { locale: ptBR })}</p>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{format(day, 'dd')}</p>
                    </div>
                ))}

                {/* Time slots and appointments */}
                {timeSlots.map(time => (
                    <React.Fragment key={time}>
                        {/* Time label column */}
                        <div className="text-xs text-center text-gray-500 dark:text-gray-400 p-2 border-r border-t border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 z-10">
                            {time}
                        </div>
                        {/* Appointment slots for each day */}
                        {days.map(day => {
                            const slotAppointments = getAppointmentsForSlot(day, time);
                            return (
                                <div
                                    key={`${day.toString()}-${time}`}
                                    className="border-t border-r border-gray-200 dark:border-gray-700 p-1 min-h-[60px] relative transition-colors hover:bg-light-blue/50 dark:hover:bg-gray-700/50"
                                    onClick={() => slotAppointments.length === 0 && onEmptySlotClick(format(day, 'yyyy-MM-dd'), time)}
                                    role="button"
                                    aria-label={`Agendamentos para ${format(day, 'dd/MM')} às ${time}`}
                                >
                                    {slotAppointments.map(app => (
                                        <div 
                                            key={app.id}
                                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}
                                            className="bg-primary-blue text-white text-xs p-1.5 rounded-md mb-1 cursor-pointer hover:bg-primary-blue-dark"
                                        >
                                            <p className="font-bold truncate">{app.serviceName}</p>
                                            <p className="truncate">{app.clientName}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default AppointmentCalendar;
