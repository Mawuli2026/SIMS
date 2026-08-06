import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

const boundedInteger = (value, fallback, maximum) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
};

const percentile = (sortedValues, percentileValue) => {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil(percentileValue * sortedValues.length) - 1);
  return sortedValues[index];
};

export const runLoadTest = async ({
  url = process.env.LOAD_TEST_URL ?? "http://localhost:5000/api/health",
  requests = boundedInteger(process.env.LOAD_TEST_REQUESTS, 20, 500),
  concurrency = boundedInteger(process.env.LOAD_TEST_CONCURRENCY, 5, 50),
  timeoutMs = boundedInteger(process.env.LOAD_TEST_TIMEOUT_MS, 15_000, 60_000),
  token = process.env.LOAD_TEST_TOKEN ?? "",
} = {}) => {
  const target = new URL(url);
  if (!/^https?:$/.test(target.protocol)) throw new Error("LOAD_TEST_URL must use http or https.");

  const timings = [];
  const statuses = new Map();
  let responseBytes = 0;
  let nextRequest = 0;
  let failures = 0;
  const startedAt = performance.now();

  const worker = async () => {
    while (nextRequest < requests) {
      const requestNumber = nextRequest;
      nextRequest += 1;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const requestStartedAt = performance.now();

      try {
        const response = await fetch(target, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        const body = await response.arrayBuffer();
        responseBytes += body.byteLength;
        statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
        if (!response.ok) failures += 1;
      } catch (error) {
        failures += 1;
        statuses.set("network-error", (statuses.get("network-error") ?? 0) + 1);
        if (requestNumber === 0) console.error(`First request failed: ${error instanceof Error ? error.message : error}`);
      } finally {
        clearTimeout(timeout);
        timings.push(performance.now() - requestStartedAt);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, () => worker()));
  const durationMs = performance.now() - startedAt;
  const sortedTimings = timings.sort((first, second) => first - second);
  const result = {
    url: target.toString(),
    requests,
    concurrency: Math.min(concurrency, requests),
    failures,
    statuses: Object.fromEntries(statuses),
    responseBodyBytes: responseBytes,
    durationMs: Math.round(durationMs),
    requestsPerSecond: Number((requests / (durationMs / 1000)).toFixed(2)),
    latencyMs: {
      minimum: Math.round(sortedTimings[0] ?? 0),
      median: Math.round(percentile(sortedTimings, 0.5)),
      p95: Math.round(percentile(sortedTimings, 0.95)),
      maximum: Math.round(sortedTimings.at(-1) ?? 0),
    },
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLoadTest().then((result) => {
    if (result.failures > 0) process.exitCode = 1;
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
