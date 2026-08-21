import { renderHook } from '@testing-library/react-native';
import { useAutoSpeak } from '../useAutoSpeak';
import { speak, stopSpeaking } from '../../services/speech.service';
import { useAccessibility } from '../../contexts/AccessibilityContext';

jest.mock('../../services/speech.service', () => ({
  speak: jest.fn(),
  stopSpeaking: jest.fn()
}));

jest.mock('../../contexts/AccessibilityContext', () => ({
  useAccessibility: jest.fn()
}));

// Mock do expo-router para executar a callback imediatamente retornando o cleanup
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn((cb) => {
    const cleanup = cb();
    return cleanup;
  })
}));

describe('useAutoSpeak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nao deve falar se autoRead for false', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ autoRead: false });
    renderHook(() => useAutoSpeak('Ola'));
    expect(speak).not.toHaveBeenCalled();
  });

  it('nao deve falar se mensagem for vazia', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ autoRead: true });
    renderHook(() => useAutoSpeak('   '));
    expect(speak).not.toHaveBeenCalled();
  });

  it('deve falar se autoRead for true e mensagem valida', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ autoRead: true });
    renderHook(() => useAutoSpeak('Mensagem valida'));
    expect(speak).toHaveBeenCalledWith('Mensagem valida');
  });
});
