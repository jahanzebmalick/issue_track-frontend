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
        <div className="text-center mb-10 slide-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">issuetrack</h1>
          <p className="text-zinc-400 text-sm mt-2">Plan, track, ship — together.</p>
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
