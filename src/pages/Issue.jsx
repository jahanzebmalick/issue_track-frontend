import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useProjectWS } from '../hooks/useProjectWS'

const STATUSES = ['open', 'in_progress', 'done', 'closed']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

const STATUS_COLOR = {
  open: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

export default function Issue({ issueId, username, onBack }) {
  const [issue, setIssue] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [body, setBody] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})

  const load = async () => {
    const ir = await api.getIssue(issueId)
    if (ir.ok) {
      const i = await ir.json()
      setIssue(i)
      setDraft(i)
    }
    const cr = await api.listComments(issueId)
    if (cr.ok) setComments(await cr.json())
    const ar = await api.listAttachments(issueId)
    if (ar.ok) setAttachments(await ar.json())
  }
  useEffect(() => { load() }, [issueId])

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    const r = await api.uploadAttachment(issueId, file)
    setUploading(false)
    if (r.ok) {
      const a = await r.json()
      setAttachments((cur) => [...cur, a].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i))
    } else {
      alert('Upload failed: ' + (await r.text()))
    }
  }

  const removeAttachment = async (id) => {
    if (!confirm('Delete this attachment?')) return
    const r = await api.deleteAttachment(id)
    if (r.ok) setAttachments((cur) => cur.filter((a) => a.id !== id))
  }

  const humanSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const isImage = (mime) => mime?.startsWith('image/')

  useProjectWS(issue?.project_id, (msg) => {
    if (msg.type === 'comment_created' && msg.data.issue_id === issueId) {
      setComments((cur) => [...cur, msg.data].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i))
    }
    if (msg.type === 'issue_updated' && msg.data.id === issueId) {
      setIssue(msg.data)
    }
    if (msg.type === 'attachment_added' && msg.data.issue_id === issueId) {
      setAttachments((cur) => [...cur, msg.data].filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i))
    }
    if (msg.type === 'attachment_deleted' && msg.data.issue_id === issueId) {
      setAttachments((cur) => cur.filter((a) => a.id !== msg.data.id))
    }
  })

  const addComment = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    const r = await api.createComment(issueId, { body: body.trim() })
    if (r.ok) {
      const c = await r.json()
      setComments((cur) => [...cur, c].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i))
      setBody('')
    }
  }

  const save = async () => {
    const r = await api.updateIssue(issueId, {
      title: draft.title,
      description: draft.description || '',
      status: draft.status,
      priority: draft.priority,
    })
    if (r.ok) {
      setEditing(false)
      load()
    }
  }

  const del = async () => {
    if (!confirm('Delete this issue? This cannot be undone.')) return
    await api.deleteIssue(issueId)
    onBack()
  }

  if (!issue) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
      <div className="animate-pulse">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <nav className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/70 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-zinc-500 hover:text-zinc-200 text-sm flex items-center gap-1.5 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="text-zinc-700">/</div>
          <span className="text-xs font-mono text-zinc-500">Issue #{issue.id}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/60">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-zinc-300 font-medium">{username}</span>
        </div>
      </nav>

      {/* Floating blob */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl float-slow" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-fuchsia-500/8 blur-3xl float" />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 fade-in-up">
        {editing ? (
          <div className="mb-8 slide-in">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full bg-transparent text-3xl font-bold text-zinc-50 border-b border-zinc-800 focus:outline-none focus:border-indigo-500 pb-3 mb-4"
              autoFocus
            />
            <textarea
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={5}
              placeholder="Add a description…"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition resize-none mb-4"
            />
            <div className="flex gap-2 items-center">
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500/60"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <select
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500/60"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={save} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20">Save changes</button>
              <button onClick={() => { setEditing(false); setDraft(issue) }} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-bold text-zinc-50 leading-tight">{issue.title}</h1>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(true)} className="text-sm text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-800/50 transition">Edit</button>
                <button onClick={del} className="text-sm text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition">Delete</button>
              </div>
            </div>
            <div className="flex gap-2 items-center mb-5 flex-wrap">
              <span className={`text-xs font-mono uppercase px-2.5 py-1 rounded-full border ${STATUS_COLOR[issue.status]}`}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300 bg-zinc-800/50">
                {issue.priority}
              </span>
              <span className="text-xs text-zinc-500 ml-auto">
                opened {new Date(issue.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {issue.description && (
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 text-zinc-200 whitespace-pre-wrap leading-relaxed">{issue.description}</div>
            )}
          </div>
        )}

        {/* Attachments */}
        <div className="mt-8">
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-lg font-bold text-zinc-100">Attachments</h2>
            <span className="text-sm text-zinc-500">· {attachments.length}</span>
          </div>

          {attachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="group relative border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40 lift fade-in-up"
                >
                  {isImage(a.mime_type) ? (
                    <a
                      href={api.downloadAttachmentURL(a.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={api.downloadAttachmentURL(a.id)}
                        alt={a.filename}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <a
                      href={api.downloadAttachmentURL(a.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-video bg-zinc-950 flex items-center justify-center"
                    >
                      <svg className="w-12 h-12 text-zinc-500 group-hover:text-zinc-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                  <div className="p-3">
                    <div className="text-sm text-zinc-200 truncate font-medium" title={a.filename}>{a.filename}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 flex items-center justify-between gap-2">
                      <span>{humanSize(a.size_bytes)}</span>
                      <button
                        onClick={() => removeAttachment(a.id)}
                        className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label
            className={`group relative block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              uploading
                ? 'border-indigo-500/60 bg-indigo-500/5'
                : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/40'
            }`}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-2">
              <svg className="w-7 h-7 text-zinc-500 group-hover:text-zinc-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-sm text-zinc-300">
                {uploading ? 'Uploading…' : 'Drop a file or click to upload'}
              </div>
              <div className="text-xs text-zinc-500">Up to ~32 MB · images, PDFs, anything</div>
            </div>
          </label>
        </div>

        <div className="mt-10">
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-lg font-bold text-zinc-100">Discussion</h2>
            <span className="text-sm text-zinc-500">· {comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
          </div>

          <div className="space-y-3 mb-4">
            {comments.map((c, idx) => (
              <div
                key={c.id}
                style={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
                className="border border-zinc-800/60 rounded-xl p-4 bg-zinc-900/40 fade-in-up lift">

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
                    {`U${c.author_id}`.charAt(1)}
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">user #{c.author_id}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed pl-9">{c.body}</div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-sm text-zinc-500 text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                Be the first to say something.
              </div>
            )}
          </div>

          <form onSubmit={addComment} className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/40">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Leave a comment…"
              rows={3}
              className="w-full bg-transparent p-4 text-zinc-100 focus:outline-none resize-none"
            />
            <div className="flex justify-between items-center px-4 py-2 border-t border-zinc-800/60 bg-zinc-950/30">
              <span className="text-xs text-zinc-500">Markdown not yet supported</span>
              <button
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50 transition shadow-md shadow-indigo-500/20"
                disabled={!body.trim()}
              >
                Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
