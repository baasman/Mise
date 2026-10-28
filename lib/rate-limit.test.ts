import { describe, expect, it } from "vitest";
import { HOUR, clientIp, estimateDailyCap, windowKey } from "./rate-limit";

const limit = { scope: "t", max: 3, windowMs: HOUR };

describe("windowKey", () => {
  it("is stable within a window and changes at the boundary", () => {
    const t0 = 5 * HOUR;
    expect(windowKey(limit, "ip", t0).key).toBe(windowKey(limit, "ip", t0 + HOUR - 1).key);
    expect(windowKey(limit, "ip", t0).key).not.toBe(windowKey(limit, "ip", t0 + HOUR).key);
  });

  it("expires at the end of its window", () => {
    expect(windowKey(limit, "ip", 5 * HOUR + 10).expiresAt.getTime()).toBe(6 * HOUR);
  });

  it("separates subjects", () => {
    expect(windowKey(limit, "a", 0).key).not.toBe(windowKey(limit, "b", 0).key);
  });
});

describe("clientIp", () => {
  const req = (h: Record<string, string>) => new Request("http://x", { headers: h });
  it("prefers x-real-ip, then the first x-forwarded-for hop", () => {
    expect(clientIp(req({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(req({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(req({}))).toBe("unknown");
  });
});

describe("estimateDailyCap", () => {
  it("reads ESTIMATE_DAILY_CAP, defaulting to 500", () => {
    const prev = process.env.ESTIMATE_DAILY_CAP;
    delete process.env.ESTIMATE_DAILY_CAP;
    expect(estimateDailyCap().max).toBe(500);
    process.env.ESTIMATE_DAILY_CAP = "40";
    expect(estimateDailyCap().max).toBe(40);
    process.env.ESTIMATE_DAILY_CAP = "nonsense";
    expect(estimateDailyCap().max).toBe(500);
    if (prev === undefined) delete process.env.ESTIMATE_DAILY_CAP;
    else process.env.ESTIMATE_DAILY_CAP = prev;
  });
});
