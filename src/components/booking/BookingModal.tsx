import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabase';
import { SiteConfig } from '../../content/siteContent';
import { MonthlySchedule } from '../schedule/types';

interface Service {
  id: string | number;
  name: string;
  duration: string;
  price: string;
  maxDailyBookings?: number;
  max_daily_bookings?: number | null;
}

interface WeeklyRule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes?: 30 | 60;
  hasLunchBreak?: boolean;
  lunchStartTime?: string;
  lunchEndTime?: string;
}

interface WorkSchedule {
  monday: WeeklyRule;
  tuesday: WeeklyRule;
  wednesday: WeeklyRule;
  thursday: WeeklyRule;
  friday: WeeklyRule;
  saturday: WeeklyRule;
  sunday: WeeklyRule;
}

interface VacationPeriod {
  enabled: boolean;
  startDate: string;
  endDate: string;
}

export interface Professional {
  id: string | number;
  name: string;
  specialty: string;
  status: 'active' | 'inactive';
  image: string;
  services: Service[];
  monthlySchedules?: MonthlySchedule[];
  schedule?: WorkSchedule;
  vacation?: VacationPeriod;
}

interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  professionalId: string | number;
  professionalName: string;
  serviceId: string | number;
  serviceName: string;
  date: string;
  time: string;
  duration?: string;
  createdAt?: string;
  packageId?: string;
  sessionDebited?: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  content: SiteConfig;
  professionals: Professional[];
  initialProfessionalId?: string | number | null;
  onClose: () => void;
  onSuccess?: (appointment: Appointment) => void;
}

const weekdayFromIndex = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

type WeekDay = typeof weekdayFromIndex[number];

const getCurrentMonthYear = () => new Date().toISOString().slice(0, 7);

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const fromMinutes = (minutes: number) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date: Date) => {
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
};

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const parseDurationMinutes = (duration: string) => {
  const parsed = parseInt(duration, 10);
  return Number.isNaN(parsed) ? 60 : parsed;
};

const rangesOverlap = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) => {
  return aStart < bEnd && bStart < aEnd;
};

const getWeekDayFromDateKey = (dateKey: string): WeekDay => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return weekdayFromIndex[date.getDay()];
};

const getLunchRange = (rule?: WeeklyRule | null) => {
  if (!rule?.hasLunchBreak || !rule.lunchStartTime || !rule.lunchEndTime) {
    return null;
  }

  return {
    start: toMinutes(rule.lunchStartTime),
    end: toMinutes(rule.lunchEndTime),
  };
};

const overlapsLunchBreak = (
  startTime: number,
  endTime: number,
  rule?: WeeklyRule | null,
) => {
  const lunchRange = getLunchRange(rule);

  return lunchRange
    ? startTime < lunchRange.end && endTime > lunchRange.start
    : false;
};

