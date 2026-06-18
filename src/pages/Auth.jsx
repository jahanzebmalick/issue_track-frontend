import { useState } from 'react'
import { api } from '../lib/api'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)

    if (mode === 'signup') {
      const r = await api.signup({ username, password })
      if (!r.ok) {
        setErr(await r.text())
        setBusy(false)
        return
      }
    }

    const lr = await api.login({ username, password })
    setBusy(false)
    if (!lr.ok) {
      setErr(await lr.text())
      return
    }
    onAuth(username)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 slide-in">
          <img
            src="/issuetrack_logo.png"
            alt="issuetrack"
            className="mx-auto h-24 w-auto object-contain"
          />
        </div>

        <form onSubmit={submit} className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-7 backdrop-blur-xl shadow-2xl shadow-black/40 slide-in">
          <div className="flex bg-zinc-950/60 rounded-lg p-1 mb-6 border border-zinc-800/50">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition ${
                  mode === m
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <label className="block mb-4">
            <span className="text-xs text-zinc-400 font-semibold mb-1.5 block">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500/60 focus:bg-zinc-950 transition"
              placeholder="alice"
              required
              autoComplete="username"
            />
          </label>

          <label className="block mb-6">
            <span className="text-xs text-zinc-400 font-semibold mb-1.5 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500/60 focus:bg-zinc-950 transition"
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {err && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-sm">
              {err.trim()}
            </div>
          )}

          <button
            disabled={busy}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold py-2.5 rounded-lg hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50 transition shadow-lg shadow-indigo-500/20"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-500 font-medium">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <a
            href="/api/auth/github/login"
            className="w-full flex items-center justify-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold py-2.5 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Continue with GitHub
          </a>

          <div className="mt-5 text-center text-xs text-zinc-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-600">
          Built with Go · Postgres · React
        </div>
      </div>
    </div>
  )
}
