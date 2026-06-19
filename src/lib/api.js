const BASE = '/api'

async function request(path, opts = {}) {
  return fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
}

export const api = {
  signup: (body) => request('/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),

  listProjects: () => request('/projects'),
  createProject: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  getProject: (id) => request(`/projects/${id}`),
  updateProject: (id, body) => request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  listIssues: (projectId) => request(`/projects/${projectId}/issues`),
  createIssue: (projectId, body) => request(`/projects/${projectId}/issues`, { method: 'POST', body: JSON.stringify(body) }),
  getIssue: (id) => request(`/issues/${id}`),
  updateIssue: (id, body) => request(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteIssue: (id) => request(`/issues/${id}`, { method: 'DELETE' }),

  listComments: (issueId) => request(`/issues/${issueId}/comments`),
  createComment: (issueId, body) => request(`/issues/${issueId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  listTags: (projectId) => request(`/projects/${projectId}/tags`),
  createTag: (projectId, body) => request(`/projects/${projectId}/tags`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTag: (id) => request(`/tags/${id}`, { method: 'DELETE' }),
  attachTag: (issueId, tagId) => request(`/issues/${issueId}/tags`, { method: 'POST', body: JSON.stringify({ tag_id: tagId }) }),
  detachTag: (issueId, tagId) => request(`/issues/${issueId}/tags/${tagId}`, { method: 'DELETE' }),
  issueTags: (issueId) => request(`/issues/${issueId}/tags`),

  // activity
  listActivity: (projectId) => request(`/projects/${projectId}/activity`),

  // attachments
  listAttachments: (issueId) => request(`/issues/${issueId}/attachments`),
  uploadAttachment: (issueId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`/api/issues/${issueId}/attachments`, {
      method: 'POST',
      credentials: 'include',
      body: fd, // browser auto-sets multipart Content-Type with boundary
    })
  },
  downloadAttachmentURL: (id) => `/api/attachments/${id}`,
  deleteAttachment: (id) => request(`/attachments/${id}`, { method: 'DELETE' }),

  listMembers: (projectId) => request(`/projects/${projectId}/members`),
  inviteMember: (projectId, body) => request(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(body) }),
  updateMemberRole: (projectId, userId, body) => request(`/projects/${projectId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeMember: (projectId, userId) => request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),

  // github
  listGithubRepos: () => request('/github/repos'),
  linkProjectRepo: (projectId, repo) => request(`/projects/${projectId}/github`, { method: 'PATCH', body: JSON.stringify({ repo }) }),
}
