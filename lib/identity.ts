// Anonymous, device-scoped identity. Reads the httpOnly "mise_device" cookie;
// creates a Device row + sets the cookie when absent. No login in v1.
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "mise_device";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getDeviceId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) {
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
