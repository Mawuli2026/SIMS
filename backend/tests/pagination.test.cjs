const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createPaginationMeta,
  parsePaginationQuery,
} = require("../dist/utils/pagination.js");

test("pagination uses safe defaults and trims search text", () => {
  assert.deepEqual(parsePaginationQuery({ q: "  rice  " }), {
    page: 1,
    pageSize: 20,
    searchQuery: "rice",
  });
});

test("pagination accepts positive values and caps oversized pages", () => {
  assert.deepEqual(parsePaginationQuery({ page: "3", pageSize: "500" }), {
    page: 3,
    pageSize: 100,
    searchQuery: "",
  });
  assert.equal(parsePaginationQuery({ page: "-2", pageSize: "invalid" }).page, 1);
});

test("pagination metadata reports the correct final page", () => {
  assert.deepEqual(createPaginationMeta(41, 2, 20), {
    page: 2,
    pageSize: 20,
    totalItems: 41,
    totalPages: 3,
  });
  assert.equal(createPaginationMeta(0, 1, 20).totalPages, 0);
});
