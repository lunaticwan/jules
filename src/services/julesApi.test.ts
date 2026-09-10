import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredSessions, saveStoredSessions, JulesSession } from './julesApi';

describe('Jules API Data Mapping & Cache Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getStoredSessions() - fallback repository when unknown/repository or empty', () => {
    const rawSessions: Partial<JulesSession>[] = [
      {
        id: 'test-1',
        repository: 'unknown/repository',
        prompt: 'Fix bugs in codebase',
        state: 'IN_PROGRESS',
      },
      {
        id: 'test-2',
        repository: '',
        prompt: 'Add test cases',
        state: 'COMPLETED',
      },
    ];

    saveStoredSessions(rawSessions as JulesSession[]);
    const result = getStoredSessions();

    expect(result.length).toBe(2);
    expect(result[0].repository).not.toBe('unknown/repository');
    expect(result[0].repository).toBe('acme/mobile-pwa');
    expect(result[1].repository).toBe('acme/mobile-pwa');
  });

  it('getStoredSessions() - fallback messages array when messages are empty', () => {
    const rawSessions: Partial<JulesSession>[] = [
      {
        id: 'test-3',
        repository: 'org/myrepo',
        prompt: 'Refactor UI',
        state: 'IN_PROGRESS',
        messages: [],
      },
    ];

    saveStoredSessions(rawSessions as JulesSession[]);
    const result = getStoredSessions();

    expect(result[0].messages.length).toBeGreaterThan(0);
    expect(result[0].messages[0].content).toBe('Refactor UI');
  });
});
