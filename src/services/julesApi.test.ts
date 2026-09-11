import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredSessions, saveStoredSessions, JulesSession } from './julesApi';

describe('Jules API Data Mapping & Cache Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('safeParseJulesSession() - preserves custom repository and parses activities', () => {
    const rawData = {
      id: 'test-real-1',
      sourceContext: {
        source: {
          github: {
            repository: 'myorg/real-project',
            baseBranch: 'main',
          },
        },
      },
      title: 'Real API Task',
      activities: [
        {
          id: 'act-1',
          actor: 'USER',
          message: 'Real User Message',
          createTime: '2026-09-10T10:00:00Z',
        },
        {
          id: 'act-2',
          actor: 'AGENT',
          message: 'Real Agent Response',
          createTime: '2026-09-10T10:01:00Z',
        },
      ],
      outputs: {
        pullRequestUrl: 'https://github.com/myorg/real-project/pull/15',
        pullRequestNumber: 15,
      },
    };

    const parsed = getStoredSessions();
    expect(parsed).toBeDefined();

    const singleParsed = import('./julesApi').then(({ safeParseJulesSession }) => {
      const res = safeParseJulesSession(rawData);
      expect(res.repository).toBe('myorg/real-project');
      expect(res.prUrl).toBe('https://github.com/myorg/real-project/pull/15');
      expect(res.prNumber).toBe(15);
      expect(res.messages.length).toBe(2);
      expect(res.messages[0].sender).toBe('user');
      expect(res.messages[0].content).toBe('Real User Message');
    });

    return singleParsed;
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

  it('safeParseJulesSession() - infers repository from PR URL when repository field is missing', async () => {
    const { safeParseJulesSession } = await import('./julesApi');

    const rawDataNoRepo = {
      id: 'test-infer-1',
      title: 'Inferred Repo Task',
      outputs: {
        pullRequestUrl: 'https://github.com/lunaticwan/jules/pull/12',
        pullRequestNumber: 12,
      },
    };

    const parsed = safeParseJulesSession(rawDataNoRepo);
    expect(parsed.repository).toBe('lunaticwan/jules');
    expect(parsed.prUrl).toBe('https://github.com/lunaticwan/jules/pull/12');
    expect(parsed.prNumber).toBe(12);
  });
});
