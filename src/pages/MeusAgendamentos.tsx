import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultSiteConfig, SiteConfig } from '../content/siteContent'
import { loadSiteConfigFromDatabase } from '../services/siteConfig'
import { supabase } from '../services/supabase'

interface Appointment {
  id: string
  clientName: string
  phone: string
  professionalName: string
  serviceName: string
  date: string
  time: string
  duration: string
  status: string
  packageId?: string
  sessionDebited?: boolean
}

type DatabaseAppointment = {
  id: string
  client_name: string | null
  phone: string | null
  client_phone: string | null
  appointment_date: string
  appointment_time: string
  status: string | null
  package_id?: string | null
  session_debited?: boolean | null
  professionals: { name: string | null } | null
  services: { name: string | null; duration: number | string | null } | null
}

const onlyDigits = (value?: string | null) => String(value || '').replace(/\D/g, '')

const normalizePhone = (value?: string | null) => {
  const digits = onlyDigits(value)

  // Remove codigo do Brasil se vier salvo como 5511999999999
  if (digits.length === 13 && digits.startsWith('55')) {
    return digits.slice(2)
  }

  return digits
}

const phonesMatch = (savedPhone: string | null | undefined, searchedPhone: string) => {
  const saved = normalizePhone(savedPhone)
  const searched = normalizePhone(searchedPhone)

  if (!saved || !searched) return false

  // Comparacao exata, quando os dois estao no mesmo formato limpo
  if (saved === searched) return true

  // Comparacao por final do numero para ignorar DDD, 9 extra ou codigo 55
  const savedLast8 = saved.slice(-8)
  const searchedLast8 = searched.slice(-8)
  const savedLast9 = saved.slice(-9)
  const searchedLast9 = searched.slice(-9)

  return savedLast8 === searchedLast8 || savedLast9 === searchedLast9
}

const formatDateLabel = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'confirmado':
    case 'confirmed':
      return { badge: 'border border-green-400/30 bg-green-400/10 text-green-300', border: 'border-green-400/25' }
    case 'cancelado':
    case 'canceled':
      return { badge: 'border border-red-400/30 bg-red-400/10 text-red-300', border: 'border-red-400/25' }
    default:
      return { badge: 'border border-gold-400/30 bg-gold-400/10 text-gold-300', border: 'border-gold-400/25' }
  }
}

const getStatusLabel = (status: string | undefined, content: SiteConfig) => {
  switch (status) {
    case 'confirmado':
    case 'confirmed':
      return content.appointmentsPage.statusConfirmed
    case 'cancelado':
    case 'canceled':
      return content.appointmentsPage.statusCanceled
    default:
      return content.appointmentsPage.statusScheduled
  }
}



const canReturnPackageSession = (appointment: Appointment) => {
  const appointmentDate = new Date(`${appointment.date}T${appointment.time || '00:00'}:00`)
  const diffMs = appointmentDate.getTime() - Date.now()
  return diffMs >= 3 * 60 * 60 * 1000
}

const returnPackageSessionIfAllowed = async (appointment: Appointment) => {
  if (!appointment.packageId || !appointment.sessionDebited) {
    return false
  }

  const { data: packageData, error: packageReadError } = await supabase
    .from('maya_client_packages')
    .select('*')
    .eq('id', appointment.packageId)
    .maybeSingle()

  if (packageReadError) throw packageReadError
  if (!packageData) return false

  const currentUsed = Math.max(0, Number((packageData as any).sessions_used || 0))
  const canReturn = canReturnPackageSession(appointment)

  if (!canReturn) {
    await supabase.from('maya_package_sessions').insert({
      package_id: appointment.packageId,
      appointment_id: appointment.id,
      used_at: new Date().toISOString(),
      session_number: currentUsed,
      action: 'late_cancel',
      notes: 'Cancelamento com menos de 3 horas. A sessão foi mantida como usada.',
    })
    return false
  }

  const nextUsed = Math.max(0, currentUsed - 1)

  const { error: packageUpdateError } = await supabase
    .from('maya_client_packages')
    .update({ sessions_used: nextUsed, status: 'ativo' })
    .eq('id', appointment.packageId)

  if (packageUpdateError) throw packageUpdateError

  const { error: sessionReturnError } = await supabase.from('maya_package_sessions').insert({
    package_id: appointment.packageId,
    appointment_id: appointment.id,
    used_at: new Date().toISOString(),
    session_number: nextUsed,
    action: 'returned',
    notes: 'Sessão devolvida por cancelamento com mais de 3 horas de antecedência.',
  })

  if (sessionReturnError) throw sessionReturnError

  await supabase
    .from('maya_appointments')
    .update({ session_debited: false })
    .eq('id', appointment.id)

  return true
}

