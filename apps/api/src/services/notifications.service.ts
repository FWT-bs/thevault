export class NotificationsService {
  async scheduleStreakReminder(userId: string) {
    return {
      userId,
      scheduled: true,
      channel: "push",
      scheduledAt: new Date().toISOString(),
    };
  }
}
