export interface SiteService {
  id: string | number;
  name: string;
  description: string;
}

export interface SiteConfig {
  siteName: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  servicesBadge: string;
  servicesTitle: string;
  servicesSubtitle: string;
  services: SiteService[];
  header: {
    browserTitleSuffix: string;
    navHome: string;
    navProfessionals: string;
    navServices: string;
    navBooking: string;
    login: string;
    logout: string;
    admin: string;
    agenda: string;
    activePackages: string;
    notifications: string;
    openMenuAria: string;
    closeMenuAria: string;
  };
  home: {
    heroBadge: string;
    heroTitleStart: string;
    heroTitleHighlight: string;
    heroTitleEnd: string;
    heroSubtitle: string;
    professionalsBadge: string;
    professionalsTitle: string;
    professionalsSubtitle: string;
    ctaTitle: string;
    ctaSubtitle: string;
  };
  footer: {
    quickLinksTitle: string;
    quickHome: string;
    quickProfessionals: string;
    quickServices: string;
    quickBooking: string;
    contactTitle: string;
    copyrightSuffix: string;
  };
  buttons: {
    scheduleNow: string;
    viewProfessionals: string;
    myAppointments: string;
    viewSchedule: string;
    scheduleTime: string;
    makeAppointment: string;
    cancelAppointment: string;
    backToSite: string;
    confirmBooking: string;
    saving: string;
  };
  messages: {
    bookingToastTitle: string;
    bookingToastDescription: string;
    professionalFallbackName: string;
    professionalFallbackSpecialty: string;
    closeNoticeAria: string;
  };
  bookingModal: {
    eyebrow: string;
    title: string;
    subtitle: string;
    clientDataTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    selectionTitle: string;
    professionalLabel: string;
    serviceLabel: string;
    noServices: string;
    dateTimeTitle: string;
    dateTimeSubtitle: string;
    dateLabel: string;
    timeLabel: string;
    noDates: string;
    selectDateFirst: string;
    noTimes: string;
    summaryTitle: string;
    summaryProfessionalLabel: string;
    summaryServiceLabel: string;
    selectService: string;
    selectedDatePrefix: string;
    selectAvailableDate: string;
    selectedTimePrefix: string;
    selectAvailableTime: string;
    availableDaysSuffix: string;
    closeAria: string;
    requiredError: string;
    conflictError: string;
    phoneConflictError: string;
    blockedError: string;
    saveError: string;
    statusUnavailable: string;
    statusVacation: string;
    statusBlocked: string;
    statusPartial: string;
    statusAvailable: string;
    noSlotsReason: string;
  };
  appointmentsPage: {
    title: string;
    subtitle: string;
    phoneCardTitle: string;
    phoneCardDescription: string;
    phonePlaceholder: string;
    invalidPhoneError: string;
    searchError: string;
    cancelConfirm: string;
    cancelSuccess: string;
    cancelError: string;
    emptyTitle: string;
    emptyDescription: string;
    foundSingular: string;
    foundPlural: string;
    statusConfirmed: string;
    statusCanceled: string;
    statusScheduled: string;
  };
}

