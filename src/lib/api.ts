const API_URL = '/api';

export function getApiHeaders(includeContentType = true) {
  const token = localStorage.getItem('token');
  const activeTenantId = localStorage.getItem('activeTenantId');
  return {
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeTenantId ? { 'X-Tenant-ID': activeTenantId } : {})
  };
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getApiHeaders(),
      ...options.headers
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('activeTenantId');
      localStorage.removeItem('crm-storage');
      window.location.href = '/login';
    }
    const contentType = response.headers.get('content-type') || '';
    let message = `API Error (${response.status})`;

    if (contentType.includes('application/json')) {
      const error = await response.json().catch(() => ({}));
      message = error.error || error.message || message;
    } else {
      const text = await response.text().catch(() => '');
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }
  
  return response.json();
}

export async function fetchApiResponse(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...getApiHeaders(!(options.body instanceof FormData)), ...options.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `API Error (${response.status})`);
  }
  return response;
}
