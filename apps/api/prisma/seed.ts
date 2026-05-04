import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { createAuthInstance } from '../src/config/auth.js';
import { PRESET_CATEGORIES } from '../src/domains/categories/constants/presetCategories.js';

const prisma = new PrismaClient();
const auth = createAuthInstance(prisma);

// ─── Seed constants (shared with e2e tests) ────────────────────────────────

export const SEED = {
  owner: {
    email: 'seed@budget-planner.test',
    password: 'Seed1234!',
    name: 'Seed User',
  },
  member: {
    email: 'member@budget-planner.test',
    password: 'Seed1234!',
    name: 'Seed Member',
  },
  budget: {
    name: 'Seed Budget',
    currency: 'EUR',
  },
  inviteToken: 'seed-invite-editor',
};

async function main() {
  // Create owner via Better Auth (handles password hashing)
  const ownerResult = await auth.api.signUpEmail({
    body: {
      email: SEED.owner.email,
      password: SEED.owner.password,
      name: SEED.owner.name,
    },
  });
  const ownerId = ownerResult.user.id;

  // Create member user
  const memberResult = await auth.api.signUpEmail({
    body: {
      email: SEED.member.email,
      password: SEED.member.password,
      name: SEED.member.name,
    },
  });
  const memberId = memberResult.user.id;

  // Create budget with members and preset categories
  const budget = await prisma.budget.create({
    data: {
      name: SEED.budget.name,
      currency: SEED.budget.currency,
      ownerId,
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-12-31'),
      initial_saving: 0,
      members: {
        create: [
          { userId: ownerId, role: 'OWNER' },
          { userId: memberId, role: 'VIEWER' },
        ],
      },
      categories: {
        createMany: {
          data: PRESET_CATEGORIES.map((c) => ({
            type: c.type,
            name: c.name,
            icon: c.icon,
            is_preset: true,
          })),
        },
      },
    },
  });

  // Create a known invite token for e2e tests
  await prisma.budgetInvite.create({
    data: {
      budgetId: budget.id,
      token: SEED.inviteToken,
      role: 'EDITOR',
      createdBy: ownerId,
    },
  });

  console.log(`Seed complete — budgetId: ${budget.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