export const defaultSiteConfig: SiteConfig = {
  siteName: 'Mayà Massoterapia & Estética',
  footerDescription:
    'Agendamento premium para massoterapia, estética e bem-estar. Uma experiência elegante, acolhedora e profissional.',
  contactEmail: 'contato@mayamassoterapia.com',
  contactPhone: '(11) 99999-9999',
  servicesBadge: 'Bem-estar premium',
  servicesTitle: 'Nossos Serviços',
  servicesSubtitle:
    'Massoterapia profissional, estética facial e corporal em um ambiente sofisticado.',
  services: [
    { id: 1, name: 'Massoterapia', description: 'Relaxamento, alívio de tensões e bem-estar' },
    { id: 2, name: 'Drenagem Linfática', description: 'Cuidado corporal leve e profissional' },
    { id: 3, name: 'Estética Facial', description: 'Tratamentos para realçar sua beleza natural' },
    { id: 4, name: 'SPA e Bem-estar', description: 'Experiências de cuidado e sofisticação' },
  ],
  header: {
    browserTitleSuffix: 'Agendamento de Salão',
    navHome: 'Início',
    navProfessionals: 'Profissionais',
    navServices: 'Serviços',
    navBooking: 'Agendamento',
    login: 'Login',
    logout: 'Sair',
    admin: 'Admin',
    agenda: 'Agenda',
    activePackages: 'Pacotes Ativos',
    notifications: 'Notificações',
    openMenuAria: 'Abrir menu',
    closeMenuAria: 'Fechar menu',
  },
  home: {
    heroBadge: '✨ Sistema de Agendamento Massoterapia & Estética',
    heroTitleStart: 'Relaxe e aproveite com os',
    heroTitleHighlight: 'serviços',
    heroTitleEnd: 'especiais que você merece.',
    heroSubtitle:
      'Agende seus serviços de beleza de forma simples e refinada. Profissionais especializadas prontas para transformar seu visual.',
    professionalsBadge: 'Nossa Equipe ',
    professionalsTitle: 'Profissionais Especializadas',
    professionalsSubtitle:
      'Conte com profissionais experientes e dedicadas para cuidar da sua beleza com excelência.',
    ctaTitle: 'Pronto para uma transformação?',
    ctaSubtitle:
      'Agende seu horário agora e aproveite uma nova versão de si mesma.',
  },
  footer: {
    quickLinksTitle: 'Links Rápidos',
    quickHome: 'Início',
    quickProfessionals: 'Profissionais',
    quickServices: 'Serviços',
    quickBooking: 'Agendamento',
    contactTitle: 'Contato',
    copyrightSuffix: 'Todos os direitos reservados.',
  },
  buttons: {
    scheduleNow: 'Agendar agora',
    viewProfessionals: 'Ver profissionais',
    myAppointments: 'Meus agendamentos',
    viewSchedule: 'Ver agenda',
    scheduleTime: 'Agendar horário',
    makeAppointment: 'Fazer agendamento',
    cancelAppointment: 'Cancelar agendamento',
    backToSite: '← Voltar',
    confirmBooking: 'Confirmar agendamento',
    saving: 'Salvando...',
  },
  messages: {
    bookingToastTitle: 'Agendamento confirmado',
    bookingToastDescription: 'Seu horário foi reservado com sucesso.',
    professionalFallbackName: 'Profissional',
    professionalFallbackSpecialty: 'Especialidade não informada',
    closeNoticeAria: 'Fechar aviso',
  },
  bookingModal: {
    eyebrow: 'Agendamento Premium',
    title: 'Reserve seu horário',
    subtitle: 'Selecione profissional, serviço, data e horário.',
    clientDataTitle: 'Dados do cliente',
    nameLabel: 'Nome',
    namePlaceholder: 'Seu nome',
    phoneLabel: 'Telefone',
    phonePlaceholder: '(XX) XXXXX-XXXX',
    selectionTitle: 'Escolha profissional e serviço',
    professionalLabel: 'Profissional',
    serviceLabel: 'Serviço',
    noServices: 'Esta profissional ainda não possui serviços cadastrados.',
    dateTimeTitle: 'Escolha data e horário',
    dateTimeSubtitle: 'Toque em uma data e depois no horário.',
    dateLabel: 'Data',
    timeLabel: 'Horário',
    noDates: 'Nenhuma data encontrada para esta profissional.',
    selectDateFirst: 'Selecione uma data para ver os horários disponíveis.',
    noTimes: 'Não há horários disponíveis para esta data.',
    summaryTitle: 'Resumo',
    summaryProfessionalLabel: 'Profissional',
    summaryServiceLabel: 'Serviço',
    selectService: 'Selecione um serviço',
    selectedDatePrefix: 'Data escolhida',
    selectAvailableDate: 'Selecione uma data disponível',
    selectedTimePrefix: 'Horário escolhido',
    selectAvailableTime: 'Selecione um horário disponível',
    availableDaysSuffix: 'dias disponíveis até o mesmo dia do próximo mês.',
    closeAria: 'Fechar agendamento',
    requiredError: 'Preencha todos os campos para continuar.',
    conflictError:
      'Já existe um agendamento nesse intervalo com essa profissional. Escolha outro horário.',
    phoneConflictError:
      'Este telefone já possui um agendamento nesse mesmo dia e horário. Escolha outro horário.',
    blockedError: 'Serviço indisponível. Entre em contato.',
    saveError:
      'Não consegui salvar o agendamento. Verifique o armazenamento local do navegador.',
    statusUnavailable: 'Indisponível',
    statusVacation: 'Férias',
    statusBlocked: 'Bloqueado',
    statusPartial: 'Parcialmente disponível',
    statusAvailable: 'Disponível',
    noSlotsReason: 'Sem horários disponíveis',
  },
  appointmentsPage: {
    title: 'Meus Agendamentos',
    subtitle: 'Consulte e cancele seus horários',
    phoneCardTitle: 'Digite seu telefone',
    phoneCardDescription: 'Buscaremos todos os seus agendamentos futuros',
    phonePlaceholder: '(11) 99999-9999',
    invalidPhoneError: 'Digite um telefone válido.',
    searchError: 'Erro ao buscar agendamentos. Tente novamente.',
    cancelConfirm: 'Tem certeza que deseja cancelar este agendamento?',
    cancelSuccess: 'Agendamento cancelado com sucesso.',
    cancelError: 'Erro ao cancelar agendamento. Tente novamente.',
    emptyTitle: 'Nenhum agendamento encontrado',
    emptyDescription: 'Não encontramos agendamentos futuros para este número.',
    foundSingular: 'agendamento encontrado',
    foundPlural: 'agendamentos encontrados',
    statusConfirmed: 'Confirmado',
    statusCanceled: 'Cancelado',
    statusScheduled: 'Agendado',
  },
};