const normalizeWeeklyRules = (
  schedule?: WorkSchedule,
): Record<WeekDay, WeeklyRule> => ({
  monday: schedule?.monday ?? {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  tuesday: schedule?.tuesday ?? {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  wednesday: schedule?.wednesday ?? {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  thursday: schedule?.thursday ?? {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  friday: schedule?.friday ?? {
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  saturday: schedule?.saturday ?? {
    enabled: false,
    startTime: '09:00',
    endTime: '14:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
  sunday: schedule?.sunday ?? {
    enabled: false,
    startTime: '09:00',
    endTime: '14:00',
    intervalMinutes: 30,
    hasLunchBreak: false,
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
  },
});

const buildScheduleFromWork = (
  schedule?: WorkSchedule,
  monthYear = getCurrentMonthYear(),
): MonthlySchedule => ({
  monthYear,
  weeklyRules: normalizeWeeklyRules(schedule),
  blocks: [],
  released: true,
});

type DatabaseAppointment = {
  id: string;
  client_name: string;
  phone: string | null;
  client_phone?: string | null;
  professional_id: string;
  professional_name?: string | null;
  service_id: string | null;
  service_name?: string | null;
  appointment_date: string;
  appointment_time: string;
  created_at?: string | null;
  status?: string | null;
  professionals?: { name: string | null } | null;
  services?: { name: string | null; duration: number | string | null } | null;
};

const mapDatabaseAppointment = (appointment: DatabaseAppointment): Appointment => ({
  id: appointment.id,
  clientName: appointment.client_name,
  phone: appointment.phone || appointment.client_phone || '',
  professionalId: appointment.professional_id,
  professionalName: appointment.professionals?.name || appointment.professional_name || '',
  serviceId: appointment.service_id || '',
  serviceName: appointment.services?.name || appointment.service_name || '',
  date: appointment.appointment_date,
  time: appointment.appointment_time?.slice(0, 5) || '',
  duration: appointment.services?.duration ? `${appointment.services.duration} min` : '',
  createdAt: appointment.created_at || '',
});

const loadAppointmentsFromDatabase = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('maya_appointments')
    .select(`
      id,
      client_name,
      phone,
      client_phone,
      professional_id,
      service_id,
      appointment_date,
      appointment_time,
      created_at,
      status,
      professionals:maya_professional(name),
      services:maya_services(name,duration)
    `)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error) throw error;

  return ((data || []) as unknown as DatabaseAppointment[])
    .filter((appointment) => {
      const status = String(appointment.status || '').toLowerCase();
      return status !== 'cancelado' && status !== 'canceled';
    })
    .map(mapDatabaseAppointment);
};

const getRollingAvailableDates = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setMonth(limitDate.getMonth() + 1);

  const dates: Date[] = [];
  const current = new Date(today);

  while (current <= limitDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const dayLabels: Record<WeekDay, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom',
};

const buildAutomaticSchedule = (
  professional?: Professional,
): MonthlySchedule | null => {
  if (!professional) return null;

  if (professional.monthlySchedules?.length) {
    const baseSchedule = professional.monthlySchedules[0];
    const allBlocks = professional.monthlySchedules.flatMap(
      (schedule) => schedule.blocks ?? [],
    );

    return {
      ...baseSchedule,
      monthYear: getCurrentMonthYear(),
      weeklyRules: baseSchedule.weeklyRules,
      blocks: allBlocks,
      released: true,
    };
  }

  return buildScheduleFromWork(professional.schedule, getCurrentMonthYear());
};

const isDateInVacation = (dateKey: string, vacation?: VacationPeriod) => {
  if (!vacation?.enabled || !vacation.startDate || !vacation.endDate) {
    return false;
  }

  return dateKey >= vacation.startDate && dateKey <= vacation.endDate;
};

const getAvailableDates = (
  schedule: MonthlySchedule,
  content: SiteConfig,
  vacation?: VacationPeriod,
) => {
  const dates = getRollingAvailableDates();

  return dates.map((date) => {
    const dayKey = weekdayFromIndex[date.getDay()];
    const rule = schedule.weeklyRules[dayKey];
    const dateKey = toLocalDateKey(date);

    const fullDayBlock = schedule.blocks.some(
      (block) => block.date === dateKey && block.type === 'full-day',
    );

    const vacationBlocked = isDateInVacation(dateKey, vacation);

    const blockedRanges = schedule.blocks
      .filter(
        (block) => block.date === dateKey && block.type === 'time-range',
      )
      .map((block) => ({
        start: toMinutes(block.startTime ?? '00:00'),
        end: toMinutes(block.endTime ?? '00:00'),
      }));

    return {
      date,
      dateKey,
      label: `${formatDateLabel(date)} • ${dayLabels[dayKey]}`,
      available: rule.enabled && !fullDayBlock && !vacationBlocked,
      reason: !rule.enabled
        ? content.bookingModal.statusUnavailable
        : vacationBlocked
          ? content.bookingModal.statusVacation
          : fullDayBlock
            ? content.bookingModal.statusBlocked
            : blockedRanges.length > 0
              ? content.bookingModal.statusPartial
              : content.bookingModal.statusAvailable,
      blockedRanges,
      startTime: rule.startTime,
      endTime: rule.endTime,
    };
  });
};



const getServiceDailyLimit = (service?: Service | null) => {
  const raw = service?.maxDailyBookings ?? service?.max_daily_bookings ?? 0;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const isServiceDailyLimitReached = (
  appointments: Appointment[],
  serviceId: string | number,
  selectedDate: string,
  service?: Service | null,
) => {
  const limit = getServiceDailyLimit(service);
  if (!limit) return false;

  const usedToday = appointments.filter(
    (appointment) =>
      appointment.date === selectedDate &&
      String(appointment.serviceId) === String(serviceId),
  ).length;

  return usedToday >= limit;
};

type ClientPackage = {
  id: string;
  client_name?: string | null;
  package_name?: string | null;
  package_code?: string | null;
  total_sessions: number | string | null;
  sessions_used: number | string | null;
  status?: string | null;
  expiration_date?: string | null;
  purchase_date?: string | null;
  serviceIds?: string[];
  serviceNames?: string[];
};

const normalizePackageCode = (value: string) => value.trim().toUpperCase();

const getPackageByCode = async (code: string, service: Service) => {
  const packageCode = normalizePackageCode(code);
  if (!packageCode) return null;

  const { data: packageData, error: packageError } = await supabase
    .from('maya_client_packages')
    .select('*')
    .eq('package_code', packageCode)
    .maybeSingle();

  if (packageError) throw packageError;
  if (!packageData) throw new Error('PACKAGE_NOT_FOUND');

  const packageItem = packageData as ClientPackage;
  const today = toLocalDateKey(new Date());
  const total = Number(packageItem.total_sessions || 0);
  const used = Number(packageItem.sessions_used || 0);

  if (packageItem.status !== 'ativo') throw new Error('PACKAGE_INACTIVE');
  if (packageItem.expiration_date && packageItem.expiration_date < today) throw new Error('PACKAGE_EXPIRED');
  if (used >= total) throw new Error('PACKAGE_EMPTY');

  const { data: links, error: linksError } = await supabase
    .from('maya_package_services')
    .select('service_id, services:maya_services(name)')
    .eq('package_id', packageItem.id);

  if (linksError) throw linksError;

  const serviceIds = ((links || []) as any[]).map((link) => String(link.service_id));
  const serviceNames = ((links || []) as any[]).map((link) => link.services?.name).filter(Boolean);

  if (!serviceIds.includes(String(service.id))) {
    const error = new Error('PACKAGE_SERVICE_MISMATCH');
    (error as any).serviceNames = serviceNames;
    throw error;
  }

  return { ...packageItem, serviceIds, serviceNames };
};

const debitPackageSession = async (packageItem: ClientPackage, appointmentId: string, serviceName: string, serviceId?: string | number) => {
  const total = Number(packageItem.total_sessions || 0);
  const used = Number(packageItem.sessions_used || 0);
  const nextUsed = Math.min(total, used + 1);
  const nextStatus = nextUsed >= total ? 'finalizado' : 'ativo';

  const { error: sessionError } = await supabase.from('maya_package_sessions').insert({
    package_id: packageItem.id,
    appointment_id: appointmentId,
    used_at: new Date().toISOString(),
    session_number: nextUsed,
    service_id: serviceId ? String(serviceId) : null,
    action: 'used',
    notes: `Sessão debitada automaticamente no agendamento de ${serviceName}.`,
  });

  if (sessionError) throw sessionError;

  const { error: packageError } = await supabase
    .from('maya_client_packages')
    .update({ sessions_used: nextUsed, status: nextStatus })
    .eq('id', packageItem.id);

  if (packageError) throw packageError;
};

const getAvailableTimeSlots = (
  schedule: MonthlySchedule,
  selectedDate: string,
  durationMinutes: number,
  appointments: Appointment[],
  professionalId: string | number,
  vacation?: VacationPeriod,
  service?: Service | null,
) => {
  if (!selectedDate || !schedule) return [];

  if (service && isServiceDailyLimitReached(appointments, service.id, selectedDate, service)) return [];

  if (isDateInVacation(selectedDate, vacation)) return [];

  const dayKey = getWeekDayFromDateKey(selectedDate);
  const rule = schedule.weeklyRules[dayKey];

  if (!rule.enabled) return [];

  const fullDayBlock = schedule.blocks.some(
    (block) => block.date === selectedDate && block.type === 'full-day',
  );

  if (fullDayBlock) return [];

  const blockedRanges = schedule.blocks
    .filter(
      (block) => block.date === selectedDate && block.type === 'time-range',
    )
    .map((block) => ({
      start: toMinutes(block.startTime ?? '00:00'),
      end: toMinutes(block.endTime ?? '00:00'),
    }));

  const dayStart = toMinutes(rule.startTime);
  const dayEnd = toMinutes(rule.endTime);
  const lastStart = dayEnd - durationMinutes;
  const intervalMinutes = rule.intervalMinutes || 30;

  const lunchRange = getLunchRange(rule);

  if (lastStart < dayStart) return [];

  const existingAppointments = appointments
    .filter(
      (item) =>
        String(item.professionalId) === String(professionalId) && item.date === selectedDate,
    )
    .map((item) => {
      const start = toMinutes(item.time);
      const duration = parseDurationMinutes(item.duration ?? '60');

      return {
        start,
        end: start + duration,
      };
    });

  const slots: string[] = [];

  for (
    let current = dayStart;
    current <= lastStart;
    current += intervalMinutes
  ) {
    const startTime = current;
    const endTime = current + durationMinutes;

    if (endTime > dayEnd) continue;

    const isBlocked = blockedRanges.some((block) =>
      rangesOverlap(startTime, endTime, block.start, block.end),
    );

    const isLunchTime = lunchRange
      ? startTime < lunchRange.end && endTime > lunchRange.start
      : false;

    const hasConflict = existingAppointments.some((appointment) =>
      rangesOverlap(startTime, endTime, appointment.start, appointment.end),
    );

    if (isBlocked || isLunchTime || hasConflict) continue;

    slots.push(fromMinutes(startTime));
  }

  return slots;
};

const BookingModal = ({
  isOpen,
  content,
  professionals,
  initialProfessionalId,
  onClose,
  onSuccess,
}: BookingModalProps) => {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [packagePreview, setPackagePreview] = useState<ClientPackage | null>(null);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(
        3,
      )}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(
      3,
      7,
    )}-${numbers.slice(7, 11)}`;
  };

  const [professionalId, setProfessionalId] = useState<string | number>(
    initialProfessionalId ?? professionals[0]?.id ?? '',
  );

  const [serviceId, setServiceId] = useState<string | number>(
    professionals[0]?.services[0]?.id ?? '',
  );

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProfessional = useMemo(
    () =>
      professionals.find((professional) => String(professional.id) === String(professionalId)) ??
      professionals[0],
    [professionalId, professionals],
  );

  const selectedSchedule = useMemo(
    () => buildAutomaticSchedule(selectedProfessional),
    [selectedProfessional],
  );

  const selectedService = selectedProfessional?.services.find(
    (service) => String(service.id) === String(serviceId),
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadAppointments = async () => {
      try {
        setAppointments(await loadAppointmentsFromDatabase());
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        setAppointments([]);
      }
    };

    loadAppointments();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const availableDates = useMemo(() => {
    if (!selectedSchedule || !selectedProfessional || !selectedService) {
      return [];
    }

    const duration = parseDurationMinutes(selectedService.duration);
    return getAvailableDates(
      selectedSchedule,
      content,
      selectedProfessional.vacation,
    ).map((item) => {
      if (!item.available) return item;

      const slots = getAvailableTimeSlots(
        selectedSchedule,
        item.dateKey,
        duration,
        appointments,
        selectedProfessional.id,
        selectedProfessional.vacation,
        selectedService,
      );

      return {
        ...item,
        available: slots.length > 0,
        reason: slots.length > 0 ? item.reason : content.bookingModal.noSlotsReason,
      };
    });
  }, [selectedSchedule, selectedProfessional, selectedService, appointments, content]);

  const appointmentSlots = useMemo(() => {
    const duration = parseDurationMinutes(selectedService?.duration ?? '60');

    return selectedSchedule
      ? getAvailableTimeSlots(
          selectedSchedule,
          selectedDate,
          duration,
          appointments,
          selectedProfessional?.id ?? '',
          selectedProfessional?.vacation,
          selectedService,
        )
      : [];
  }, [selectedSchedule, selectedDate, selectedService, selectedProfessional, appointments]);

  useEffect(() => {
    if (!isOpen || !selectedProfessional) return;

    const service = selectedProfessional.services[0];

    setProfessionalId(initialProfessionalId ?? selectedProfessional.id);
    setServiceId(service?.id ?? '');
    setSelectedDate('');
    setSelectedTime('');
    setClientName('');
    setPhone('');
    setPackageCode('');
    setPackagePreview(null);
    setError('');
  }, [isOpen, initialProfessionalId, selectedProfessional]);

  const handleProfessionalChange = (value: string) => {
    const id = value;
    const professional = professionals.find((item) => String(item.id) === String(id));

    if (!professional) return;

    const service = professional.services[0];

    setProfessionalId(id);
    setServiceId(service?.id ?? '');
    setSelectedDate('');
    setSelectedTime('');
    setPackageCode('');
    setPackagePreview(null);
    setError('');
  };

  const handleSubmit = async (event?: FormEvent, packageOverride?: ClientPackage | null) => {
    event?.preventDefault();
    setError('');

    if (
      !clientName.trim() ||
      !phone.trim() ||
      !selectedProfessional ||
      !selectedService ||
      !selectedDate ||
      !selectedTime
    ) {
      setError(content.bookingModal.requiredError);
      return;
    }

    if (isServiceDailyLimitReached(appointments, selectedService.id, selectedDate, selectedService)) {
      setError(`O limite diário para ${selectedService.name} já foi atingido nesta data.`);
      return;
    }

    const duration = parseDurationMinutes(selectedService.duration);
    const selectedStart = toMinutes(selectedTime);
    const selectedEnd = selectedStart + duration;
    const selectedRule = selectedSchedule
      ? selectedSchedule.weeklyRules[getWeekDayFromDateKey(selectedDate)]
      : null;
    const selectedDayBlocks = selectedSchedule.blocks
      .filter(
        (block) => block.date === selectedDate && block.type === 'time-range',
      )
      .map((block) => ({
        start: toMinutes(block.startTime ?? '00:00'),
        end: toMinutes(block.endTime ?? '00:00'),
      }));
    const fullDayBlocked = selectedSchedule.blocks.some(
      (block) => block.date === selectedDate && block.type === 'full-day',
    );
    const blockedBySchedule =
      fullDayBlocked ||
      overlapsLunchBreak(selectedStart, selectedEnd, selectedRule) ||
      selectedDayBlocks.some((block) =>
        rangesOverlap(selectedStart, selectedEnd, block.start, block.end),
      );

    if (blockedBySchedule || !appointmentSlots.includes(selectedTime)) {
      setError(content.bookingModal.noSlotsReason);
      return;
    }

    const conflict = appointments.some((appointment) => {
      if (
        String(appointment.professionalId) !== String(selectedProfessional.id) ||
        appointment.date !== selectedDate
      ) {
        return false;
      }

      const appointmentStart = toMinutes(appointment.time);
      const appointmentDuration = parseDurationMinutes(
        appointment.duration ?? '60',
      );
      const appointmentEnd = appointmentStart + appointmentDuration;

      return rangesOverlap(
        selectedStart,
        selectedEnd,
        appointmentStart,
        appointmentEnd,
      );
    });

    if (conflict) {
      setError(
        content.bookingModal.conflictError,
      );
      return;
    }

    const typedPhone = normalizePhone(phone);

    const phoneConflict = appointments.some((appointment) => {
      if (
        normalizePhone(appointment.phone) !== typedPhone ||
        appointment.date !== selectedDate
      ) {
        return false;
      }

      const appointmentStart = toMinutes(appointment.time);
      const appointmentDuration = parseDurationMinutes(
        appointment.duration ?? '60',
      );
      const appointmentEnd = appointmentStart + appointmentDuration;

      return rangesOverlap(
        selectedStart,
        selectedEnd,
        appointmentStart,
        appointmentEnd,
      );
    });

    if (phoneConflict) {
      setError(
        content.bookingModal.phoneConflictError,
      );
      return;
    }

    const { data: blockedClient, error: blockedError } = await supabase
      .from('maya_blocked_clients')
      .select('id')
      .eq('professional_id', String(selectedProfessional.id))
      .eq('phone', typedPhone)
      .maybeSingle();

    if (blockedError) throw blockedError;

    if (blockedClient) {
      setError(content.bookingModal.blockedError);
      return;
    }

    const newBooking: Appointment = {
      id: `${selectedProfessional.id}-${selectedDate}-${selectedTime}-${Date.now()}`,
      clientName: clientName.trim(),
      phone: phone.trim(),
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: selectedDate,
      time: selectedTime,
      duration: selectedService.duration,
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);

      const typedPackageCode = normalizePackageCode(packageCode);
      if (typedPackageCode && packageOverride === undefined) {
        try {
          const packageData = await getPackageByCode(typedPackageCode, selectedService);
          setPackagePreview(packageData);
          return;
        } catch (packageError) {
          const serviceNames = (packageError as any).serviceNames as string[] | undefined;
          const packageMessage = packageError instanceof Error ? packageError.message : '';
          if (packageMessage === 'PACKAGE_NOT_FOUND') setError('Código de pacote não encontrado. Confira o código ou agende normalmente sem preencher o campo.');
          else if (packageMessage === 'PACKAGE_INACTIVE') setError('Este pacote não está ativo. Agende normalmente ou fale com a profissional.');
          else if (packageMessage === 'PACKAGE_EXPIRED') setError('Este pacote está vencido. Agende normalmente ou fale com a profissional.');
          else if (packageMessage === 'PACKAGE_EMPTY') setError('Este pacote não possui sessões restantes.');
          else if (packageMessage === 'PACKAGE_SERVICE_MISMATCH') setError(`Este pacote não inclui o serviço escolhido. Serviços inclusos: ${serviceNames?.join(', ') || 'não informado'}.`);
          else throw packageError;
          return;
        }
      }

      const usablePackage = packageOverride || null;

      const { data, error: insertError } = await supabase
        .from('maya_appointments')
        .insert({
          client_name: newBooking.clientName,
          phone: newBooking.phone,
          professional_id: String(newBooking.professionalId),
          service_id: String(newBooking.serviceId),
          appointment_date: newBooking.date,
          appointment_time: newBooking.time,
          status: 'agendado',
          package_id: usablePackage?.id || null,
          package_code: usablePackage?.package_code || null,
          session_debited: Boolean(usablePackage),
        })
        .select('id,created_at')
        .single();

      if (insertError) throw insertError;

      const savedBooking = {
        ...newBooking,
        id: data?.id || newBooking.id,
        createdAt: data?.created_at || newBooking.createdAt,
        packageId: usablePackage?.id,
        sessionDebited: Boolean(usablePackage),
      };

      if (usablePackage) {
        await debitPackageSession(usablePackage, savedBooking.id, selectedService.name, selectedService.id);
      }

      setAppointments((current) => [...current, savedBooking]);
      setError('');
      setClientName('');
      setPhone('');
      setPackageCode('');
      setPackagePreview(null);
      setSelectedDate('');
      setSelectedTime('');
      onSuccess?.(savedBooking);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      setError(content.bookingModal.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const availableCount = availableDates.filter((item) => item.available).length;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-dark-900/70 p-0 sm:p-6">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-dark-700 shadow-dark-lg ring-1 ring-gold-400/10 sm:h-auto sm:max-h-[92dvh] sm:max-w-5xl sm:rounded-3xl">
        <div className="shrink-0 border-b border-gold-400/20 bg-dark-700 px-3 py-3 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold-400 sm:text-sm font-semibold">
                {content.bookingModal.eyebrow}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold leading-tight text-gold-300 sm:text-2xl font-serif">
                {content.bookingModal.title}
              </h2>
              <p className="mt-0.5 max-w-md text-[11px] leading-snug text-gray-400 sm:text-sm">
                {content.bookingModal.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={content.bookingModal.closeAria}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-dark-600 text-lg leading-none text-gray-400 transition hover:border-gold-400 hover:text-gold-400"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24 sm:px-6 sm:py-5 sm:pb-6">
          <div className="space-y-2.5 sm:space-y-6">
            <form
              id="booking-form"
              onSubmit={handleSubmit}
              className="space-y-2.5 sm:space-y-6"
            >
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-3xl border border-gold-400/20 bg-dark-600 p-3 sm:p-5">
                  <h3 className="text-sm font-semibold text-gold-300 mb-3">
                    {content.bookingModal.clientDataTitle}
                  </h3>

                  <div className="space-y-2.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {content.bookingModal.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      className="w-full rounded-2xl border border-gold-400/20 bg-dark-500 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      placeholder={content.bookingModal.namePlaceholder}
                      required
                    />
                  </div>

                  <div className="mt-2 space-y-2.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {content.bookingModal.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(formatPhone(event.target.value))
                      }
                      className="w-full rounded-2xl border border-gold-400/20 bg-dark-500 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      placeholder={content.bookingModal.phonePlaceholder}
                      required
                    />
                  </div>

                  <div className="mt-2 space-y-2.5">
                    <label className="block text-xs font-medium text-gray-300">
                      Código do pacote <span className="font-normal text-gray-500">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={packageCode}
                      onChange={(event) => {
                        setPackageCode(event.target.value.toUpperCase());
                        setPackagePreview(null);
                      }}
                      className="w-full rounded-2xl border border-gold-400/20 bg-dark-500 px-3 py-2 text-sm uppercase tracking-wider text-gray-100 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      placeholder="Ex.: MAYA-8K42"
                    />
                    <p className="text-[11px] leading-snug text-gray-500">
                      Preencha somente se quiser usar uma sessão de pacote. Sem código, o agendamento segue avulso.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-gold-400/20 bg-dark-600 p-3 sm:p-5">
                  <h3 className="mb-3 text-sm font-semibold text-gold-300">
                    {content.bookingModal.selectionTitle}
                  </h3>

                  <div className="space-y-2.5">
                    <span className="block text-xs font-medium text-gray-300">
                      {content.bookingModal.professionalLabel}
                    </span>

                    <div className="grid gap-2">
                      {professionals.map((professional) => {
                        const isSelected = String(professional.id) === String(professionalId);

                        return (
                          <button
                            key={professional.id}
                            type="button"
                            onClick={() => handleProfessionalChange(String(professional.id))}
                            className={`flex items-center gap-2 rounded-2xl border p-2 text-left transition ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400/10 ring-2 ring-gold-400/30'
                                : 'border-gold-400/20 bg-dark-600 hover:border-gold-400/50 hover:bg-dark-500'
                            }`}
                          >
                            <img
                              src={professional.image}
                              alt={professional.name}
                              className="h-9 w-9 shrink-0 rounded-full object-cover object-top"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-gray-100">
                                {professional.name || content.messages.professionalFallbackName}
                              </span>
                              <span className="block truncate text-[11px] text-gray-400">
                                {professional.specialty || content.messages.professionalFallbackSpecialty}
                              </span>
                            </span>

                            {isSelected && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs text-dark-900">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <span className="block text-xs font-medium text-gray-300">
                      {content.bookingModal.serviceLabel}
                    </span>

                    <div className="grid gap-2">
                      {selectedProfessional?.services.map((service) => {
                        const isSelected = String(service.id) === String(serviceId);

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setServiceId(service.id);
                              setSelectedDate('');
                              setSelectedTime('');
                              setError('');
                            }}
                            className={`rounded-2xl border p-2 text-left transition ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400 text-dark-900 shadow-md shadow-gold-400/30'
                                : 'border-gold-400/20 bg-dark-600 text-gray-100 hover:border-gold-400/50 hover:bg-dark-500'
                            }`}
                          >
                            <span className="block truncate text-sm font-semibold">
                              {service.name}
                            </span>
                            <span
                              className={`mt-0.5 block text-[11px] ${
                                isSelected ? 'text-dark-700' : 'text-gray-400'
                              }`}
                            >
                              {service.duration} min • {service.price}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {!selectedProfessional?.services.length && (
                      <div className="rounded-xl border border-gold-400/20 bg-dark-700/80 p-3 text-xs text-gray-300">
                        {content.bookingModal.noServices}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <section className="rounded-xl border border-gold-400/20 bg-dark-700/70 p-3 sm:p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-100">
                      {content.bookingModal.dateTimeTitle}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                      {content.bookingModal.dateTimeSubtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-sm font-medium text-gray-200">
                    {content.bookingModal.dateLabel}
                  </span>

                  {availableDates.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {availableDates.map((item) => {
                        const isSelected = selectedDate === item.dateKey;

                        return (
                          <button
                            key={item.dateKey}
                            type="button"
                            disabled={!item.available}
                            onClick={() => {
                              setSelectedDate(item.dateKey);
                              setSelectedTime('');
                              setError('');
                            }}
                            className={`rounded-2xl border px-2 py-1.5 text-left transition sm:px-4 sm:py-3 ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400 text-dark-900 shadow-md shadow-gold-400/30'
                                : item.available
                                  ? 'border-gold-400/20 bg-dark-600 text-gray-100 hover:border-gold-400/50 hover:bg-dark-500'
                                  : 'cursor-not-allowed border-gold-400/10 bg-dark-800 text-gray-400/80 opacity-70'
                            }`}
                          >
                            <span className="block text-xs font-semibold sm:text-sm">
                              {item.label}
                            </span>
                            <span
                              className={`mt-0.5 block text-[11px] sm:mt-1 sm:text-xs ${
                                isSelected
                                  ? 'text-dark-700'
                                  : item.available
                                    ? 'text-gold-300'
                                    : 'text-gray-400'
                              }`}
                            >
                              {item.available ? content.bookingModal.statusAvailable : item.reason}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gold-400/20 bg-dark-700/80 p-3 text-xs text-gray-300">
                      {content.bookingModal.noDates}
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2.5">
                  <span className="text-sm font-medium text-gray-200">
                    {content.bookingModal.timeLabel}
                  </span>

                  {!selectedDate ? (
                    <div className="rounded-2xl border border-gold-400/20 bg-dark-700/80 p-3 text-xs text-gray-300">
                      {content.bookingModal.selectDateFirst}
                    </div>
                  ) : appointmentSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                      {appointmentSlots.map((time) => {
                        const isSelected = selectedTime === time;

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              setSelectedTime(time);
                              setError('');
                            }}
                            className={`rounded-xl border px-2 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400 text-dark-900 shadow-md shadow-gold-400/30'
                                : 'border-gold-400/20 bg-dark-600 text-gray-100 hover:border-gold-400/50 hover:bg-dark-500'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gold-400/20 bg-dark-700/80 p-3 text-xs text-gray-300">
                      {content.bookingModal.noTimes}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-3 rounded-2xl bg-red-950/40 p-3 text-xs text-red-400 border border-red-400/30">
                    {error}
                  </div>
                )}
              </section>

              <section className="hidden rounded-3xl border border-gold-400/20 bg-gold-400/5 p-3 sm:block sm:p-5">
                <h3 className="text-xs font-semibold text-gold-300">
                  {content.bookingModal.summaryTitle}
                </h3>

                <div className="mt-2 space-y-1 text-[11px] text-gray-300 sm:space-y-2 sm:text-sm">
                  <p>
                    {content.bookingModal.summaryProfessionalLabel}:{' '}
                    {selectedProfessional?.name || content.messages.professionalFallbackName}
                  </p>
                  <p>
                    {content.bookingModal.summaryServiceLabel}:{' '}
                    {selectedService?.name || content.bookingModal.selectService}
                  </p>
                  <p>
                    {selectedDate
                      ? `${content.bookingModal.selectedDatePrefix}: ${selectedDate}`
                      : content.bookingModal.selectAvailableDate}
                  </p>
                  <p>
                    {selectedTime
                      ? `${content.bookingModal.selectedTimePrefix}: ${selectedTime}`
                      : content.bookingModal.selectAvailableTime}
                  </p>
                </div>
              </section>
            </form>
          </div>
        </div>

        <div className="shrink-0 border-t border-gold-400/20 bg-dark-700 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
              {availableCount} {content.bookingModal.availableDaysSuffix}
            </p>

            <button
              type="submit"
              form="booking-form"
              disabled={isSaving}
              className="w-full rounded-full bg-gold-400 px-4 py-3 text-sm font-semibold text-dark-900 shadow-md shadow-gold-400/20 transition hover:bg-gold-300 hover:shadow-gold-glow disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
            >
              {isSaving ? content.buttons.saving : content.buttons.confirmBooking}
            </button>
          </div>
        </div>
      </div>

      {packagePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gold-400/25 bg-dark-700 p-5 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">Pacote encontrado</p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-gold-300">
              {packagePreview.package_name || 'Pacote'}
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              Cliente: <strong className="text-gray-100">{packagePreview.client_name || clientName}</strong>
            </p>
            <div className="mt-4 rounded-2xl border border-gold-400/15 bg-dark-800 p-3 text-sm text-gray-300">
              <p><strong className="text-gray-100">Código:</strong> <span className="font-mono text-gold-300">{packagePreview.package_code}</span></p>
              <p><strong className="text-gray-100">Sessões restantes:</strong> {Math.max(0, Number(packagePreview.total_sessions || 0) - Number(packagePreview.sessions_used || 0))} de {Number(packagePreview.total_sessions || 0)}</p>
              <p><strong className="text-gray-100">Validade:</strong> {packagePreview.expiration_date ? packagePreview.expiration_date.split('-').reverse().join('/') : 'Sem validade'}
              </p>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Serviços inclusos</p>
              <div className="flex flex-wrap gap-2">
                {(packagePreview.serviceNames || []).map((name) => (
                  <span key={name} className="rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">{name}</span>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-300">
              Deseja usar 1 sessão deste pacote para confirmar o agendamento?
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSubmit(undefined, packagePreview)}
                disabled={isSaving}
                className="rounded-2xl bg-gold-400 px-4 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300 disabled:opacity-60"
              >
                Usar pacote
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentPreview = packagePreview;
                  setPackagePreview(null);
                  handleSubmit(undefined, null);
                  void currentPreview;
                }}
                disabled={isSaving}
                className="rounded-2xl border border-gold-400/30 px-4 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/10 disabled:opacity-60"
              >
                Agendar avulso
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPackagePreview(null)}
              className="mt-3 w-full rounded-2xl border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingModal;
