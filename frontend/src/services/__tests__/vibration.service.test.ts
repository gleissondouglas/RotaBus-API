import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { vibrationService } from '../vibration.service';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy'
  },
  NotificationFeedbackType: {
    Success: 'Success',
    Error: 'Error'
  }
}));

describe('vibrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios'; // Simula ambiente nativo
  });

  it('deve chamar light impact', async () => {
    await vibrationService.light();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });

  it('deve chamar medium impact', async () => {
    await vibrationService.medium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Medium');
  });

  it('deve chamar heavy impact', async () => {
    await vibrationService.heavy();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Heavy');
  });

  it('deve chamar success notification', async () => {
    await vibrationService.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Success');
  });

  it('deve chamar error notification', async () => {
    await vibrationService.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Error');
  });

  it('deve chamar selection feedback', async () => {
    await vibrationService.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  it('nao deve vibrar se estiver na web', async () => {
    Platform.OS = 'web';
    await vibrationService.light();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
