import { registerForPushNotificationsAsync } from '../notification.service';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userService } from '../user.service';
import { sessionService } from '../session.service';

let mockIsDevice = true;
jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
  set isDevice(val) { mockIsDevice = val; }
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { MAX: 5 }
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'my-project-id' } } }
}));

jest.mock('../user.service', () => ({
  userService: { updatePushToken: jest.fn() }
}));

jest.mock('../session.service', () => ({
  sessionService: { getToken: jest.fn() }
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  it('nao deve registrar se for simulador', async () => {
    (Device as any).isDevice = false;
    const token = await registerForPushNotificationsAsync();
    expect(token).toBeNull();
    (Device as any).isDevice = true; // reset
  });

  it('deve configurar canal no android', async () => {
    Platform.OS = 'android';
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'expo-token' });

    await registerForPushNotificationsAsync();

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.any(Object));
  });

  it('deve pedir permissao se nao existir e retornar null se negada', async () => {
    Platform.OS = 'ios';
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const token = await registerForPushNotificationsAsync();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(token).toBeNull();
  });

  it('deve gerar token se concedido e atrelar ao usuario logado', async () => {
    Platform.OS = 'ios';
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'token123' });
    (sessionService.getToken as jest.Mock).mockResolvedValue('user-token');

    const token = await registerForPushNotificationsAsync();
    
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'my-project-id' });
    expect(userService.updatePushToken).toHaveBeenCalledWith('token123');
    expect(token).toBe('token123');
  });

  it('deve propagar erro se as apis base de notificacao falharem', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Fatal'));
    await expect(registerForPushNotificationsAsync()).rejects.toThrow('Fatal');
  });

  it('deve retornar undefined se a geracao de token expo falhar e cair no try catch final', async () => {
    Platform.OS = 'ios';
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(new Error('Expo API down'));
    const token = await registerForPushNotificationsAsync();
    expect(token).toBeUndefined();
  });
});
