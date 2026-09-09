import axios from 'axios';
import { getJulesApiKey } from './julesApi';
import { getGitHubToken } from './githubApi';

// Jules API 전용 Axios 인스턴스
export const julesClient = axios.create({
  baseURL: 'https://jules.googleapis.com/v1alpha',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Jules API 요청 인터셉터: API 키가 존재할 경우 URL 쿼리 파라미터로 자동 주입
julesClient.interceptors.request.use((config) => {
  const apiKey = getJulesApiKey();
  if (apiKey) {
    config.params = {
      ...config.params,
      key: apiKey,
    };
  }
  return config;
});

// GitHub API 전용 Axios 인스턴스
export const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 10000,
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
});

// GitHub API 요청 인터셉터: GitHub PAT가 저장되어 있을 경우 Authorization 헤더 자동 주입
githubClient.interceptors.request.use((config) => {
  const token = getGitHubToken();
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }
  return config;
});
