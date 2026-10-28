// Anonymous, device-scoped identity via the httpOnly "mise_device" cookie. No
// login in v1.
//
// Only routes that write device-owned data create a Device (getDeviceId); reads
// use readDeviceId, which never touches the DB, so a visitor (or crawler) that
// never saves anything never costs a row. The cookie must be a UUID — anything
// else is treated as absent rather than stored.
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "mise_device";
const ONE_YEAR = 60 * 60 * 24 * 365;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDeviceId(v: string | undefined): v is string {
  return !!v && UUID.test(v);
}

// The caller's device id from the cookie, or null. No DB access.
export async function readDeviceId(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  return isDeviceId(v) ? v : null;
}

// The caller's device id, creating the Device row (and cookie) if needed.
// For write routes only.
export async function getDeviceId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (isDeviceId(existing)) {
    // Make sure the row exists (e.g. after a db reset); upsert is cheap.
    await prisma.device.upsert({
      where: { id: existing },
      update: {},
      create: { id: existing },
    });
    return existing;
  }
  const device = await prisma.device.create({ data: {} });
  jar.set(COOKIE, device.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return device.id;
}
