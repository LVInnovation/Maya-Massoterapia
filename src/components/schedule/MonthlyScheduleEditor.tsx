import { MonthlySchedule, WeeklyRule, WeekDay } from './types';

const weekDayLabels: Record<WeekDay, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const weekDays: WeekDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const getCurrentMonthYear = () => new Date().toISOString().slice(0, 7);

const createDefaultWeeklyRules = (): Record<WeekDay, WeeklyRule> => ({
  monday: {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  tuesday: {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  wednesday: {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  thursday: {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  friday: {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  saturday: {
    enabled: false,
    startTime: '09:00',
    endTime: '14:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  sunday: {
    enabled: false,
    startTime: '09:00',
    endTime: '14:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
});

const createWeeklySchedule = (): MonthlySchedule => ({
  monthYear: getCurrentMonthYear(),
  weeklyRules: createDefaultWeeklyRules(),
  blocks: [],
  released: true,
});

const MonthlyScheduleEditor = ({
  monthlySchedules,
  onChange,
}: {
  monthlySchedules: MonthlySchedule[];
  onChange: (updated: MonthlySchedule[]) => void;
}) => {
  const selectedSchedule = monthlySchedules[0] || createWeeklySchedule();

  const updateSelectedSchedule = (update: MonthlySchedule) => {
    onChange([
      {
        ...update,
        released: true,
        monthYear: getCurrentMonthYear(),
      },
    ]);
  };

  const handleRuleChange = (
    day: WeekDay,
    field: keyof WeeklyRule,
    value: string | boolean | number,
  ) => {
    updateSelectedSchedule({
      ...selectedSchedule,
      weeklyRules: {
        ...selectedSchedule.weeklyRules,
        [day]: {
          ...selectedSchedule.weeklyRules[day],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-[#2c2c2c] rounded-2xl p-4">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-[#f4ecd6]">
            Configuração semanal de dias e horários
          </h4>
          <p className="text-sm text-[#c8c2a4] mt-1">
            Configure os dias, horários, intervalo de agenda e horário de almoço.
          </p>
        </div>

        <div className="space-y-3">
          {weekDays.map((day) => {
            const rule = selectedSchedule.weeklyRules[day];

            return (
              <div
                key={day}
                className="grid gap-3 xl:grid-cols-[1fr_100px_1fr_1fr_150px_100px_1fr_1fr] items-center p-3 rounded-2xl border border-[#2c2c2c] bg-[#121212]"
              >
                <label className="text-sm font-medium text-[#f4ecd6]">
                  {weekDayLabels[day]}
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) =>
                      handleRuleChange(day, 'enabled', e.target.checked)
                    }
                    className="h-4 w-4 text-pink-500 rounded"
                  />
                  Trabalha
                </label>

                <input
                  type="time"
                  value={rule.startTime}
                  onChange={(e) =>
                    handleRuleChange(day, 'startTime', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-[#333] rounded-lg bg-[#111111] text-[#f4ecd6] focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  disabled={!rule.enabled}
                />

                <input
                  type="time"
                  value={rule.endTime}
                  onChange={(e) =>
                    handleRuleChange(day, 'endTime', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-[#333] rounded-lg bg-[#111111] text-[#f4ecd6] focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  disabled={!rule.enabled}
                />

                <select
                  value={rule.intervalMinutes || 30}
                  onChange={(e) =>
                    handleRuleChange(day, 'intervalMinutes', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#333] rounded-lg bg-[#111111] text-[#f4ecd6] focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  disabled={!rule.enabled}
                >
                  <option value={30}>30 em 30 min</option>
                  <option value={60}>1 em 1 hora</option>
                </select>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={rule.hasLunchBreak || false}
                    onChange={(e) =>
                      handleRuleChange(day, 'hasLunchBreak', e.target.checked)
                    }
                    className="h-4 w-4 text-pink-500 rounded"
                    disabled={!rule.enabled}
                  />
                  Almoço
                </label>

                <input
                  type="time"
                  value={rule.lunchStartTime || '12:00'}
                  onChange={(e) =>
                    handleRuleChange(day, 'lunchStartTime', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-[#333] rounded-lg bg-[#111111] text-[#f4ecd6] focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  disabled={!rule.enabled || !rule.hasLunchBreak}
                />

                <input
                  type="time"
                  value={rule.lunchEndTime || '13:00'}
                  onChange={(e) =>
                    handleRuleChange(day, 'lunchEndTime', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-[#333] rounded-lg bg-[#111111] text-[#f4ecd6] focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  disabled={!rule.enabled || !rule.hasLunchBreak}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyScheduleEditor;