import { createAuthClient } from "@neondatabase/auth";

const neonAuthUrl =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  "https://ep-cool-queen-b3z1xpzh.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth";

export const neonAuthClient = createAuthClient(neonAuthUrl);
