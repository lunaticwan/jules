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

  it('safeParseJulesSession() - applies (저장소 정보 미수신) repository fallback when missing', async () => {
    const { safeParseJulesSession } = await import('./julesApi');

    const rawDataNoRepo = {
      id: 'sessions/12365064714472776148',
      title: 'UI 개선 작업',
      createTime: '2026-09-11T00:00:00Z',
    };

    const parsed = safeParseJulesSession(rawDataNoRepo);
    expect(parsed.repository).toBe('(저장소 정보 미수신)');
    expect(parsed.id).toBe('12365064714472776148');
  });

  it('safeParseJulesSession() - matches knownRepos correctly and avoids domain/path misidentification', async () => {
    const { safeParseJulesSession } = await import('./julesApi');

    const knownRepos = ['lunaticwan/roulette', 'lunaticwan/actions-checkout', 'lunaticwan/jules'];

    // 1. Prompt has 'Navigated to https://lunaticwan.github.io/roulette'
    const rawDataRoulette = {
      id: 'sessions/14528529343130375316',
      title: '룰렛 웹 앱 초기화 콘솔 로그 분석',
      prompt: 'Navigated to https://lunaticwan.github.io/roulette ... 화면 진입 시 콘솔로그.',
    };

    const parsedRoulette = safeParseJulesSession(rawDataRoulette, 'sess-1', knownRepos);
    expect(parsedRoulette.repository).toBe('lunaticwan/roulette');

    // 2. Prompt with UI/UX without matching knownRepos
    const rawDataWithUiUxTitle = {
      id: 'sessions/10337981166895172531',
      title: '사전 서비스 UI/UX 개선 및 언어팩 고도화',
      createTime: '2026-09-11T01:43:55Z',
    };

    const parsedUiUx = safeParseJulesSession(rawDataWithUiUxTitle, 'sess-2', knownRepos);
    expect(parsedUiUx.repository).toBe('(저장소 정보 미수신)');
    expect(parsedUiUx.repository).not.toBe('UI/UX');
  });

  it('safeParseJulesSession() - parses timeline and events arrays correctly', async () => {
    const { safeParseJulesSession } = await import('./julesApi');

    const rawDataTimeline = {
      id: 'sess-timeline-1',
      title: 'Timeline Session',
      timeline: [
        { id: 't1', role: 'user', content: 'User Timeline Msg' },
        { id: 't2', role: 'assistant', text: 'Assistant Timeline Resp' },
      ],
    };

    const parsedTimeline = safeParseJulesSession(rawDataTimeline);
    expect(parsedTimeline.messages.length).toBe(2);
    expect(parsedTimeline.messages[0].sender).toBe('user');
    expect(parsedTimeline.messages[0].content).toBe('User Timeline Msg');
    expect(parsedTimeline.messages[1].sender).toBe('jules');
    expect(parsedTimeline.messages[1].content).toBe('Assistant Timeline Resp');
  });

  it('safeParseJulesSession() - parses history and PR URL in prompt text', async () => {
    const { safeParseJulesSession } = await import('./julesApi');

    const rawDataWithHistory = {
      id: 'sess-history-1',
      prompt: 'https://github.com/lunaticwan/jules/pull/99 PR 수정을 검토해주세요',
      history: [
        { id: 'h1', role: 'user', content: '초기 문의' },
        { id: 'h2', role: 'model', content: '답변 결과' },
      ],
    };

    const parsed = safeParseJulesSession(rawDataWithHistory);
    expect(parsed.repository).toBe('lunaticwan/jules');
    expect(parsed.prUrl).toBe('https://github.com/lunaticwan/jules/pull/99');
    expect(parsed.prNumber).toBe(99);
    expect(parsed.messages.length).toBe(2);
    expect(parsed.messages[0].sender).toBe('user');
    expect(parsed.messages[1].sender).toBe('jules');
  });
});
