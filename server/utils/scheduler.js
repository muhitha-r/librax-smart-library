const mongoose = require('mongoose');
const cron = require('node-cron');
const Notification = require('../models/Notification');
const Reservation = require('../models/Reservation');
const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const BorrowSetting = require('../models/BorrowSetting');

/**
 * Helper to safely create an in-app notification without throwing unhandled exceptions
 */
async function sendNotification({
  recipient,
  userId,
  title,
  message,
  type = 'GENERAL',
  link = null,
  relatedId = null,
  relatedModel = null,
}) {
  try {
    const targetUserId = recipient || userId;
    if (!targetUserId) return null;
    return await Notification.create({
      recipient: targetUserId,
      user: targetUserId,
      title,
      message,
      type,
      link,
      relatedId,
      relatedModel,
      read: false,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
}

/**
 * Re-indexes queue positions (1, 2, 3...) for active waiting reservations on a specific book
 */
async function recalculateQueuePositions(bookId) {
  try {
    const waitingList = await Reservation.find({
      book: bookId,
      status: { $in: ['Pending', 'Waiting'] },
    }).sort({ reservedAt: 1, reservationDate: 1 });

    for (let index = 0; index < waitingList.length; index++) {
      const targetPos = index + 1;
      if (waitingList[index].queuePosition !== targetPos) {
        waitingList[index].queuePosition = targetPos;
        await waitingList[index].save();
      }
    }
    return waitingList.length;
  } catch (err) {
    console.error('Error recalculating queue positions for book:', bookId, err.message);
    return 0;
  }
}

/**
 * Checks and handles:
 * 1. Expired reservation holds (auto-advancing queue)
 * 2. Due date reminders (due within next 24h, creating DUE_DATE_REMINDER)
 * 3. Overdue notifications and fine updates
 */
async function checkScheduledReminders() {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // --- 1. Process Expired Reservation Holds ---
    const expiredHolds = await Reservation.find({
      status: 'Available',
      holdUntil: { $ne: null, $lt: now },
    }).populate('book user');

    for (const hold of expiredHolds) {
      hold.status = 'Expired';
      await hold.save();

      const holdUserId = hold.user?._id || hold.user;

      // Notify the expired user
      await sendNotification({
        recipient: holdUserId,
        userId: holdUserId,
        title: 'Reservation Hold Expired',
        message: `Your reservation pickup window for '${hold.book?.title || 'Book'}' has expired and the copy has been released.`,
        type: 'FINE_ALERT',
        link: '/reservations',
        relatedId: hold._id,
        relatedModel: 'Reservation',
      });

      // Check if next user in queue exists
      const nextReservation = await Reservation.findOne({
        book: hold.book?._id,
        status: { $in: ['Pending', 'Waiting'] },
      }).sort({ reservedAt: 1, reservationDate: 1 }).populate('user');

      if (nextReservation) {
        const holdPeriodDays = 3;
        const newHoldUntil = new Date(now.getTime() + holdPeriodDays * 24 * 60 * 60 * 1000);

        nextReservation.status = 'Available';
        nextReservation.holdUntil = newHoldUntil;
        nextReservation.expiryDate = newHoldUntil;
        nextReservation.notifiedAt = now;
        await nextReservation.save();

        await recalculateQueuePositions(hold.book?._id);

        const nextUserId = nextReservation.user?._id || nextReservation.user;
        await sendNotification({
          recipient: nextUserId,
          userId: nextUserId,
          title: 'Reserved Book Ready for Pickup',
          message: `Good news! '${hold.book?.title}' is now ready for pickup at the circulation desk. Please claim it before ${newHoldUntil.toLocaleDateString()}.`,
          type: 'BOOK_AVAILABLE',
          link: '/reservations',
          relatedId: nextReservation._id,
          relatedModel: 'Reservation',
        });
      } else {
        // No waiting reservations; release copy back to general catalog
        if (hold.book?._id) {
          await Book.findByIdAndUpdate(hold.book._id, { $inc: { availableCopies: 1 } });
        }
      }
    }

    // --- 2. Upcoming Due Date Reminders (status === 'Borrowed' and dueDate within next 24 hours) ---
    const upcomingLoans = await BorrowRecord.find({
      status: 'Borrowed',
      dueDate: { $gt: now, $lte: twentyFourHoursFromNow },
    }).populate('book user');

    for (const loan of upcomingLoans) {
      const recipientId = loan.user?._id || loan.user;
      if (!recipientId) continue;

      // Prevent duplicate reminder within 24 hours
      const existingNotice = await Notification.findOne({
        $or: [{ recipient: recipientId }, { user: recipientId }],
        relatedId: loan._id,
        type: { $in: ['DUE_DATE_REMINDER', 'Reminder'] },
        createdAt: { $gte: twentyFourHoursAgo },
      });

      if (!existingNotice) {
        const dueDateStr = new Date(loan.dueDate).toLocaleDateString();
        await sendNotification({
          recipient: recipientId,
          userId: recipientId,
          title: 'Book Due Date Reminder',
          message: `The book '${loan.book?.title || 'Borrowed title'}' is due on ${dueDateStr}. Please return or renew it to avoid late fines.`,
          type: 'DUE_DATE_REMINDER',
          link: '/borrow',
          relatedId: loan._id,
          relatedModel: 'BorrowRecord',
        });
      }
    }

    // --- 3. Overdue Book Notices ---
    const settings = await BorrowSetting.getSettings();
    const finePerDay = settings.finePerDay || 5;

    const overdueLoans = await BorrowRecord.find({
      status: { $in: ['Borrowed', 'Overdue'] },
      dueDate: { $lt: now },
    }).populate('book user');

    for (const loan of overdueLoans) {
      const recipientId = loan.user?._id || loan.user;
      if (!recipientId) continue;

      const dueMidnight = new Date(new Date(loan.dueDate).setHours(0, 0, 0, 0));
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const overdueDays = Math.max(1, Math.round((nowMidnight - dueMidnight) / (1000 * 60 * 60 * 24)));
      const fineAmount = overdueDays * finePerDay;

      // Update record fineAmount and status
      loan.status = 'Overdue';
      if (loan.finePaymentStatus !== 'Paid' && loan.finePaymentStatus !== 'Waived') {
        loan.fineAmount = fineAmount;
        loan.finePaymentStatus = 'Unpaid';
      }
      await loan.save();

      // Check if overdue notification already sent in last 24h
      const existingOverdueNotice = await Notification.findOne({
        $or: [{ recipient: recipientId }, { user: recipientId }],
        relatedId: loan._id,
        type: { $in: ['FINE_ALERT', 'Overdue'] },
        createdAt: { $gte: twentyFourHoursAgo },
      });

      if (!existingOverdueNotice) {
        await sendNotification({
          recipient: recipientId,
          userId: recipientId,
          title: 'Overdue Book Notice',
          message: `Your loan for '${loan.book?.title || 'Book'}' is ${overdueDays} day(s) overdue. Current accrued fine: ₹${fineAmount}. Please return it immediately.`,
          type: 'FINE_ALERT',
          link: '/borrow',
          relatedId: loan._id,
          relatedModel: 'BorrowRecord',
        });
      }
    }
  } catch (error) {
    console.error('Error during scheduled reminders check:', error.message);
  }
}

let cronJob = null;
let fallbackInterval = null;

/**
 * Initializes the background reminder runner using node-cron daily at 08:00 AM
 */
function startScheduler(intervalMinutes = 30) {
  if (cronJob) {
    // Avoid duplicate listeners
    return cronJob;
  }

  // Run once after 5 seconds to warm up
  setTimeout(() => {
    checkScheduledReminders().catch((err) =>
      console.error('Warmup reminder check error:', err.message)
    );
  }, 5000);

  // Configure daily check at 08:00 AM using node-cron ('0 8 * * *')
  try {
    cronJob = cron.schedule('0 8 * * *', () => {
      console.info('[Scheduler] Running daily 08:00 AM due date reminder scan...');
      checkScheduledReminders().catch((err) =>
        console.error('Cron reminder check error:', err.message)
      );
    });
  } catch (err) {
    console.error('Failed to register node-cron schedule:', err.message);
  }

  // Also maintain interval timer for hold checks
  if (intervalMinutes > 0 && !fallbackInterval) {
    fallbackInterval = setInterval(() => {
      checkScheduledReminders().catch((err) =>
        console.error('Interval reminder check error:', err.message)
      );
    }, intervalMinutes * 60 * 1000);
  }

  return cronJob;
}

function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
  if (fallbackInterval) {
    clearInterval(fallbackInterval);
    fallbackInterval = null;
  }
}

module.exports = {
  sendNotification,
  recalculateQueuePositions,
  checkScheduledReminders,
  startScheduler,
  stopScheduler,
};

