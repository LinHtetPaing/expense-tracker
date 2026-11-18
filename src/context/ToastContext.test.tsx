// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '@/context/ToastContext';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ToastApi = ReturnType<typeof useToast>;

const roots: Root[] = [];

function mount(): { api: () => ToastApi; unmount: () => void } {
  let current: ToastApi | null = null;

  function Probe() {
    current = useToast();
    return null;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);

  act(() => {
    root.render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
  });

  if (!current) {
    throw new Error('Toast provider did not render');
  }

  return {
    api: () => {
      if (!current) throw new Error('Toast provider is not mounted');
      return current;
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
      current = null;
      const index = roots.indexOf(root);
      if (index >= 0) roots.splice(index, 1);
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-18T01:00:00.000Z'));
});

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    act(() => root?.unmount());
  }
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ToastProvider', () => {
  it('rejects a screen that shows a message without the provider', () => {
    let caught: Error | null = null;

    class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
      state = { failed: false };

      static getDerivedStateFromError(error: Error) {
        caught = error;
        return { failed: true };
      }

      render() {
        return this.state.failed ? null : this.props.children;
      }
    }

    function Outside() {
      useToast();
      return null;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      root.render(
        <Boundary>
          <Outside />
        </Boundary>
      );
    });

    expect(caught).toEqual(new Error('useToast must be used within a ToastProvider'));
    consoleError.mockRestore();
  });

  it('keeps a success message for four seconds and an error for six seconds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const view = mount();

    act(() => {
      view.api().showSuccess('Saved the record');
    });

    expect(view.api().toasts).toEqual([
      {
        id: 'toast-1794963600000-4fzzz',
        type: 'success',
        title: 'Success',
        message: 'Saved the record',
        duration: 4000,
      },
    ]);
    expect(document.body.textContent).toContain('Saved the record');

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(view.api().toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(view.api().toasts).toEqual([]);
    expect(document.body.textContent).not.toContain('Saved the record');

    act(() => {
      view.api().showError('The backup could not be read', 'Import failed');
    });
    expect(view.api().toasts).toEqual([
      {
        id: 'toast-1794963604000-4fzzz',
        type: 'error',
        title: 'Import failed',
        message: 'The backup could not be read',
        duration: 6000,
      },
    ]);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(view.api().toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(view.api().toasts).toEqual([]);
  });

  it('leaves a message with no timer until it is dismissed, and dismisses only that message', () => {
    let call = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      call += 1;
      return call === 1 ? 0.1 : 0.2;
    });
    const view = mount();

    act(() => {
      view.api().addToast({ type: 'warning', title: 'Warning', message: 'Stay', duration: 0 });
      view.api().showInfo('Also here');
    });

    expect(view.api().toasts.map((toast) => toast.id)).toEqual([
      'toast-1794963600000-3llll',
      'toast-1794963600000-77777',
    ]);
    expect(view.api().toasts[1]).toMatchObject({
      type: 'info',
      title: 'Info',
      message: 'Also here',
      duration: 4000,
    });

    act(() => {
      view.api().removeToast('toast-1794963600000-3llll');
    });
    expect(view.api().toasts.map((toast) => toast.message)).toEqual(['Also here']);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(view.api().toasts).toEqual([]);
  });

  it('uses the default titles for a warning and an error', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const view = mount();

    act(() => {
      view.api().showWarning('Check the amount');
      view.api().showError('Could not save');
    });

    expect(view.api().toasts.map((toast) => [toast.type, toast.title, toast.duration])).toEqual([
      ['warning', 'Warning', 4000],
      ['error', 'Error', 6000],
    ]);
  });
});
