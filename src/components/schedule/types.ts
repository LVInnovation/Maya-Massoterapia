export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface WeeklyRule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes?: 30 | 60;
  hasLunchBreak?: boolean;
  lunchStartTime?: string;
  lunchEndTime?: string;
}

export interface ScheduleBlock {
  id: string;
  date: string;
  type: 'full-day' | 'time-range';
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface MonthlySchedule {
  monthYear: string;
  weeklyRules: Record<WeekDay, WeeklyRule>;
  blocks: ScheduleBlock[];
  released?: boolean;
}