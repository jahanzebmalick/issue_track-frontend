import { useEffect, useState } from 'react'
import Auth from './pages/Auth'
import Projects from './pages/Projects'
import Project from './pages/Project'
import Issue from './pages/Issue'
import { api } from './lib/api'

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null)
  const [view, setView] = useState({ name: 'projects' })
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api.me()
      .then((r) => r.ok ? r.json() : null)
      .then((me) => {
        if (me?.username) {
          localStorage.setItem('username', me.username)
          setUsername(me.username)
        } else {
          localStorage.removeItem('username')
          setUsername(null)
        }
      })
      .finally(() => setChecking(false))
  }, [])

  const onAuth = (u) => {
    localStorage.setItem('username', u)
    setUsername(u)
    setView({ name: 'projects' })
  }
  const onLogout = () => {
    localStorage.removeItem('username')
    setUsername(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!username) return <Auth onAuth={onAuth} />

  if (view.name === 'projects') {
    return <Projects username={username} onLogout={onLogout} onOpen={(id) => setView({ name: 'project', id })} />
  }
  if (view.name === 'project') {
    return (
      <Project
        projectId={view.id}
        username={username}
        onBack={() => setView({ name: 'projects' })}
        onOpenIssue={(issueId) => setView({ name: 'issue', issueId, projectId: view.id })}
      />
    )
  }
  if (view.name === 'issue') {
    return (
      <Issue
        issueId={view.issueId}
        username={username}
        onBack={() => setView({ name: 'project', id: view.projectId })}
      />
    )
  }
}
