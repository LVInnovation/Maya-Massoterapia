import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { isAuthenticated } from '../lib/auth'

type PackageStatus = 'ativo' | 'finalizado' | 'vencido' | 'cancelado'

interface ServiceOption {
  id: string | number
  name: string
}

interface ClientPackage {
  id: string
  clientId: string
  clientName: string
  phone: string
  normalizedPhone: string
  packageName: string
  packageCode: string
  totalSessions: number
  sessionsUsed: number
  purchaseDate: string
  expirationDate: string
  status: PackageStatus
  serviceIds: string[]
  serviceNames: string[]
  createdAt?: string
}

interface PackageSession {
  id: string
  packageId: string
  usedAt: string
  sessionNumber: number
  action: string
  notes?: string
}

interface PackageForm {
  clientName: string
  phone: string
  packageName: string
  serviceIds: string[]
  totalSessions: string
  purchaseDate: string
  expirationDate: string
}

type PackageCreationErrorStage = 'package' | 'services'

type PackageCreationError = Error & {
  stage?: PackageCreationErrorStage
  rollbackError?: Error | null
  details?: unknown
}

const statusOptions: Array<{ value: PackageStatus; label: string }> = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const onlyDigits = (value?: string | null) => String(value || '').replace(/\D/g, '')

const normalizePhone = (value?: string | null) => {
  const digits = onlyDigits(value)
  if (digits.length === 13 && digits.startsWith('55')) return digits.slice(2)
  return digits
}

const todayKey = () => new Date().toISOString().slice(0, 10)

const datePlusDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const defaultPackageForm = (): PackageForm => ({
  clientName: '',
  phone: '',
  packageName: '',
  serviceIds: [],
  totalSessions: '10',
  purchaseDate: todayKey(),
  expirationDate: datePlusDays(90),
})

const createPackageCreationError = (
  stage: PackageCreationErrorStage,
  message: string,
  options?: Partial<PackageCreationError>,
) => {
  const error = new Error(message) as PackageCreationError
  error.stage = stage
  if (options) Object.assign(error, options)
  return error
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const toStatus = (value?: string | null): PackageStatus => {
  if (value === 'finalizado' || value === 'vencido' || value === 'cancelado') return value
  return 'ativo'
}

const getSessionsRemaining = (item: Pick<ClientPackage, 'totalSessions' | 'sessionsUsed'>) =>
  Math.max(0, item.totalSessions - item.sessionsUsed)

const resolvePackageStatus = (item: ClientPackage): PackageStatus => {
  if (item.status === 'cancelado' || item.status === 'finalizado') return item.status
  if (getSessionsRemaining(item) === 0) return 'finalizado'
  if (item.expirationDate && item.expirationDate < todayKey()) return 'vencido'
  return 'ativo'
}

const generatePackageCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let index = 0; index < 5; index += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `MAYA-${suffix}`
}

const statusStyles: Record<PackageStatus, string> = {
  ativo: 'border-green-400/30 bg-green-400/10 text-green-300',
  finalizado: 'border-gold-400/30 bg-gold-400/10 text-gold-300',
  vencido: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
  cancelado: 'border-red-400/30 bg-red-400/10 text-red-300',
}

const inputClass = 'rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30'

const mapSession = (row: any): PackageSession => ({
  id: String(row.id),
  packageId: String(row.package_id),
  usedAt: row.used_at || row.created_at || '',
  sessionNumber: Number(row.session_number || 0),
  action: row.action || 'used',
  notes: row.notes || '',
})