type AnyRecord = Record<string, any>;

const textOrDefault = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

const mergeObject = <T extends AnyRecord>(fallback: T, value?: Partial<T>): T =>
  Object.keys(fallback).reduce((result, key) => {
    const fallbackValue = fallback[key];
    const nextValue = value?.[key as keyof T];

    if (typeof fallbackValue === 'string') {
      result[key] = textOrDefault(nextValue, fallbackValue);
      return result;
    }

    if (Array.isArray(fallbackValue)) {
      result[key] = Array.isArray(nextValue) && nextValue.length ? nextValue : fallbackValue;
      return result;
    }

    result[key] = mergeObject(fallbackValue, nextValue as AnyRecord);
    return result;
  }, {} as AnyRecord) as T;

const normalizeServices = (services?: SiteService[]) => {
  const source = Array.isArray(services) && services.length ? services : defaultSiteConfig.services;

  return source.map((service, index) => {
    const fallback = defaultSiteConfig.services[index] ?? {
      id: service.id || index + 1,
      name: `Serviço ${index + 1}`,
      description: 'Descrição do serviço',
    };

    return {
      id: service.id || fallback.id,
      name: textOrDefault(service.name, fallback.name),
      description: textOrDefault(service.description, fallback.description),
    };
  });
};

export const normalizeSiteConfig = (value?: Partial<SiteConfig> | null): SiteConfig => {
  const merged = mergeObject(defaultSiteConfig, value || {});

  return {
    ...merged,
    servicesBadge: textOrDefault(value?.servicesBadge, merged.servicesBadge),
    servicesTitle: textOrDefault(value?.servicesTitle, merged.servicesTitle),
    servicesSubtitle: textOrDefault(value?.servicesSubtitle, merged.servicesSubtitle),
    services: normalizeServices(value?.services),
  };
};
