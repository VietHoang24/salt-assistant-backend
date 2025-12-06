import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ------------------------------------
  // USERS (test account)
  // ------------------------------------
  const user = await prisma.users.upsert({
    where: { email: 'test@salt.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'test@salt.com',
      full_name: 'Salt User',
      google_id: 'google_test_123',
      avatar_url: 'https://picsum.photos/200',
      timezone: 'Asia/Ho_Chi_Minh',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log('✔ Created test user');

  // ------------------------------------
  // USER CONFIG (default for this user)
  // ------------------------------------
  await prisma.user_configs.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      user_id: user.id,
      morning_time: new Date('2025-01-01T07:00:00Z'),
      evening_time: new Date('2025-01-01T21:00:00Z'),
      funfact_time: new Date('2025-01-01T12:30:00Z'),
      summary_style: 'default',
      enable_notif: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log('✔ Config created');

  // ------------------------------------
  // CATEGORIES (default interest topics)
  // ------------------------------------
  // ------------------------------------
  // CATEGORIES (default interest topics)
  // ------------------------------------

  // 1. Xoá user_categories trước vì nó FK tới categories
  await prisma.user_categories.deleteMany();

  // 2. Sau đó mới được xoá categories
  await prisma.categories.deleteMany(); // reset trước

  // 3. Seed lại categories
  await prisma.categories.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        name: 'All',
        slug: 'all',
        is_default: true,
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'News',
        slug: 'news',
        is_default: false,
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Market',
        slug: 'market',
        is_default: false,
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'AI Daily Summary',
        slug: 'ai-daily-summary',
        is_default: false,
        created_at: new Date(),
      },
    ],
  });

  console.log('✔ Categories seeded');

  const allCategories = await prisma.categories.findMany();

  // Link user với default categories
  for (const c of allCategories) {
    await prisma.user_categories.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        category_id: c.id,
        created_at: new Date(),
      },
    });
  }

  console.log('✔ User categories linked');

  // ------------------------------------
  // MARKET DATA (để test dashboard)
  // ------------------------------------
  await prisma.market_data.create({
    data: {
      id: crypto.randomUUID(),
      gold_price: 82000000,
      btc_price: 950000000,
      eth_price: 55000000,
      usd_vnd_rate: 24800,
      created_at: new Date(),
    },
  });

  console.log('✔ Market data inserted');

  // ------------------------------------
  // NEWS (random sample)
  // ------------------------------------
  const newsCategory = allCategories.find((c) => c.slug === 'news');

  await prisma.news.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        source: 'Bloomberg',
        title: 'Global Market Sees Strong Recovery',
        content:
          'Major indices surged as positive economic data boosted investor confidence.',
        url: 'https://example.com/news1',
        category_id: newsCategory?.id ?? null,
        published_at: new Date(),
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        source: 'Reuters',
        title: 'Vietnam Tech Hiring Rises',
        content: 'Demand for AI and full-stack developers continues to climb.',
        url: 'https://example.com/news2',
        category_id: newsCategory?.id ?? null,
        published_at: new Date(),
        created_at: new Date(),
      },
    ],
  });

  console.log('✔ News inserted');

  // ------------------------------------
  // GOALS
  // ------------------------------------
  const goalId = crypto.randomUUID();

  await prisma.user_goals.create({
    data: {
      id: goalId,
      user_id: user.id,
      type: 'weekly',
      title: 'Read 3 chapters of a book',
      description: 'Improve knowledge and consistency',
      created_at: new Date(),
      updated_at: new Date(),
      start_date: new Date(),
      end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // one week later
    },
  });

  console.log('✔ Goal created');

  // Goal logs
  await prisma.user_goal_logs.create({
    data: {
      id: crypto.randomUUID(),
      user_id: user.id,
      goal_id: goalId,
      progress: 10,
      log_message: 'Started reading.',
      created_at: new Date(),
    },
  });

  console.log('✔ Goal logs created');

  console.log('🌱 SEEDING COMPLETED!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
