import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
]

const gradientFor = (id) => GRADIENTS[id % GRADIENTS.length]

const TIPS = [
  'Press ⌘K for quick search · coming soon',
  'Real-time updates sync across all open windows',
  'Invite teammates from any project to collaborate',
  'Markdown comments coming soon',
]

export default function Projects({ username, onLogout, onOpen }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [tipIdx, setTipIdx] = useState(0)

  const load = async () => {
    const r = await api.listProjects()
    if (r.ok) setProjects(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 4500)
    return () => clearInterval(t)
  }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const r = await api.createProject({ name: name.trim(), description: desc.trim() })
    if (r.ok) {
      const p = await r.json()
      setProjects([p, ...projects])
      setName(''); setDesc(''); setCreating(false)
    }
  }

  const logout = async () => {
    await api.logout()
    onLogout()
  }

  return (
    <div className="min-h-screen relative">
      {/* Floating background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl blob" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl blob blob-delay-2" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-cyan-600/8 blur-3xl blob blob-delay-4" />
      </div>

      <nav className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/70 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 animate-gradient shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="font-bold tracking-tight text-zinc-100 text-lg">issuetrack</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/60">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-zinc-300 font-medium">{username}</span>
          </div>
          <button onClick={logout} className="text-sm text-zinc-500 hover:text-red-400 transition">Sign out</button>
        </div>
      </nav>

      {/* Hero banner */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-6">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 via-zinc-900/40 to-zinc-900/80 p-8 fade-in-up">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-600/30 blur-3xl float-slow" />
          <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-600/20 blur-3xl float" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 mb-2">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{username}</span>
            </h1>
            <p className="text-zinc-400 text-base max-w-md">
              Plan, track, ship — all your projects in one place.
            </p>
            <div className="mt-5 text-xs text-zinc-500 font-mono h-4">
              <span key={tipIdx} className="slide-in inline-block">💡 {TIPS[tipIdx]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Your projects</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Owned and shared with you</p>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-100"
          >
            + New project
          </button>
        </div>

        {creating && (
          <form onSubmit={create} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 mb-6 slide-in backdrop-blur-xl shadow-2xl">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Create a project</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-4 py-2.5 mb-3 text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition"
              autoFocus
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What's this project about?"
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-4 py-2.5 mb-4 text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition"
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-400 hover:to-violet-500 transition">Create</button>
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl h-40 relative overflow-hidden">
                <div className="shimmer absolute inset-0" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-3xl p-16 text-center bg-zinc-900/20 fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30 float">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-zinc-100 font-bold text-lg mb-1">Start your first project</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Group related issues, invite teammates, watch them collaborate in real time.</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/30"
            >
              + Create a project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className={`text-left bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-600 hover:bg-zinc-900/80 transition group relative overflow-hidden lift fade-in-up delay-${Math.min(idx + 1, 6)}`}
              >
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${gradientFor(p.id)} opacity-10 group-hover:opacity-25 transition-all duration-500 group-hover:scale-110`} />
                <div className="flex items-start justify-between mb-3 relative">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientFor(p.id)} flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-mono text-zinc-600 bg-zinc-900/80 px-2 py-0.5 rounded">#{p.id}</span>
                </div>
                <div className="font-bold text-zinc-100 group-hover:text-white transition mb-1.5 text-base">{p.name}</div>
                {p.description ? (
                  <div className="text-sm text-zinc-500 line-clamp-2">{p.description}</div>
                ) : (
                  <div className="text-sm text-zinc-600 italic">No description</div>
                )}
                <div className="mt-4 flex items-center gap-1 text-xs text-zinc-600 group-hover:text-indigo-300 transition">
                  Open project
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-xs text-zinc-600">
          Built with Go · Postgres · WebSockets · React
        </div>
      </div>
    </div>
  )
}
