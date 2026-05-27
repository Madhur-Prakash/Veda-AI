import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Cookies are sent automatically via withCredentials — no manual token injection needed.

// On 401, try refresh (sets new accessToken cookie server-side) then retry once
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (body: { name: string; email: string; password: string; school?: string }) =>
    api.post('/auth/register', body),
  login: (body: { email: string; password: string }) => api.post('/auth/login', body),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (body: { name?: string; school?: string }) => api.patch('/auth/me', body)
};

export const assignmentApi = {
  list: () => api.get('/assignments'),
  get: (id: string) => api.get(`/assignments/${id}`),
  create: (body: unknown) => api.post('/assignments', body),
  regenerate: (id: string, notes?: string) => api.post(`/assignments/${id}/regenerate`, { notes }),
  dashboard: () => api.get('/dashboard/summary'),
  exportPdf: (id: string) => api.get(`/assignments/${id}/export/pdf`, { responseType: 'blob' })
};

export const toolkitApi = {
  run: (toolId: string, prompt: string) => api.post('/toolkit/run', { toolId, prompt })
};

export const groupApi = {
  list: () => api.get('/groups'),
  create: (body: { name: string; subject: string; className: string; colorIdx?: number }) =>
    api.post('/groups', body),
  get: (id: string) => api.get(`/groups/${id}`),
  remove: (id: string) => api.delete(`/groups/${id}`),
  assignPaper: (id: string, body: { assignmentExternalId: string; assignmentTitle: string; dueDate?: string }) =>
    api.post(`/groups/${id}/papers`, body),
  removePaper: (id: string, assignmentId: string) =>
    api.delete(`/groups/${id}/papers/${assignmentId}`),
  refreshInvite: (id: string) => api.post(`/groups/${id}/invite`)
};
