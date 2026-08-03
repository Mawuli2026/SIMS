const assert = require("node:assert/strict");
const { test } = require("node:test");
const { reportQuerySchema } = require("../dist/utils/validation.js");

test("report date range accepts optional valid inclusive dates", () => {
  assert.equal(reportQuerySchema.safeParse({}).success, true);
  assert.equal(reportQuerySchema.safeParse({ fromDate: "2026-08-01" }).success, true);
  assert.equal(reportQuerySchema.safeParse({ fromDate: "2026-08-01", toDate: "2026-08-03" }).success, true);
});

test("report date range rejects invalid dates and reversed ranges", () => {
  const malformed = reportQuerySchema.safeParse({ fromDate: "08/01/2026" });
  assert.equal(malformed.success, false);
  assert.equal(malformed.error.issues[0].message, "Report dates must use YYYY-MM-DD format.");

  const impossible = reportQuerySchema.safeParse({ toDate: "2026-02-30" });
  assert.equal(impossible.success, false);
  assert.equal(impossible.error.issues[0].message, "Report date must be valid.");

  const reversed = reportQuerySchema.safeParse({ fromDate: "2026-08-03", toDate: "2026-08-01" });
  assert.equal(reversed.success, false);
  assert.equal(reversed.error.issues[0].message, "The start date must not be later than the end date.");
});
