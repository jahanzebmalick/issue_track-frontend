import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useProjectWS } from '../hooks/useProjectWS'

const STATUS_COLOR = {
  open: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}
const STATUS_BAR = {
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-500',
  closed: 'bg-zinc-600',
}
const PRIORITY_LABEL = {
  low: { color: 'text-zinc-500', icon: '○' },
  medium: { color: 'text-zinc-300', icon: '◐' },
  high: { color: 'text-amber-400', icon: '●' },
  urgent: { color: 'text-red-400', icon: '⚡' },
}

function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function ageBadge(issue) {
  if (issue.status === 'done' || issue.status === 'closed') return null
  const d = daysSince(issue.created_at)
  if (d >= 14) return { color: 'bg-red-500/15 text-red-300 border-red-500/30', label: 'stale' }
  if (d >= 7) return { color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', label: 'aging' }
  return null
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
]
const gradientFor = (id) => GRADIENTS[id % GRADIENTS.length]

export default function Project({ projectId, username, onBack, onOpenIssue }) {
  const [project, setProject] = useState(null)
  const [issues, setIssues] = useState([])
  const [members, setMembers] = useState([])
  const [tab, setTab] = useState('issues')
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [pulse, setPulse] = useState(false)

  const load = async () => {
    const [pr, ir, mr] = await Promise.all([
      api.getProject(projectId),
      api.listIssues(projectId),
      api.listMembers(projectId),
    ])
    if (pr.ok) setProject(await pr.json())
    if (ir.ok) setIssues(await ir.json())
    if (mr.ok) setMembers(await mr.json())
  }
  useEffect(() => { load() }, [projectId])

  useProjectWS(projectId, (msg) => {
    setPulse(true)
    setTimeout(() => setPulse(false), 1100)
    if (msg.type === 'issue_created') {
      setIssues((cur) => [msg.data, ...cur.filter((i) => i.id !== msg.data.id)])
    } else if (msg.type === 'issue_updated') {
      setIssues((cur) => cur.map((i) => (i.id === msg.data.id ? msg.data : i)))
    } else if (msg.type === 'issue_deleted') {
      setIssues((cur) => cur.filter((i) => i.id !== msg.data.id))
    }
  })

  const createIssue = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const r = await api.createIssue(projectId, { title: title.trim(), description: desc.trim() })
    if (r.ok) {
      const i = await r.json()
      setIssues((cur) => [i, ...cur.filter((x) => x.id !== i.id)])
      setTitle(''); setDesc(''); setCreating(false)
    }
  }

  const invite = async (e) => {
    e.preventDefault()
    if (!inviteName.trim()) return
    const r = await api.inviteMember(projectId, { username: inviteName.trim(), role: inviteRole })
    if (r.ok) {
      const m = await r.json()
      setMembers([...members, { ...m, username: inviteName.trim() }])
      setInviteName(''); setInviting(false)
    }
  }

  const removeMember = async (userId) => {
    const r = await api.removeMember(projectId, userId)
    if (r.ok) setMembers(members.filter((m) => m.user_id !== userId))
  }

  const deleteProject = async () => {
    if (!confirm(`Delete "${project.name}"? All issues, comments, tags, and members will be removed. This cannot be undone.`)) return
    const r = await api.deleteProject(projectId)
    if (r.ok) {
      onBack()
    } else {
      alert(`Could not delete (status ${r.status}). Only the project owner can delete.`)
    }
  }

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
      <div className="animate-pulse">Loading project…</div>
    </div>
  )

  const openCount = issues.filter(i => i.status === 'open').length
  const inProgCount = issues.filter(i => i.status === 'in_progress').length
  const doneCount = issues.filter(i => i.status === 'done').length

  return (
    <div className="min-h-screen">
      <nav className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/70 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-zinc-500 hover:text-zinc-200 text-sm flex items-center gap-1.5 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Projects
          </button>
          <div className="text-zinc-700">/</div>
          <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${gradientFor(project.id)} flex items-center justify-center text-white text-xs font-bold`}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">{project.name}</span>
          <span
            className={`w-2 h-2 rounded-full transition ${pulse ? 'bg-emerald-400 pulse-ring' : 'bg-zinc-700'}`}
            title={pulse ? 'live update received' : 'real-time connected'}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/60">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-zinc-300 font-medium">{username}</span>
        </div>
      </nav>

      {/* Floating blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br ${gradientFor(project.id)} opacity-15 blur-3xl float-slow`} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner with project info */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-6 mb-6 fade-in-up">
          <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${gradientFor(project.id)} opacity-20 blur-2xl`} />
          <div className="relative flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFor(project.id)} flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/40 shrink-0`}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-zinc-50 truncate">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 relative overflow-hidden lift fade-in-up delay-1">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="relative">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Open
              </div>
              <div key={openCount} className="text-3xl font-bold text-blue-300 count-up">{openCount}</div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 relative overflow-hidden lift fade-in-up delay-2">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> In progress
              </div>
              <div key={inProgCount} className="text-3xl font-bold text-amber-300 count-up">{inProgCount}</div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 relative overflow-hidden lift fade-in-up delay-3">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Done
              </div>
              <div key={doneCount} className="text-3xl font-bold text-emerald-300 count-up">{doneCount}</div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-zinc-800/60 mb-6">
          {[
            { key: 'issues', label: 'Issues', count: issues.length },
            { key: 'members', label: 'Members', count: members.length + 1 },
            { key: 'overview', label: 'Overview' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition flex items-center gap-2 ${
                tab === t.key
                  ? 'border-indigo-500 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
              {t.count != null && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${tab === t.key ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-900 text-zinc-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'issues' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-100">Issues</h2>
              <button
                onClick={() => setCreating(!creating)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-400 hover:to-violet-500 transition shadow-lg shadow-indigo-500/20"
              >
                + New issue
              </button>
            </div>

            {creating && (
              <form onSubmit={createIssue} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 mb-4 slide-in">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs doing?"
                  className="w-full bg-transparent text-lg font-medium text-zinc-100 border-b border-zinc-800 pb-2 mb-3 focus:outline-none focus:border-indigo-500/60"
                  autoFocus
                />
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Add details (optional)…"
                  rows={2}
                  className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 mb-3 text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition resize-none text-sm"
                />
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold">Create issue</button>
                  <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
                </div>
              </form>
            )}

            {issues.length === 0 ? (
              <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center">
                <div className="text-zinc-300 font-semibold mb-1">All clear ✨</div>
                <p className="text-zinc-500 text-sm">No issues yet. Create your first one above.</p>
              </div>
            ) : (
              <div className="border border-zinc-800/60 rounded-xl overflow-hidden divide-y divide-zinc-800/60 bg-zinc-900/30">
                {issues.map((i, idx) => {
                  const p = PRIORITY_LABEL[i.priority] || PRIORITY_LABEL.medium
                  const age = ageBadge(i)
                  const isDone = i.status === 'done' || i.status === 'closed'
                  return (
                    <button
                      key={i.id}
                      onClick={() => onOpenIssue(i.id)}
                      style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
                      className="w-full text-left hover:bg-zinc-900/70 transition flex items-stretch gap-0 group fade-in-up relative"
                    >
                      {/* Left status bar */}
                      <span className={`w-1 shrink-0 ${STATUS_BAR[i.status] || 'bg-zinc-700'} ${i.status === 'in_progress' ? 'animate-pulse' : ''}`} />

                      <div className="flex items-center gap-3 px-4 py-3.5 flex-1 group-hover:pl-5 transition-all">
                        <span className={`text-base ${p.color} w-5 shrink-0`}>{p.icon}</span>
                        <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded-full border ${STATUS_COLOR[i.status] || ''}`}>
                          {i.status.replace('_', ' ')}
                        </span>
                        {age && (
                          <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded-full border ${age.color}`} title={`Open ${daysSince(i.created_at)} days`}>
                            {age.label}
                          </span>
                        )}
                        <span className={`flex-1 truncate font-medium ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-100 group-hover:text-white'}`}>
                          {i.title}
                        </span>
                        <span className="text-xs font-mono text-zinc-600 hidden sm:block">#{i.id}</span>
                        <span className="text-xs font-mono text-zinc-600 hidden md:block">
                          {new Date(i.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-100">Members</h2>
              <button
                onClick={() => setInviting(!inviting)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-400 hover:to-violet-500 transition shadow-lg shadow-indigo-500/20"
              >
                + Invite
              </button>
            </div>

            {inviting && (
              <form onSubmit={invite} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 mb-4 flex gap-2 slide-in">
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Username to invite"
                  className="flex-1 bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500/60"
                  autoFocus
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold">Send invite</button>
              </form>
            )}

            <div className="border border-zinc-800/60 rounded-xl overflow-hidden divide-y divide-zinc-800/60 bg-zinc-900/30">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-amber-500/30">
                  ★
                </div>
                <div className="flex-1">
                  <div className="text-zinc-100 font-medium text-sm">Project owner</div>
                  <div className="text-xs text-zinc-500">user #{project.owner_id}</div>
                </div>
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300">owner</span>
              </div>
              {members.map((m) => (
                <div key={m.user_id} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900/50 transition">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                    {(m.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-zinc-100 font-medium text-sm">{m.username || `user #${m.user_id}`}</div>
                    <div className="text-xs text-zinc-500">{m.joined_at && `joined ${new Date(m.joined_at).toLocaleDateString()}`}</div>
                  </div>
                  <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300 bg-zinc-800/50">{m.role}</span>
                  <button
                    onClick={() => removeMember(m.user_id)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition px-2 py-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  Just you for now. Invite teammates to collaborate.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/40">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">Name</div>
              <div className="text-zinc-100 font-bold text-xl">{project.name}</div>
            </div>
            <div className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/40">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">Description</div>
              <div className="text-zinc-200">{project.description || <span className="text-zinc-500 italic">No description yet</span>}</div>
            </div>
            <div className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/40">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">Created</div>
              <div className="text-zinc-200">{new Date(project.created_at).toLocaleString()}</div>
            </div>

            <div className="border border-red-900/40 rounded-xl p-6 bg-red-950/20 mt-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-red-300 uppercase tracking-wider font-semibold mb-1">Danger zone</div>
                  <div className="text-zinc-200 font-semibold mb-1">Delete this project</div>
                  <div className="text-zinc-400 text-sm">Permanently removes the project, all its issues, comments, tags, and members. Only the owner can do this.</div>
                </div>
                <button
                  onClick={deleteProject}
                  className="shrink-0 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 rounded-lg text-sm font-semibold transition"
                >
                  Delete project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
