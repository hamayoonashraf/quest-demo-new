const CREDITS_PER_TASK = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

class FaultyPayoutService {
  constructor() {
    this.creditLedger = [];
    this.systemEvents = [];
  }

  async settle(tasks, settlementTime) {
    const windowStart = Date.UTC(
      settlementTime.getUTCFullYear(),
      settlementTime.getUTCMonth(),
      settlementTime.getUTCDate() - 1
    );
    const windowEnd = windowStart + 7 * MS_PER_DAY;
    let creditsAwarded = 0;
    const creditedTaskIds = [];

    for (const task of tasks) {
      const completedAt = Date.parse(task.completedAt);
      if (task.completed && completedAt >= windowStart && completedAt < windowEnd) {
        // Deliberately faulty baseline: no task/window idempotency check.
        this.creditLedger.push({
          taskId: task.taskId,
          payoutWindow: new Date(windowStart).toISOString(),
          credits: CREDITS_PER_TASK,
        });
        creditedTaskIds.push(task.taskId);
        creditsAwarded += CREDITS_PER_TASK;
      }
    }

    return {
      success: creditedTaskIds.length > 0,
      creditsAwarded,
      creditedTaskIds,
    };
  }
}

module.exports = FaultyPayoutService;
