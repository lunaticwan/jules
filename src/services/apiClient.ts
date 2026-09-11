import axios from 'axios';
import { getJulesApiKey } from './julesApi';
import { getGitHubToken } from './githubApi';
import { getLogTimestamp } from '../utils/logger';

// Jules API 전용 Axios 인스턴스
export const julesClient = axios.create({
  baseURL: 'https://jules.googleapis.com/v1alpha',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Jules API 요청 인터셉터
julesClient.interceptors.request.use((config) => {
  const apiKey = getJulesApiKey();
  if (apiKey) {
    config.params = {
      ...config.params,
      key: apiKey,
    };
  }

  const method = (config.method || 'GET').toUpperCase();
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log(`[${getLogTimestamp()}][API_REQ] [Jules] ${method} ${fullUrl}`, {
    params: config.params,
    headers: config.headers,
    data: config.data,
  });

  return config;
});

// Jules API 응답 인터셉터
julesClient.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'GET').toUpperCase();
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    console.log(`[${getLogTimestamp()}][API_RES] [Jules] ${response.status} ${response.statusText} ${method} ${fullUrl}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    const config = error.config || {};
    const method = (config.method || 'GET').toUpperCase();
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    const status = error.response ? error.response.status : 'NETWORK_ERR';
    console.error(`[${getLogTimestamp()}][API_ERR] [Jules] ${status} ${method} ${fullUrl}`, {
      message: error.message,
      responseData: error.response?.data,
      error,
    });
    return Promise.reject(error);
  }
);

// GitHub API 전용 Axios 인스턴스
export const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 10000,
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
});

// GitHub API 요청 인터셉터
githubClient.interceptors.request.use((config) => {
  const token = getGitHubToken();
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }

  const method = (config.method || 'GET').toUpperCase();
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log(`[${getLogTimestamp()}][API_REQ] [GitHub-Axios] ${method} ${fullUrl}`, {
    params: config.params,
    headers: { ...config.headers, Authorization: token ? 'token [MASKED]' : undefined },
    data: config.data,
  });

  return config;
});

// GitHub API 응답 인터셉터
githubClient.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'GET').toUpperCase();
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    console.log(`[${getLogTimestamp()}][API_RES] [GitHub-Axios] ${response.status} ${response.statusText} ${method} ${fullUrl}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    const config = error.config || {};
    const method = (config.method || 'GET').toUpperCase();
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    const status = error.response ? error.response.status : 'NETWORK_ERR';
    console.error(`[${getLogTimestamp()}][API_ERR] [GitHub-Axios] ${status} ${method} ${fullUrl}`, {
      message: error.message,
      responseData: error.response?.data,
      error,
    });
    return Promise.reject(error);
  }
);
