import { renderHook, act } from '@testing-library/react-native';
import { useAutoSpeakOnce } from '../useAutoSpeakOnce';
import { speakAndWait, stopSpeaking } from '../../services/speech.service';
import { useAccessibility } from '../../contexts/AccessibilityContext';

jest.mock('../../services/speech.service', () => ({
  speakAndWait: jest.fn().mockResolvedValue(true),
  stopSpeaking: jest.fn()
}));

jest.mock('../../contexts/AccessibilityContext', () => ({
  useAccessibility: jest.fn()
}));

// Mock do expo-router executando sincrono
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn((cb) => {
    cb();
  })
}));

describe('useAutoSpeakOnce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('nao deve falar se autoRead e forceSpeak forem falsos', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ autoRead: false });
    renderHook(() => useAutoSpeakOnce('key1', 'Msg', false));
    jest.runAllTimers();
    expect(speakAndWait).not.toHaveBeenCalled();
  });

  it('nao deve falar se a mensagem for vazia', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ autoRead: true });
    renderHook(() => useAutoSpeakOnce('key2', '   ', false));
    jest.runAllTimers();
    expect(speakAndWait).not.toHaveBeenCalled();
  });

  it('deve falar apenas uma vez usando a key correta', async () => {
    (useAccessibility as jest.Mock).mockReturnValue({ autoRead: true });
    const { result } = renderHook(() => useAutoSpeakOnce('key3', 'Mensagem', false));
    
    act(() => {
      jest.advanceTimersByTime(400); // 350ms timeout
    });

    expect(speakAndWait).toHaveBeenCalledWith('Mensagem');

    // Ao chamar novamente com a mesma key, nao deve falar
    renderHook(() => useAutoSpeakOnce('key3', 'Mensagem Nova', false));
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(speakAndWait).toHaveBeenCalledTimes(1);
  });
});
