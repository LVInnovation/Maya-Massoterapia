import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

interface NotificationItem {
  id: string
  client_name: string
  phone: string
  service_name: string
  professional_name: string
  appointment_date: string
  appointment_time: string
  status: string
  created_at: string
}

const formatDate = (date: string, time: string) => {
  const fullDate = new Date(`${date}T${time}`)

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fullDate)
}

const Notificacoes = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('maya_appointments')
        .select(`
          id,
          client_name,
          phone,
          appointment_date,
          appointment_time,
          status,
          created_at,
          professionals:maya_professional(name),
          services:maya_services(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        client_name: item.client_name || '',
        phone: item.phone || '',
        service_name: item.services?.name || '',
        professional_name: item.professionals?.name || '',
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        status: item.status || 'agendado',
        created_at: item.created_at,
      }))

      setNotifications(formatted)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-gray-800 sm:text-3xl">
              Notificações
            </h1>

            <p className="text-sm text-gray-500">
              Últimos agendamentos e cancelamentos
            </p>
          </div>

          <Link
            to="/agenda"
            className="w-fit rounded-full bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-500 hover:bg-pink-100"
          >
            ← Agenda
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            Nenhuma notificação encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => {
              const isCanceled =
                item.status === 'cancelado' ||
                item.status === 'canceled'

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border-l-4 bg-white p-5 shadow-sm ${
                    isCanceled
                      ? 'border-red-500'
                      : 'border-blue-500'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {item.client_name}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {formatDate(
                          item.appointment_date,
                          item.appointment_time,
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                        isCanceled
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    >
                      {isCanceled
                        ? 'CANCELADO'
                        : 'AGENDADO'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <strong>Serviço:</strong>{' '}
                      {item.service_name}
                    </p>

                    <p>
                      <strong>Profissional:</strong>{' '}
                      {item.professional_name}
                    </p>

                    <p>
                      <strong>Telefone:</strong>{' '}
                      {item.phone}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notificacoes
