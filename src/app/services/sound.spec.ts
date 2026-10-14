import { TestBed } from '@angular/core/testing';
import { SoundService } from './sound';

describe('SoundService', () => {
  let service: SoundService;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    vi.stubGlobal('localStorage', localStorageMock);
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start muted by default', () => {
    expect(service.enabled()).toBe(false);
  });

  it('should start muted when there is no stored preference', () => {
    store['api-explorer-sound'] = 'false';
    const fresh = new SoundService();
    expect(fresh.enabled()).toBe(false);
  });

  it('should read stored preference on creation', () => {
    store['api-explorer-sound'] = 'true';
    const fresh = new SoundService();
    expect(fresh.enabled()).toBe(true);
  });

  it('should toggle and persist the preference', () => {
    expect(service.enabled()).toBe(false);
    service.toggle();
    expect(service.enabled()).toBe(true);
    expect(store['api-explorer-sound']).toBe('true');
    service.toggle();
    expect(service.enabled()).toBe(false);
    expect(store['api-explorer-sound']).toBe('false');
  });

  it('should be a no-op when no AudioContext exists (jsdom)', () => {
    service.enabled.set(true);
    expect(() => service.click('neutral')).not.toThrow();
    expect(() => service.modalOpen('pokemon')).not.toThrow();
    expect(() => service.modalClose('portal')).not.toThrow();
    expect(() => service.success('pokemon')).not.toThrow();
    expect(() => service.enter('neutral')).not.toThrow();
  });

  it('should not play when muted', () => {
    const ctxSpy = vi.fn();
    vi.stubGlobal(
      'AudioContext',
      class {
        currentTime = 0;
        state = 'running';
        destination = {};
        sampleRate = 44100;
        createGain() {
          ctxSpy();
          return {
            gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
            connect() {},
          };
        }
        createOscillator() {
          return {
            type: 'sine',
            frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
            connect() {},
            start() {},
            stop() {},
          };
        }
        resume() {
          return Promise.resolve();
        }
      } as unknown as typeof AudioContext,
    );

    expect(service.enabled()).toBe(false);
    service.click('neutral');
    expect(ctxSpy).not.toHaveBeenCalled();
  });
});
