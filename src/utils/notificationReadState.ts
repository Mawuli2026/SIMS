const NOTIFICATION_READ_KEY_PREFIX = "sims-read-notifications";

// SalesCart dispatches this event after checkout so the persistent navbar can
// refresh without polling the API while the user is idle.
export const NOTIFICATIONS_CHANGED_EVENT = "sims:notifications-changed";

const storageKey = (userId: number) => `${NOTIFICATION_READ_KEY_PREFIX}:${userId}`;

export const getReadNotificationIds = (userId: number): string[] => {
  try {
    const value = localStorage.getItem(storageKey(userId));
    if (!value) return [];

    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

export const saveReadNotificationIds = (userId: number, notificationIds: string[]) => {
  const uniqueIds = [...new Set(notificationIds)].slice(-100);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(uniqueIds));
  } catch {
    // Notification display should continue even when browser storage is blocked.
  }
  return uniqueIds;
};
