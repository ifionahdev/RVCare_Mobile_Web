import { prisma } from "../config/prisma.js";

const notificationDto = (notification) => ({
  id: notification.notificationId,
  category: notification.category,
  title: notification.title,
  message: notification.message,
  relatedType: notification.relatedType,
  relatedId: notification.relatedId,
  createdAt: notification.createdAt,
  readAt: notification.readAt,
});

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.customerNotification.findMany({
      where: {
        accountId: req.user.accountId,
        account: { is: { isDeleted: false } },
      },
      orderBy: [{ createdAt: "desc" }, { notificationId: "desc" }],
      take: 100,
    });
    return res.json({ notifications: notifications.map(notificationDto) });
  } catch (error) {
    return next(error);
  }
};

export const markMyNotificationRead = async (req, res, next) => {
  try {
    const notificationId = Number(req.params.notificationId);
    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ message: "Notification ID is invalid." });
    }

    const notification = await prisma.customerNotification.findFirst({
      where: { notificationId, accountId: req.user.accountId },
      select: { notificationId: true, readAt: true },
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (notification.readAt == null) {
      await prisma.customerNotification.update({
        where: { notificationId },
        data: { readAt: new Date() },
      });
    }
    return res.json({ message: "Notification marked as read." });
  } catch (error) {
    return next(error);
  }
};

export const markMyNotificationsRead = async (req, res, next) => {
  try {
    await prisma.customerNotification.updateMany({
      where: { accountId: req.user.accountId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.json({ message: "Notifications marked as read." });
  } catch (error) {
    return next(error);
  }
};
