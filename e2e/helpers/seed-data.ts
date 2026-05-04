// Mirrors apps/api/prisma/seed.ts — keep in sync
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