const PacotesAtivos = () => {
  const isAdmin = isAuthenticated()
  const [packages, setPackages] = useState<ClientPackage[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [sessionsByPackageId, setSessionsByPackageId] = useState<Record<string, PackageSession[]>>({})
  const [statusFilter, setStatusFilter] = useState<PackageStatus>('ativo')
  const [search, setSearch] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [form, setForm] = useState<PackageForm>(defaultPackageForm())
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadPackages = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [packagesResponse, servicesResponse, packageServicesResponse, sessionsResponse] = await Promise.all([
        supabase.from('maya_client_packages').select('*').order('created_at', { ascending: false }),
        supabase.from('maya_services').select('id,name').order('name', { ascending: true }),
        supabase.from('maya_package_services').select('*'),
        supabase.from('maya_package_sessions').select('*').order('used_at', { ascending: false }),
      ])

      if (packagesResponse.error) throw packagesResponse.error
      if (servicesResponse.error) throw servicesResponse.error
      if (packageServicesResponse.error) throw packageServicesResponse.error
      if (sessionsResponse.error) throw sessionsResponse.error

      const serviceOptions = ((servicesResponse.data || []) as any[]).map((service) => ({
        id: service.id,
        name: service.name || 'Serviço',
      }))
      setServices(serviceOptions)

      const serviceNameById = serviceOptions.reduce<Record<string, string>>((result, service) => {
        result[String(service.id)] = service.name
        return result
      }, {})

      const linksByPackageId = ((packageServicesResponse.data || []) as any[]).reduce<Record<string, string[]>>((result, link) => {
        const packageId = String(link.package_id)
        result[packageId] = result[packageId] || []
        result[packageId].push(String(link.service_id))
        return result
      }, {})

      const normalizedPackages = ((packagesResponse.data || []) as any[]).map((row) => {
        const linkedServiceIds = linksByPackageId[String(row.id)] || []
        const item: ClientPackage = {
          id: String(row.id),
          clientId: String(row.client_id || ''),
          clientName: row.client_name || '',
          phone: row.phone || '',
          normalizedPhone: row.normalized_phone || normalizePhone(row.phone),
          packageName: row.package_name || '',
          packageCode: row.package_code || row.code || '',
          totalSessions: Number(row.total_sessions || 0),
          sessionsUsed: Number(row.sessions_used || 0),
          purchaseDate: row.purchase_date || '',
          expirationDate: row.expiration_date || '',
          status: toStatus(row.status),
          serviceIds: linkedServiceIds,
          serviceNames: linkedServiceIds.map((id) => serviceNameById[id]).filter(Boolean),
          createdAt: row.created_at,
        }
        return { ...item, status: resolvePackageStatus(item) }
      })

      await Promise.all(
        normalizedPackages
          .filter((item, index) => item.status !== toStatus((packagesResponse.data || [])[index]?.status))
          .map((item) => supabase.from('maya_client_packages').update({ status: item.status }).eq('id', item.id)),
      )

      const sessions = ((sessionsResponse.data || []) as any[]).map(mapSession)
      setSessionsByPackageId(
        sessions.reduce<Record<string, PackageSession[]>>((result, session) => {
          result[session.packageId] = result[session.packageId] || []
          result[session.packageId].push(session)
          return result
        }, {}),
      )
      setPackages(normalizedPackages)
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error)
      setMessage('Não consegui carregar os pacotes ativos. Confira se o SQL de pacotes foi rodado no Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  useEffect(() => {
    document.title = 'Pacotes Ativos - Mayà Massoterapia & Estética'
  }, [])

  const visiblePackages = useMemo(() => {
    const term = search.trim().toLowerCase()
    const searchedPhone = normalizePhone(search)

    return packages
      .filter((item) => item.status === statusFilter)
      .filter((item) => {
        if (!term) return isAdmin
        if (!isAdmin) return searchedPhone.length >= 8 && item.normalizedPhone === searchedPhone
        return [
          item.clientName,
          item.phone,
          item.normalizedPhone,
          item.packageName,
          item.packageCode,
          item.serviceNames.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      })
  }, [packages, search, statusFilter, isAdmin])

  const selectedPackage = packages.find((item) => item.id === selectedPackageId) || null
  const selectedSessions = selectedPackage ? sessionsByPackageId[selectedPackage.id] || [] : []

  const updateForm = (update: Partial<PackageForm>) => {
    setForm((current) => ({ ...current, ...update }))
    setMessage('')
  }

  const toggleService = (serviceId: string) => {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId],
    }))
    setMessage('')
  }

  const copyPackageCode = async (code: string) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setMessage(`Código ${code} copiado.`)
    } catch {
      setMessage(`Código do pacote: ${code}`)
    }
  }

  const openRenewForm = (item: ClientPackage) => {
    setForm({
      clientName: item.clientName,
      phone: item.phone,
      packageName: item.packageName,
      serviceIds: item.serviceIds,
      totalSessions: String(item.totalSessions || 10),
      purchaseDate: todayKey(),
      expirationDate: datePlusDays(90),
    })
    setSelectedPackageId(null)
    setShowPackageForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage('Revise as datas e salve para renovar com um novo código.')
  }

  const handleCreatePackage = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')

    let packageCode = ''

    try {
      const normalizedPhone = normalizePhone(form.phone)
      const totalSessions = Number(form.totalSessions)
      const selectedServices = services.filter((service) => form.serviceIds.includes(String(service.id)))
      const selectedServiceIds = selectedServices.map((service) => service.id)

      if (!form.clientName.trim() || !normalizedPhone || normalizedPhone.length < 8) {
        setMessage('Informe nome e telefone válido da cliente.')
        return
      }

      if (!form.packageName.trim() || !totalSessions || totalSessions < 1) {
        setMessage('Informe nome do pacote e quantidade de sessões.')
        return
      }

      if (selectedServiceIds.length === 0) {
        setMessage('Selecione pelo menos um serviço incluso no pacote.')
        return
      }

      if (selectedServiceIds.length !== form.serviceIds.length) {
        setMessage('Um ou mais serviços selecionados não estão mais disponíveis. Atualize a página e tente novamente.')
        return
      }

      const { data: existingClient } = await supabase
        .from('maya_clients')
        .select('*')
        .eq('normalized_phone', normalizedPhone)
        .maybeSingle()

      let clientId = existingClient?.id
      const clientPayload = {
        client_name: form.clientName.trim(),
        phone: formatPhone(form.phone),
        normalized_phone: normalizedPhone,
      }

      if (clientId) {
        const { error: updateClientError } = await supabase.from('maya_clients').update(clientPayload).eq('id', clientId)
        if (updateClientError) throw updateClientError
      } else {
        const { data: insertedClient, error: clientError } = await supabase
          .from('maya_clients')
          .insert(clientPayload)
          .select('*')
          .maybeSingle()
        if (clientError) throw clientError
        clientId = insertedClient?.id
      }

      if (!clientId) throw createPackageCreationError('package', 'Cliente salvo sem ID retornado pelo Supabase.')

      packageCode = generatePackageCode()
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data: existingCode, error: codeError } = await supabase
          .from('maya_client_packages')
          .select('id')
          .eq('package_code', packageCode)
          .maybeSingle()
        if (codeError) throw codeError
        if (!existingCode) break
        packageCode = generatePackageCode()
      }

      const { data: insertedPackage, error: packageError } = await supabase
        .from('maya_client_packages')
        .insert({
          client_id: clientId,
          client_name: clientPayload.client_name,
          phone: clientPayload.phone,
          normalized_phone: normalizedPhone,
          package_name: form.packageName.trim(),
          package_code: packageCode,
          total_sessions: totalSessions,
          sessions_used: 0,
          purchase_date: form.purchaseDate || todayKey(),
          expiration_date: form.expirationDate || datePlusDays(90),
          status: 'ativo',
        })
        .select('id')
        .single()

      if (packageError) throw packageError
      if (!insertedPackage?.id) throw createPackageCreationError('package', 'Pacote criado sem ID retornado pelo Supabase.')

      const insertedPackageId = insertedPackage.id
      const serviceLinksPayload = selectedServiceIds.map((serviceId) => ({
        package_id: insertedPackageId,
        service_id: serviceId,
      }))

      const { error: serviceLinkError } = await supabase.from('maya_package_services').insert(serviceLinksPayload)

      if (serviceLinkError) {
        console.error('Falha ao vincular serviços ao pacote:', {
          package_id: insertedPackageId,
          service_ids: selectedServiceIds,
          payload: serviceLinksPayload,
          error: serviceLinkError,
        })

        const rollbackErrors: Error[] = []
        const { error: cleanupLinksError } = await supabase
          .from('maya_package_services')
          .delete()
          .eq('package_id', insertedPackageId)
        if (cleanupLinksError) rollbackErrors.push(cleanupLinksError)

        const { error: rollbackPackageError } = await supabase
          .from('maya_client_packages')
          .delete()
          .eq('id', insertedPackageId)
        if (rollbackPackageError) rollbackErrors.push(rollbackPackageError)

        throw createPackageCreationError('services', 'Não foi possível vincular os serviços ao pacote.', {
          details: {
            package_id: insertedPackageId,
            service_ids: selectedServiceIds,
            payload: serviceLinksPayload,
            service_link_error: serviceLinkError,
          },
          rollbackError: rollbackErrors[0] || null,
        })
      }

      setMessage(`Pacote cadastrado com sucesso. Código gerado: ${packageCode}`)
      setShowPackageForm(false)
      setForm(defaultPackageForm())
      await loadPackages()
    } catch (error) {
      console.error('Erro ao cadastrar pacote:', error)
      const packageCreationError = error as PackageCreationError

      if (packageCreationError?.stage === 'services') {
        if (packageCreationError.rollbackError) {
          console.error('Erro ao desfazer cadastro inconsistente do pacote:', packageCreationError.rollbackError)
          setMessage('O pacote foi criado, mas houve falha ao vincular os serviços e não foi possível desfazer automaticamente. Verifique o cadastro antes de tentar novamente.')
        } else {
          setMessage('O pacote não foi concluído porque a vinculação dos serviços falhou. O cadastro foi desfeito para evitar inconsistência.')
        }
      } else {
        setMessage('Não consegui cadastrar o pacote.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegisterSession = async (item: ClientPackage) => {
    const remaining = getSessionsRemaining(item)
    if (remaining <= 0 || item.status === 'cancelado') return

    setIsSaving(true)
    setMessage('')

    try {
      const nextUsed = Math.min(item.totalSessions, item.sessionsUsed + 1)
      const nextStatus: PackageStatus = nextUsed >= item.totalSessions ? 'finalizado' : resolvePackageStatus({ ...item, sessionsUsed: nextUsed })

      const { error: historyError } = await supabase.from('maya_package_sessions').insert({
        package_id: item.id,
        used_at: new Date().toISOString(),
        session_number: nextUsed,
        action: 'manual_use',
        notes: 'Sessão registrada manualmente pela profissional.',
      })
      if (historyError) throw historyError

      const { error: updateError } = await supabase
        .from('maya_client_packages')
        .update({ sessions_used: nextUsed, status: nextStatus })
        .eq('id', item.id)
      if (updateError) throw updateError

      setMessage('Uso de sessão registrado.')
      await loadPackages()
      setSelectedPackageId(item.id)
    } catch (error) {
      console.error('Erro ao registrar sessão:', error)
      setMessage('Não consegui registrar o uso da sessão.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelPackage = async (item: ClientPackage) => {
    if (!confirm('Deseja cancelar este pacote?')) return
    setIsSaving(true)
    setMessage('')

    try {
      const { error } = await supabase.from('maya_client_packages').update({ status: 'cancelado' }).eq('id', item.id)
      if (error) throw error
      setMessage('Pacote cancelado.')
      await loadPackages()
      setSelectedPackageId(item.id)
    } catch (error) {
      console.error('Erro ao cancelar pacote:', error)
      setMessage('Não consegui cancelar o pacote.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-800">
      <div className="border-b border-gold-400/20 bg-dark-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold leading-tight text-gold-300 sm:text-3xl">Pacotes Ativos</h1>
            <p className="text-sm text-gray-300">
              {isAdmin ? 'Cadastre, renove e acompanhe os pacotes por código' : 'Consulte seus pacotes pelo telefone cadastrado'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && <Link to="/agenda" className="rounded-full border border-gold-400/25 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/10">Agenda</Link>}
            <Link to="/" className="rounded-full bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/15">Site</Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        <section className="mb-5 rounded-3xl border border-gold-400/20 bg-dark-700 p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                {isAdmin ? 'Buscar pacote' : 'Consultar pelo telefone'}
              </label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={isAdmin ? 'Nome, telefone, código ou serviço' : 'Digite seu telefone'}
                className={inputClass}
              />
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setStatusFilter(status.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                      statusFilter === status.value
                        ? 'border-gold-400 bg-gold-400 text-dark-900'
                        : 'border-gold-400/20 text-gray-300 hover:bg-gold-400/10 hover:text-gold-300'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setForm(defaultPackageForm())
                  setShowPackageForm((current) => !current)
                }}
                className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300"
              >
                {showPackageForm ? 'Fechar cadastro' : 'Cadastrar pacote'}
              </button>
            )}
          </div>

          {isAdmin && showPackageForm && (
            <form onSubmit={handleCreatePackage} className="mt-5 space-y-4 border-t border-gold-400/10 pt-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input type="text" value={form.clientName} onChange={(event) => updateForm({ clientName: event.target.value })} placeholder="Nome da cliente" className={inputClass} />
                <input type="tel" value={form.phone} onChange={(event) => updateForm({ phone: formatPhone(event.target.value) })} placeholder="Telefone" className={inputClass} />
                <input type="text" value={form.packageName} onChange={(event) => updateForm({ packageName: event.target.value })} placeholder="Nome do pacote" className={inputClass} />
                <input type="number" min="1" value={form.totalSessions} onChange={(event) => updateForm({ totalSessions: event.target.value })} placeholder="Total de sessões" className={inputClass} />
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <span>Data de início</span>
                  <input type="date" value={form.purchaseDate} onChange={(event) => updateForm({ purchaseDate: event.target.value })} className={inputClass} />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <span>Data final</span>
                  <input type="date" value={form.expirationDate} onChange={(event) => updateForm({ expirationDate: event.target.value })} className={inputClass} />
                </label>
              </div>

              <div className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
                <p className="mb-3 text-sm font-semibold text-gold-300">Serviços inclusos no pacote</p>
                {services.length === 0 ? (
                  <p className="text-sm text-gray-400">Cadastre serviços antes de criar um pacote.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => {
                      const checked = form.serviceIds.includes(String(service.id))
                      return (
                        <label key={service.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${checked ? 'border-gold-400 bg-gold-400/10 text-gold-200' : 'border-gold-400/15 bg-dark-700 text-gray-300 hover:border-gold-400/40'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleService(String(service.id))} className="h-4 w-4 accent-gold-400" />
                          <span>{service.name}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSaving || services.length === 0} className="w-full rounded-2xl bg-gold-400 px-4 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300 disabled:opacity-60 sm:w-auto">
                {isSaving ? 'Salvando...' : 'Salvar pacote e gerar código'}
              </button>
            </form>
          )}
        </section>

        {message && <div className="mb-5 rounded-2xl border border-gold-400/20 bg-gold-400/10 p-3 text-sm text-gold-300">{message}</div>}

        {loading ? (
          <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 text-center text-gray-300">Carregando pacotes...</div>
        ) : visiblePackages.length === 0 ? (
          <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 text-center">
            <p className="font-serif text-xl font-bold text-gold-300">Nenhum pacote encontrado</p>
            <p className="mt-2 text-sm text-gray-400">
              {isAdmin ? 'Ajuste a busca, troque o filtro de status ou cadastre um novo pacote.' : 'Digite o telefone cadastrado para consultar seus pacotes ativos.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visiblePackages.map((item) => {
              const remaining = getSessionsRemaining(item)
              return (
                <article key={item.id} className="rounded-3xl border border-gold-400/20 bg-gradient-to-br from-dark-700 to-dark-800 p-4 shadow-card sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-serif text-xl font-bold text-gold-300">{item.clientName}</h2>
                      <p className="mt-1 text-sm text-gray-300">{item.phone}</p>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                      {statusOptions.find((status) => status.value === item.status)?.label}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gold-400/20 bg-dark-900/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Código do pacote</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <strong className="font-mono text-lg tracking-wider text-gold-300">{item.packageCode || 'Sem código'}</strong>
                      {isAdmin && item.packageCode && (
                        <button type="button" onClick={() => copyPackageCode(item.packageCode)} className="rounded-full border border-gold-400/30 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-400/10">
                          Copiar código
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                    <p><strong className="text-gray-100">Pacote:</strong> {item.packageName}</p>
                    <p><strong className="text-gray-100">Sessões:</strong> {remaining} restantes de {item.totalSessions}</p>
                    <p><strong className="text-gray-100">Início:</strong> {formatDate(item.purchaseDate)}</p>
                    <p><strong className="text-gray-100">Validade:</strong> {formatDate(item.expirationDate)}</p>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Serviços inclusos</p>
                    <div className="flex flex-wrap gap-2">
                      {item.serviceNames.length > 0 ? item.serviceNames.map((name) => (
                        <span key={name} className="rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">{name}</span>
                      )) : <span className="text-xs text-gray-500">Nenhum serviço vinculado</span>}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark-900/70">
                    <div className="h-full rounded-full bg-gold-400" style={{ width: `${Math.min(100, Math.round((item.sessionsUsed / Math.max(1, item.totalSessions)) * 100))}%` }} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => setSelectedPackageId(item.id)} className="rounded-full border border-gold-400/30 px-4 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/10">Ver detalhes</button>
                    {isAdmin && <button type="button" onClick={() => openRenewForm(item)} className="rounded-full bg-gold-400 px-4 py-2.5 text-sm font-semibold text-dark-900 transition hover:bg-gold-300">Renovar pacote</button>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-gold-400/20 bg-dark-700 p-4 shadow-2xl sm:mx-auto sm:max-w-3xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">Detalhes do pacote</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-gold-300">{selectedPackage.packageName}</h2>
                <p className="mt-1 text-sm text-gray-400">{selectedPackage.clientName} • {selectedPackage.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedPackageId(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/20 text-xl leading-none text-gold-300 hover:bg-gold-400/10">×</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gold-300">Cliente</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong className="text-gray-100">Nome:</strong> {selectedPackage.clientName}</p>
                  <p><strong className="text-gray-100">Telefone:</strong> {selectedPackage.phone}</p>
                  <p><strong className="text-gray-100">Código:</strong> <span className="font-mono text-gold-300">{selectedPackage.packageCode}</span></p>
                </div>
              </section>

              <section className="rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gold-300">Pacote</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong className="text-gray-100">Sessões totais:</strong> {selectedPackage.totalSessions}</p>
                  <p><strong className="text-gray-100">Usadas:</strong> {selectedPackage.sessionsUsed}</p>
                  <p><strong className="text-gray-100">Restantes:</strong> {getSessionsRemaining(selectedPackage)}</p>
                  <p><strong className="text-gray-100">Início:</strong> {formatDate(selectedPackage.purchaseDate)}</p>
                  <p><strong className="text-gray-100">Validade:</strong> {formatDate(selectedPackage.expirationDate)}</p>
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gold-300">Serviços inclusos</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPackage.serviceNames.length > 0 ? selectedPackage.serviceNames.map((name) => (
                  <span key={name} className="rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">{name}</span>
                )) : <span className="text-sm text-gray-400">Nenhum serviço vinculado.</span>}
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-gold-400/15 bg-dark-800 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gold-300">Histórico de uso das sessões</h3>
              {selectedSessions.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma sessão utilizada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-gold-400/10 bg-dark-700 p-3 text-sm text-gray-300">
                      <p><strong className="text-gray-100">Sessão {session.sessionNumber}</strong> • {formatDateTime(session.usedAt)}</p>
                      <p className="mt-1 text-xs text-gold-200">{session.action === 'returned' ? 'Sessão devolvida' : session.action === 'late_cancel' ? 'Cancelamento fora do prazo' : 'Sessão utilizada'}</p>
                      {session.notes && <p className="mt-1 text-xs text-gray-400">{session.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isAdmin && (
              <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
                {selectedPackage.packageCode && <button type="button" onClick={() => copyPackageCode(selectedPackage.packageCode)} className="rounded-full border border-gold-400/30 px-5 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/10">Copiar código</button>}
                <button type="button" onClick={() => openRenewForm(selectedPackage)} className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-dark-900 transition hover:bg-gold-300">Renovar pacote</button>
                <button type="button" onClick={() => handleRegisterSession(selectedPackage)} disabled={isSaving || selectedPackage.status === 'cancelado' || selectedPackage.status === 'finalizado' || getSessionsRemaining(selectedPackage) === 0} className="rounded-full border border-gold-400/30 px-5 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-50">Registrar uso manual</button>
                <button type="button" onClick={() => handleCancelPackage(selectedPackage)} disabled={isSaving || selectedPackage.status === 'cancelado'} className="rounded-full border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50">Cancelar pacote</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PacotesAtivos
