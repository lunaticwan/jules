import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  getLogTimestamp,
  summarizeElement,
  initGlobalLogger,
  setupReactQueryLogger,
} from './logger';

describe('Logger Utility Test Suite', () => {
  it('getLogTimestamp() returns a valid ISO string', () => {
    const timestamp = getLogTimestamp();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('summarizeElement() extracts element metadata correctly', () => {
    const button = document.createElement('button');
    button.id = 'test-btn';
    button.className = 'btn primary-btn';
    button.innerText = '클릭 테스트';

    const summary = summarizeElement(button);
    expect(summary.tag).toBe('BUTTON');
    expect(summary.id).toBe('test-btn');
    expect(summary.selector).toBe('BUTTON#test-btn.btn.primary-btn');
    expect(summary.text).toBe('클릭 테스트');
  });

  it('summarizeElement() masks password input values', () => {
    const input = document.createElement('input');
    input.type = 'password';
    input.value = 'secret123';

    const summary = summarizeElement(input);
    expect(summary.type).toBe('password');
    expect(summary.value).toBe('********');
  });

  it('initGlobalLogger() attaches event listeners without errors', () => {
    const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    initGlobalLogger();
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('[LOGGER_INIT]'));

    // Simulated click
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    expect(spyLog).toHaveBeenCalledWith(
      expect.stringContaining('[UI_CLICK]'),
      expect.anything()
    );

    spyLog.mockRestore();
  });

  it('setupReactQueryLogger() registers cache subscribers without throwing', () => {
    const queryClient = new QueryClient();
    const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => setupReactQueryLogger(queryClient)).not.toThrow();

    spyLog.mockRestore();
  });
});
