const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");

test("the load-test runner bounds concurrency and reports successful requests", async (context) => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  assert.equal(typeof address, "object");
  const moduleUrl = pathToFileURL(path.resolve(__dirname, "../scripts/load-test.mjs")).href;
  const { runLoadTest } = await import(moduleUrl);
  const result = await runLoadTest({
    url: `http://127.0.0.1:${address.port}/api/health`,
    requests: 6,
    concurrency: 2,
    timeoutMs: 2_000,
  });

  assert.equal(result.requests, 6);
  assert.equal(result.concurrency, 2);
  assert.equal(result.failures, 0);
  assert.equal(result.statuses[200], 6);
  assert.ok(result.requestsPerSecond > 0);
  assert.ok(result.responseBodyBytes > 0);
});
