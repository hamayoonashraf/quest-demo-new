const CREDITS_PER_TASK = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/;

function isValidIsoTimestamp(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const match = ISO_TIMESTAMP.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const daysInMonth = [31, (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]
    || hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  if (match[7] !== 'Z'
    && (Number(match[8]) > 23 || Number(match[9]) > 59)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function getWindow(settlementTime) {
  if (!(settlementTime instanceof Date) || Number.isNaN(settlementTime.getTime())) {
    throw new TypeError('settlementTime must be a valid Date');
  }

  if (settlementTime.getUTCDay() !== 2
    || settlementTime.getUTCHours() !== 9
    || settlementTime.getUTCMinutes() !== 0
    || settlementTime.getUTCSeconds() !== 0
    || settlementTime.getUTCMilliseconds() !== 0) {
    throw new RangeError('settlementTime must be Tuesday at 09:00 UTC');
  }

  const windowStart = Date.UTC(
    settlementTime.getUTCFullYear(),
    settlementTime.getUTCMonth(),
    settlementTime.getUTCDate() - 1
  );
  const windowEnd = windowStart + 7 * MS_PER_DAY;

  return {
    start: windowStart,
    end: windowEnd,
    key: new Date(windowStart).toISOString(),
  };
}

function validateTask(task, index) {
  const errors = [];

  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    return [{ index, message: 'task must be an object' }];
  }
  if (typeof task.taskId !== 'string' || task.taskId.trim().length === 0) {
    errors.push({ index, field: 'taskId', message: 'taskId must be a non-empty string' });
  }
  if (typeof task.completed !== 'boolean') {
    errors.push({ index, field: 'completed', message: 'completed must be a boolean' });
  }
  if (!isValidIsoTimestamp(task.completedAt)) {
    errors.push({ index, field: 'completedAt', message: 'completedAt must be a valid ISO-8601 timestamp with a timezone' });
  }

  return errors;
}

class PayoutService {
  constructor({ notify = async () => {} } = {}) {
    this.notify = notify;
    this.creditLedger = [];
    this.systemEvents = [];
  }

  async settle(tasks, settlementTime) {
    const window = getWindow(settlementTime);
    if (!Array.isArray(tasks)) {
      throw new TypeError('tasks must be an array');
    }

    const errors = [];
    const processedIds = new Set();
    const creditedTaskIds = [];
    const alreadyPaidTaskIds = [];
    const seenIdsInBatch = new Set();
    let creditsAwarded = 0;

    for (const [index, task] of tasks.entries()) {
      const taskErrors = validateTask(task, index);
      if (taskErrors.length > 0) {
        errors.push(...taskErrors);
        continue;
      }
      if (!task.completed) {
        continue;
      }

      const completedAt = Date.parse(task.completedAt);
      if (completedAt < window.start || completedAt >= window.end) {
        continue;
      }

      if (seenIdsInBatch.has(task.taskId) || processedIds.has(task.taskId)) {
        alreadyPaidTaskIds.push(task.taskId);
        continue;
      }
      seenIdsInBatch.add(task.taskId);

      const existingEntry = this.creditLedger.find((entry) => (
        entry.taskId === task.taskId && entry.payoutWindow === window.key
      ));
      if (existingEntry) {
        alreadyPaidTaskIds.push(task.taskId);
        continue;
      }

      processedIds.add(task.taskId);
      this.creditLedger.push({
        taskId: task.taskId,
        payoutWindow: window.key,
        credits: CREDITS_PER_TASK,
      });
      creditedTaskIds.push(task.taskId);
      creditsAwarded += CREDITS_PER_TASK;
    }

    const successfulTaskIds = [...new Set([...creditedTaskIds, ...alreadyPaidTaskIds])];
    const success = successfulTaskIds.length > 0;
    let notificationError;

    if (creditsAwarded > 0) {
      const event = {
        type: 'payout.succeeded',
        payoutWindow: window.key,
        taskIds: [...creditedTaskIds],
        credits: creditsAwarded,
      };
      this.systemEvents.push(event);

      try {
        await this.notify(event);
      } catch (error) {
        notificationError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      success,
      payoutWindow: window.key,
      creditsAwarded,
      creditedTaskIds,
      alreadyPaidTaskIds,
      errors,
      notificationError,
    };
  }
}

module.exports = PayoutService;
