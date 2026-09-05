import { routeReminderService } from "../routeReminder.service";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
  AndroidImportance: { HIGH: 4 },
}));

describe("routeReminderService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-123");
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it("deve retornar erro se leaveHomeDateTime não for informado", async () => {
    const result = await routeReminderService.scheduleReminder({
      destination: "Centro",
      leaveHomeDateTime: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Horário de saída não informado.");
  });

  it("deve retornar erro se a data de saída for inválida", async () => {
    const result = await routeReminderService.scheduleReminder({
      destination: "Centro",
      leaveHomeDateTime: "data-invalida",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Data de saída inválida.");
  });

  it("deve retornar erro se o horário de disparo já passou", async () => {
    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
    const result = await routeReminderService.scheduleReminder({
      destination: "Centro",
      leaveHomeDateTime: pastDate,
      minutesBefore: 10,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("já passou ou está muito próximo");
  });

  it("deve agendar a notificação com sucesso para data futura", async () => {
    const futureLeave = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // daqui a 1 hora
    const result = await routeReminderService.scheduleReminder({
      destination: "Hospital Regional",
      busLine: "Linha 100",
      leaveHomeDateTime: futureLeave,
      beAtStopAt: "15:10",
      minutesBefore: 10,
    });

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe("notif-123");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "🚌 Hora de se preparar para sair!",
          body: expect.stringContaining("Linha 100"),
        }),
      })
    );
  });

  it("deve configurar canal de notificação no Android", async () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";

    try {
      const futureLeave = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await routeReminderService.scheduleReminder({
        destination: "Terminal",
        leaveHomeDateTime: futureLeave,
      });

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        "route-reminders",
        expect.any(Object)
      );
    } finally {
      Platform.OS = originalPlatform;
    }
  });

  it("deve cancelar o lembrete quando solicitado", async () => {
    const success = await routeReminderService.cancelReminder("notif-123");
    expect(success).toBe(true);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("notif-123");
  });
});
