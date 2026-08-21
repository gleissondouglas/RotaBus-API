import { renderHook } from '@testing-library/react-native';
import { useConnectivity } from '../useConnectivity';
import * as NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

jest.mock('@react-native-community/netinfo', () => {
  let callback: any;
  return {
    addEventListener: jest.fn((cb) => {
      callback = cb;
      return jest.fn(); // unsubscribe
    }),
    __triggerChange: (state: any) => {
      if (callback) callback(state);
    }
  };
});

jest.spyOn(Alert, 'alert');

describe('useConnectivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar como conectado e reagir a quedas chamando Alert', () => {
    const { result } = renderHook(() => useConnectivity());
    
    // Inicial default is true
    expect(result.current).toBe(true);

    // Simula queda de conexao
    (NetInfo as any).__triggerChange({ isConnected: false });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Sem Internet",
      expect.any(String),
      expect.any(Array)
    );
  });

  it('deve ignorar isInternetReachable em dev/local', () => {
    // Força DEV local - no jest __DEV__ ja é true
    const { result } = renderHook(() => useConnectivity());
    
    (NetInfo as any).__triggerChange({ isConnected: true, isInternetReachable: false });

    // isConnected devia continuar true ignorando reachability
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
