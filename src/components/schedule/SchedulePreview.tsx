import { MonthlySchedule, ScheduleBlock, WeekDay } from './types';

const weekdayFromIndex: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayLabel: Record<WeekDay, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom',
};

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getDaysInMonth = (monthYear: string) => {
  const [year, month] = monthYear.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const getDayInfo = (date: Date, schedule: MonthlySchedule) => {
  const dayKey = weekdayFromIndex[date.getDay()];
  const rule = schedule.weeklyRules[dayKey];
  const dateStr = formatDate(date);
  const blocks = schedule.blocks.filter((block) => block.date === dateStr);

  if (!rule.enabled) {
    return { status: 'Indisponível', color: 'bg-red-50 text-red-700' };
  }

  const fullDayBlock = blocks.find((block) => block.type === 'full-day');
  if (fullDayBlock) {
    return { status: 'Bloqueado', color: 'bg-yellow-50 text-yellow-700' };
  }

  const blockedRanges = blocks
    .filter((block) => block.type === 'time-range')
    .map((block) => `${block.startTime}–${block.endTime}`);

  const base = `${rule.startTime} às ${rule.endTime}`;
  const note = blockedRanges.length > 0 ? ` (bloqueado ${blockedRanges.join(', ')})` : '';

  return { status: `${base}${note}`, color: 'bg-green-50 text-green-700' };
};

const SchedulePreview = ({
  schedule,
}: {
  schedule: MonthlySchedule;
}) => {
  const dateCount = getDaysInMonth(schedule.monthYear);
  const dates = Array.from({ length: dateCount }, (_, index) => {
    const [year, month] = schedule.monthYear.split('-').map(Number);
    return new Date(year, month - 1, index + 1);
  });

  return (
    <div className="border border-[#2c2c2c] rounded-2xl p-4 bg-[#101010] h-full overflow-y-auto">
      <h4 className="text-sm font-semibold text-[#f4ecd6] mb-4">Visualização do mês</h4>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {dates.map((date) => {
          const dayInfo = getDayInfo(date, schedule);
          const isAvailable = dayInfo.color.includes('green');
          const isBlocked = dayInfo.color.includes('yellow');
          return (
            <div 
              key={date.toISOString()} 
              className={`rounded-2xl border-2 p-3 text-center transition-colors ${
                isAvailable 
                  ? 'border-green-500/30 bg-green-900/25' 
                  : isBlocked 
                  ? 'border-yellow-500/30 bg-yellow-900/20' 
                  : 'border-red-500/30 bg-red-900/25'
              }`}
            >
              <div className="text-xs font-semibold text-[#d5c9a1] mb-2">
                {dayLabel[weekdayFromIndex[date.getDay()]]}
              </div>
              <div className="text-lg font-bold text-white mb-2">
                {date.getDate()}
              </div>
              <div className={`rounded-lg px-2 py-1 text-xs font-medium text-center ${
                isAvailable 
                  ? 'text-green-200 bg-[#121212]' 
                  : isBlocked 
                  ? 'text-yellow-200 bg-[#121212]' 
                  : 'text-red-200 bg-[#121212]'
              }`}>
                {dayInfo.status.split(' ').slice(0, 1).join(' ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SchedulePreview;
