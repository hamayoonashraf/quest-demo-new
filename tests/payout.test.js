const { test, expect } = require('@playwright/test');

const PayoutService = process.env.PAYOUT_IMPLEMENTATION === 'faulty'
  ? require('../src/fixtures/faultyPayoutService')
  : require('../src/payoutService');

const settlementTime = new Date('2026-09-29T09:00:00.000Z');

function task(taskId, completedAt, completed = true) {
  return { taskId, completed, completedAt };
}

/**
 * 1. P1 - Happy path award
 * - What: Settle unique, completed tasks in the eligibility window.
 * - Why: Establish the expected baseline award behavior.
 * - Expected: Each qualifying task earns 10 credits and has one ledger entry.
 */
test('happy path awards credits for valid completed tasks', async () => {
  const service = new PayoutService();
  const tasks = [
    task('task-1', '2026-09-29T10:00:00Z'),
    task('task-2', '2026-10-01T12:30:00+08:00'),
  ];

  const result = await service.settle(tasks, settlementTime);

  expect(result.success).toBe(true);
  expect(result.creditsAwarded).toBe(20);
  expect(service.creditLedger).toHaveLength(2);
});

/**
 * 2. P0 - Duplicate input idempotency regression
 * - What: Submit the same completed task ID twice in one payout window.
 * - Why: Duplicate credits are the selected high-impact failure.
 * - Expected: The payout awards 10 credits and stores one ledger entry for the task/window.
 */
test('duplicate task IDs award credits once per payout window', async () => {
  const service = new PayoutService();
  const duplicateTasks = [
    task('duplicate-1', '2026-09-29T10:00:00Z'),
    task('duplicate-1', '2026-09-29T10:00:00Z'),
  ];

  const result = await service.settle(duplicateTasks, settlementTime);

  expect(result.success).toBe(true);
  expect(result.creditsAwarded).toBe(10);
  expect(service.creditLedger.filter((entry) => entry.taskId === 'duplicate-1')).toHaveLength(1);
});

/**
 * 3. P0 - Retry idempotency
 * - What: Retry settlement for the same task ID and payout window.
 * - Why: A retry must confirm prior success without creating a second credit.
 * - Expected: The retry succeeds with zero newly awarded credits and one total ledger entry.
 */
test('retry confirms payout without awarding credits twice', async () => {
  const service = new PayoutService();
  const tasks = [task('retry-1', '2026-09-30T10:00:00Z')];

  const firstResult = await service.settle(tasks, settlementTime);
  const retryResult = await service.settle(tasks, settlementTime);

  expect(firstResult.creditsAwarded).toBe(10);
  expect(retryResult.success).toBe(true);
  expect(retryResult.creditsAwarded).toBe(0);
  expect(service.creditLedger.filter((entry) => entry.taskId === 'retry-1')).toHaveLength(1);
});

/**
 * 4. P1 - Invalid input validation
 * - What: Provide missing IDs, non-boolean completion, and malformed timestamps alongside a valid incomplete task.
 * - Why: Malformed records must be rejected explicitly, while completed=false remains valid but ineligible.
 * - Expected: Three per-task errors, no credits, and no error for the well-formed incomplete task.
 */
test('malformed tasks receive per-task errors', async () => {
  const service = new PayoutService();
  const tasks = [
    { completed: true, completedAt: '2026-09-29T10:00:00Z' },
    { taskId: 'bad-completed', completed: 'true', completedAt: '2026-09-29T10:00:00Z' },
    { taskId: 'bad-time', completed: true, completedAt: 'not-a-timestamp' },
    task('incomplete', '2026-09-29T10:00:00Z', false),
  ];

  const result = await service.settle(tasks, settlementTime);

  expect(result.creditsAwarded).toBe(0);
  expect(result.errors).toHaveLength(3);
  expect(result.errors.every((error) => Number.isInteger(error.index))).toBe(true);
});

/**
 * 5. P1 - Notification failure after payout
 * - What: Make notification delivery fail after a qualifying payout.
 * - Why: Notification failure must not roll back credits or erase the system record.
 * - Expected: Payout succeeds, 10 credits remain in the ledger, and a payout.succeeded event is stored.
 */
test('notification failure preserves credits and stored payout event', async () => {
  const service = new PayoutService({
    notify: async () => {
      throw new Error('synthetic notification failure');
    },
  });

  const result = await service.settle(
    [task('notify-1', '2026-09-29T11:00:00Z')],
    settlementTime
  );

  expect(result.success).toBe(true);
  expect(result.creditsAwarded).toBe(10);
  expect(result.notificationError).toBe('synthetic notification failure');
  expect(service.creditLedger).toHaveLength(1);
  expect(service.systemEvents).toHaveLength(1);
  expect(service.systemEvents[0].type).toBe('payout.succeeded');
});

