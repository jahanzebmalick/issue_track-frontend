import { useState } from 'react'
import Auth from './pages/Auth'
import Projects from './pages/Projects'
import Project from './pages/Project'
import Issue from './pages/Issue'

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null)
  const [view, setView] = useState({ name: 'projects' })

  const onAuth = (u) => {
    localStorage.setItem('username', u)
    setUsername(u)
    setView({ name: 'projects' })
  }
  const onLogout = () => {
    localStorage.removeItem('username')
    setUsername(null)
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
