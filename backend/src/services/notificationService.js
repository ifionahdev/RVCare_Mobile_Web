import { prisma } from "../config/prisma.js";
import { sendCustomerNotificationEmail } from "./emailService.js";
import { emitNotificationCreated } from "../realtime.js";

export const createCustomerNotification = async ({
  accountId,
  category,
  title,
  message,
  relatedType,
  relatedId,
}) => {
  let owner;
  try {
    owner = await prisma.petOwner.findFirst({
      where: {
        accountId,
        isDeleted: false,
        account: { is: { isDeleted: false } },
      },
      select: {
        emailNotification: true,
        account: { select: { email: true } },
      },
    });
  } catch (error) {
    console.error(
      `[email] Could not load notification preferences for account ${accountId}:`,
      error.message,
    );
    return;
  }
  if (!owner) return;

  try {
    const notification = await prisma.customerNotification.create({
      data: {
        accountId,
        category,
        title,
        message,
        relatedType,
        relatedId,
      },
    });
    emitNotificationCreated(accountId, {
      id: notification.notificationId,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    console.error(
      `[notification] Could not create notification for account ${accountId}:`,
      error.message,
    );
  }

  if (owner.emailNotification) {
    try {
      await sendCustomerNotificationEmail(owner.account.email, title, message);
    } catch (error) {
      console.error(
        `[email] Notification delivery failed for account ${accountId}:`,
        error.message,
      );
    }
  }
};

export const notifyRecordAvailable = async ({ visitId, recordType, recordId }) => {
  try {
    const visit = await prisma.visit.findFirst({
      where: { visitId, isDeleted: false, pet: { is: { isDeleted: false } } },
      select: {
        pet: {
          select: {
            petName: true,
            owner: { select: { accountId: true } },
          },
        },
        service: { select: { serviceName: true } },
      },
    });
    if (!visit) {
      console.error(
        `[email] Could not find visit ${visitId} for a published record.`,
      );
      return;
    }

    const isLab = recordType === "laboratory";
    const label = isLab ? "laboratory report" : "medical record";
    await createCustomerNotification({
      accountId: visit.pet.owner.accountId,
      category: "records",
      title: isLab ? "Laboratory report available" : "Medical record available",
      message: `${visit.pet.petName}'s ${label} for ${visit.service.serviceName} is ready to view.`,
      relatedType: recordType,
      relatedId: recordId,
    });
  } catch (error) {
    console.error(
      `[email] Could not send record notification for ${recordType} ${recordId}:`,
      error.message,
    );
  }
};
