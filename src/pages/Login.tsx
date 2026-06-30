import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setAuthenticated } from '../lib/auth'

const ADMIN_USER = 'Maya'
const ADMIN_PASS = '21092003'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = () => {
    setError('')

    if (!username || !password) {
      setError('Preencha usuário e senha.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        setAuthenticated()
        navigate('/', { replace: true })
      } else {
        setError('Usuário ou senha incorretos.')
      }
      setLoading(false)
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-gold-400">Mayà Massoterapia & Estética</h1>
          <p className="mt-1 text-sm text-gray-400">Área restrita — funcionárias</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 shadow-dark-lg">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10">
              <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-300">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite seu usuário"
                autoComplete="username"
                className="w-full rounded-2xl border border-gold-400/30 bg-dark-600 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/50 placeholder:text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-gold-400/30 bg-dark-600 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/50 placeholder:text-gray-500"
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-red-950/40 px-4 py-2 text-center text-sm text-red-400 border border-red-400/30">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-2xl bg-gold-400 py-3 text-sm font-semibold text-dark-900 shadow-md transition hover:bg-gold-300 hover:shadow-gold-glow disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>

        {/* Voltar */}
        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-gray-400 transition hover:text-gold-400"
          >
            ← Voltar para o site
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Login
