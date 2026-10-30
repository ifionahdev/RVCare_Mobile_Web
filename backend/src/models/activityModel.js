import {prisma} from '../config/prisma.js';

export const logActivity = async (accountId, action, source) => 
  prisma.activityLog.create({
    data: {
      accountId,
      action,
      source
    },
  });