const MeusAgendamentos = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig)
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState('')

  useEffect(() => {
    loadSiteConfigFromDatabase()
      .then(setSiteConfig)
      .catch(() => setSiteConfig(defaultSiteConfig))
  }, [])

  useEffect(() => {
    document.title = `${siteConfig.appointmentsPage.title} - ${siteConfig.siteName}`
  }, [siteConfig.appointmentsPage.title, siteConfig.siteName])

  const formatPhone = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const searchAppointments = async () => {
    const digits = normalizePhone(phone)

    if (digits.length < 8) {
      setError(siteConfig.appointmentsPage.invalidPhoneError)
      return
    }

    setLoading(true)
    setError('')
    setCancelSuccess('')
    setSearched(false)

    try {
      // Busca todos os agendamentos nao cancelados e filtra o telefone no app.
      // Isso evita erro quando o telefone esta salvo com mascara, sem mascara,
      // com DDD, sem DDD ou com codigo 55.
      const { data, error: supabaseError } = await supabase
        .from('maya_appointments')
        .select(`
          id,
          client_name,
          phone,
          client_phone,
          appointment_date,
          appointment_time,
          status,
          package_id,
          session_debited,
          professionals:maya_professional(name),
          services:maya_services(name, duration)
        `)
        .not('status', 'in', '(cancelado,canceled)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (supabaseError) throw supabaseError

      const mapped: Appointment[] = ((data || []) as unknown as DatabaseAppointment[])
        .filter((item) => phonesMatch(item.phone, digits) || phonesMatch(item.client_phone, digits))
        .map((item) => ({
          id: item.id,
          clientName: item.client_name || '',
          phone: item.phone || item.client_phone || '',
          professionalName: item.professionals?.name || '',
          serviceName: item.services?.name || '',
          date: item.appointment_date,
          time: item.appointment_time?.slice(0, 5) || '',
          duration: item.services?.duration ? `${item.services.duration} min` : '',
          status: item.status || 'agendado',
          packageId: item.package_id || undefined,
          sessionDebited: item.session_debited === true,
        }))

      const today = new Date().toISOString().slice(0, 10)
      const upcoming = mapped.filter((a) => a.date >= today)

      setAppointments(upcoming)
      setSearched(true)
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(siteConfig.appointmentsPage.searchError)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (id: string) => {
    if (!confirm(siteConfig.appointmentsPage.cancelConfirm)) return

    setCancelingId(id)
    setError('')

    try {
      const appointment = appointments.find((item) => item.id === id)
      const returnedSession = appointment ? await returnPackageSessionIfAllowed(appointment) : false

      const { error: supabaseError } = await supabase
        .from('maya_appointments')
        .update({ status: 'cancelado' })
        .eq('id', id)

      if (supabaseError) throw supabaseError

      setAppointments((prev) => prev.filter((a) => a.id !== id))
      setCancelSuccess(returnedSession ? `${siteConfig.appointmentsPage.cancelSuccess} A sessão voltou para o pacote.` : appointment?.packageId ? `${siteConfig.appointmentsPage.cancelSuccess} Cancelamento com menos de 3 horas: a sessão do pacote foi mantida como usada.` : siteConfig.appointmentsPage.cancelSuccess)
    } catch (err) {
      console.error('Erro ao cancelar:', err)
      setError(siteConfig.appointmentsPage.cancelError)
    } finally {
      setCancelingId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') searchAppointments()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-dark-900">
      <div className="border-b border-gold-400/20 bg-dark-800/90 shadow-dark-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-serif text-xl font-bold text-gold-400 sm:text-2xl">{siteConfig.appointmentsPage.title}</h1>
            <p className="text-xs text-gray-400">{siteConfig.appointmentsPage.subtitle}</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300 transition-colors hover:bg-gold-400/15"
          >
            {siteConfig.buttons.backToSite}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-6 shadow-card">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/15">
              <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="font-serif text-lg font-bold text-gold-300">{siteConfig.appointmentsPage.phoneCardTitle}</h2>
            <p className="mt-1 text-sm text-gray-400">
              {siteConfig.appointmentsPage.phoneCardDescription}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onKeyDown={handleKeyDown}
              placeholder={siteConfig.appointmentsPage.phonePlaceholder}
              className="min-w-0 flex-1 rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-center text-base font-semibold tracking-wide text-gray-100 outline-none placeholder:font-normal placeholder:text-gray-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:text-lg"
            />
            <button
              type="button"
              onClick={searchAppointments}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gold-400 px-5 py-3 font-semibold text-dark-900 shadow-md shadow-gold-400/20 transition-colors hover:bg-gold-300 disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {cancelSuccess && (
          <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-950/30 px-4 py-3 text-center text-sm font-medium text-green-300">
            ✓ {cancelSuccess}
          </div>
        )}

        {searched && (
          <div className="mt-6">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 text-center shadow-card">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10">
                  <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-100">{siteConfig.appointmentsPage.emptyTitle}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {siteConfig.appointmentsPage.emptyDescription}
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-full bg-gold-400 px-6 py-2.5 text-sm font-semibold text-dark-900 shadow-md shadow-gold-400/20 transition-colors hover:bg-gold-300"
                >
                  {siteConfig.buttons.makeAppointment}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm font-medium text-gray-400">
                  {appointments.length}{' '}
                  {appointments.length > 1
                    ? siteConfig.appointmentsPage.foundPlural
                    : siteConfig.appointmentsPage.foundSingular}
                </p>

                {appointments.map((appointment) => {
                  const style = getStatusStyle(appointment.status)
                  const isCanceling = cancelingId === appointment.id

                  return (
                    <div
                      key={appointment.id}
                      className={`rounded-3xl border bg-dark-700 p-5 shadow-card ${style.border}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-100">{appointment.clientName}</p>
                          <p className="text-sm font-medium text-gold-300">{appointment.professionalName}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                          {getStatusLabel(appointment.status, siteConfig)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="capitalize">{formatDateLabel(appointment.date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appointment.time}{appointment.duration ? ` • ${appointment.duration}` : ''}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span>{appointment.serviceName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => cancelAppointment(appointment.id)}
                        disabled={isCanceling}
                        className="mt-4 w-full rounded-2xl border border-red-400/30 bg-red-950/30 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/50 disabled:opacity-60"
                      >
                        {isCanceling ? siteConfig.buttons.saving : siteConfig.buttons.cancelAppointment}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MeusAgendamentos
