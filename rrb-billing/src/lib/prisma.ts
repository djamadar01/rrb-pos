import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client/wasm';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  try {
    const cf = getCloudflareContext();
    const d1 = (cf?.env as any)?.DB;

    if (d1) {
      const adapter = new PrismaD1(d1);
      return new PrismaClient({ adapter, log: ['error', 'warn'] });
    }
  } catch (err) {
    // getCloudflareContext not available in static/build context
  }

  return new PrismaClient({ log: ['error', 'warn'] });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