/**
 * 6. P0 - Eligibility window boundaries
 * - What: Submit tasks immediately before the lower bound, exactly at the lower bound, and exactly at the upper bound.
 * - Why: The lower bound is inclusive and the upper bound is explicitly excluded.
 * - Expected: Only the task at Monday 00:00 UTC earns credits.
 */
test('cutoff includes the lower boundary and excludes the upper boundary', async () => {
  const service = new PayoutService();
  const tasks = [
    task('before-start', '2026-09-27T23:59:59.999Z'),
    task('at-start', '2026-09-28T00:00:00Z'),
    task('at-end', '2026-10-05T00:00:00Z'),
  ];

  const result = await service.settle(tasks, settlementTime);

  expect(result.creditsAwarded).toBe(10);
  expect(result.creditedTaskIds).toEqual(['at-start']);
});

/**
 * 7. P1 - MYT timezone conversion
 * - What: Compare timestamps with an explicit +08:00 offset at the MYT cutoff and immediately before it.
 * - Why: Eligibility must use the instant represented by the timezone-bearing timestamp, not its wall-clock text.
 * - Expected: Monday 07:59:59.999 MYT is excluded; Monday 08:00 MYT is the inclusive UTC window start and is credited.
 */
test('timezone offsets are normalized to the MYT eligibility window', async () => {
  const service = new PayoutService();
  const tasks = [
    task('myt-before', '2026-09-28T07:59:59.999+08:00'),
    task('myt-start', '2026-09-28T08:00:00+08:00'),
  ];

  const result = await service.settle(tasks, settlementTime);

  expect(result.creditsAwarded).toBe(10);
  expect(result.creditedTaskIds).toEqual(['myt-start']);
});

/**
 * 8. P1 - Partial batch failure
 * - What: Mix a malformed task with a valid completed task in the same payout request.
 * - Why: One invalid record must not prevent valid tasks from being settled.
 * - Expected: The valid task earns 10 credits and the malformed task has a per-task error.
 */
test('valid tasks are credited while malformed tasks are rejected', async () => {
  const service = new PayoutService();
  const tasks = [
    task('partial-valid', '2026-10-01T10:00:00Z'),
    { taskId: '', completed: true, completedAt: '2026-10-01T10:00:00Z' },
  ];

  const result = await service.settle(tasks, settlementTime);

  expect(result.creditsAwarded).toBe(10);
  expect(result.creditedTaskIds).toEqual(['partial-valid']);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].field).toBe('taskId');
});

/**
 * 9. P1 - Settlement upper-bound exclusion
 * - What: Compare a task immediately before the MYT upper boundary with one exactly at the boundary.
 * - Why: The next Monday 08:00 MYT cutoff is excluded from the completed payout window.
 * - Expected: The last in-window task earns 10 credits; the task at the upper boundary earns none.
 */
test('settlement excludes a task exactly at the upper MYT cutoff', async () => {
  const service = new PayoutService();
  const tasks = [
    task('before-upper-bound', '2026-10-05T07:59:59.999+08:00'),
    task('at-upper-bound', '2026-10-05T08:00:00+08:00'),
  ];

  const result = await service.settle(tasks, settlementTime);

  expect(result.creditsAwarded).toBe(10);
  expect(result.creditedTaskIds).toEqual(['before-upper-bound']);
});

/**
 * 10. P1 - Notification flow stores successful payout event
 * - What: Fail notification delivery after a qualifying payout and inspect the system event record.
 * - Why: The notification flow must retain an auditable payout success record despite delivery failure.
 * - Expected: Credits remain awarded and the stored event identifies the payout window, task, and credit amount.
 */
test('notification failure leaves a complete stored payout success event', async () => {
  const service = new PayoutService({
    notify: async () => {
      throw new Error('synthetic notification failure');
    },
  });

  const result = await service.settle(
    [task('event-task', '2026-09-29T11:00:00Z')],
    settlementTime
  );

  expect(result.success).toBe(true);
  expect(result.creditsAwarded).toBe(10);
  expect(service.systemEvents).toEqual([{
    type: 'payout.succeeded',
    payoutWindow: '2026-09-28T00:00:00.000Z',
    taskIds: ['event-task'],
    credits: 10,
  }]);
});
