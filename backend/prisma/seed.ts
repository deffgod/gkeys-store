import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use direct connection for seed script (bypass Prisma Accelerate)
// This is necessary because seed operations need direct database access
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL not found in environment variables');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'action' },
      update: {},
      create: {
        name: 'Action',
        slug: 'action',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'adventure' },
      update: {},
      create: {
        name: 'Adventure',
        slug: 'adventure',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'rpg' },
      update: {},
      create: {
        name: 'RPG',
        slug: 'rpg',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'strategy' },
      update: {},
      create: {
        name: 'Strategy',
        slug: 'strategy',
      },
    }),
  ]);

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { slug: 'action' },
      update: {},
      create: {
        name: 'Action',
        slug: 'action',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'adventure' },
      update: {},
      create: {
        name: 'Adventure',
        slug: 'adventure',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'rpg' },
      update: {},
      create: {
        name: 'RPG',
        slug: 'rpg',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'horror' },
      update: {},
      create: {
        name: 'Horror',
        slug: 'horror',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'open-world' },
      update: {},
      create: {
        name: 'Open World',
        slug: 'open-world',
      },
    }),
  ]);

  // Create platforms
  const platforms = await Promise.all([
    prisma.platform.upsert({
      where: { slug: 'steam' },
      update: {},
      create: {
        name: 'Steam',
        slug: 'steam',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'epic' },
      update: {},
      create: {
        name: 'Epic Games',
        slug: 'epic',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'origin' },
      update: {},
      create: {
        name: 'Origin',
        slug: 'origin',
      },
    }),
  ]);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'single-player' },
      update: {},
      create: {
        name: 'Single Player',
        slug: 'single-player',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'multiplayer' },
      update: {},
      create: {
        name: 'Multiplayer',
        slug: 'multiplayer',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'co-op' },
      update: {},
      create: {
        name: 'Co-op',
        slug: 'co-op',
      },
    }),
  ]);

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gkeys.store' },
    update: {},
    create: {
      email: 'admin@gkeys.store',
      passwordHash: adminPassword,
      nickname: 'Admin',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Create test user
  const userPassword = await hashPassword('password123');
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: userPassword,
      nickname: 'Newbie Guy',
      firstName: 'Test',
      lastName: 'User',
      balance: 100.0,
    },
  });

  // Create test games
  const testGames = [
    {
      title: 'Metro Exodus',
      slug: 'metro-exodus',
      description: 'Embark on an incredible journey - board the Aurora, a heavily modified steam locomotive, and join a handful of survivors as they search for a new life in the East.',
      shortDescription: 'Embark on an incredible journey across post-apocalyptic Russia.',
      price: 13.99,
      originalPrice: 49.99,
      discount: 72,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop'],
      releaseDate: new Date('2019-02-15'),
      inStock: true,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Deep Silver',
      activationService: 'Steam',
      region: 'Global',
    },
    {
      title: 'Fallout: New Vegas',
      slug: 'fallout-new-vegas',
      description: 'Welcome to Vegas. New Vegas. It\'s the kind of town where you dig your own grave prior to being shot in the head and left for dead... and that\'s before things really get ugly.',
      shortDescription: 'Welcome to Vegas. New Vegas. It\'s the kind of town where you dig your own grave.',
      price: 9.99,
      originalPrice: 19.99,
      discount: 50,
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=600&fit=crop'],
      releaseDate: new Date('2010-10-19'),
      inStock: true,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Bethesda Softworks',
      activationService: 'Steam',
      region: 'Global',
    },
    {
      title: 'Mad Max',
      slug: 'mad-max',
      description: 'Become Mad Max, the lone warrior in a savage open world. In this action-packed, open world, third person action game, you must fight to stay alive in The Wasteland.',
      shortDescription: 'Become Mad Max, the lone warrior in a savage open world.',
      price: 4.99,
      originalPrice: 29.99,
      discount: 83,
      image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=800&h=600&fit=crop'],
      releaseDate: new Date('2015-09-01'),
      inStock: true,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Warner Bros. Interactive Entertainment',
      activationService: 'Steam',
      region: 'Global',
    },
    {
      title: 'Days Gone',
      slug: 'days-gone',
      description: 'Ride and fight into a deadly, post pandemic America. Play as Deacon St. John, a drifter and bounty hunter who rides the broken road, fighting to survive while searching for a reason to live.',
      shortDescription: 'Ride and fight into a deadly, post pandemic America.',
      price: 19.99,
      originalPrice: 49.99,
      discount: 60,
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'],
      releaseDate: new Date('2021-05-18'),
      inStock: true,
      isBestSeller: false,
      isNew: true,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Sony Interactive Entertainment',
      activationService: 'Steam',
      region: 'Global',
    },
    {
      title: 'Bioshock Collection',
      slug: 'bioshock-collection',
      description: 'Experience the award-winning Bioshock franchise with this collection of all three games. Remastered for modern platforms with enhanced graphics and performance.',
      shortDescription: 'Experience the award-winning Bioshock franchise with this collection.',
      price: 14.99,
      originalPrice: 59.99,
      discount: 75,
      image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f897a?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1493711662062-fa541f7f897a?w=800&h=600&fit=crop'],
      releaseDate: new Date('2016-09-13'),
      inStock: true,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: '2K Games',
      activationService: 'Steam',
      region: 'Global',
    },
    {
      title: 'Detroit: Become Human',
      slug: 'detroit-become-human',
      description: 'The story of three androids: Kara, who escapes her owner to explore her newfound sentience; Connor, whose job it is to hunt down deviant androids; and Markus, who devotes himself to releasing other androids from servitude.',
      shortDescription: 'The story of three androids and their quest for freedom.',
      price: 19.99,
      originalPrice: 39.99,
      discount: 50,
      image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&h=600&fit=crop'],
      releaseDate: new Date('2018-05-25'),
      inStock: true,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Quantic Dream',
      activationService: 'Epic Games',
      region: 'Global',
    },
    {
      title: 'ARC Raiders',
      slug: 'arc-raiders',
      description: 'Set in a world invaded by mechanized invaders, lead a squad of raiders in co-op PvE gameplay. Fight against the ARC threat in this free-to-play extraction shooter.',
      shortDescription: 'Set in a world invaded by mechanized invaders, lead a squad of raiders in co-op PvE gameplay.',
      price: 0,
      originalPrice: null,
      discount: null,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop'],
      releaseDate: new Date('2024-12-01'),
      inStock: true,
      isBestSeller: false,
      isNew: true,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Embark Studios',
      activationService: 'Steam',
      region: 'Global',
    },
    {
      title: 'The Witcher 3: Wild Hunt',
      slug: 'the-witcher-3-wild-hunt',
      description: 'As war rages on throughout the Northern Realms, you take on the greatest contract of your life — tracking down the Child of Prophecy, a living weapon that can alter the shape of the world.',
      shortDescription: 'As war rages on, you take on the greatest contract of your life.',
      price: 9.99,
      originalPrice: 39.99,
      discount: 75,
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'],
      releaseDate: new Date('2015-05-19'),
      inStock: true,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'CD Projekt',
      activationService: 'Steam',
      region: 'Global',
    },
  ];

  for (const gameData of testGames) {
    const categorySlug = gameData.title.includes('Action') || gameData.title.includes('Mad Max') || gameData.title.includes('ARC')
      ? 'action'
      : 'adventure';
    
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: {},
      create: {
        title: gameData.title,
        slug: gameData.slug,
        description: gameData.description,
        shortDescription: gameData.shortDescription,
        price: gameData.price,
        originalPrice: gameData.originalPrice,
        discount: gameData.discount,
        currency: 'EUR',
        image: gameData.image,
        images: gameData.images,
        inStock: gameData.inStock,
        releaseDate: gameData.releaseDate,
        isBestSeller: gameData.isBestSeller,
        isNew: gameData.isNew,
        isPreorder: gameData.isPreorder,
        multiplayer: gameData.multiplayer,
        publisher: gameData.publisher,
        activationService: gameData.activationService,
        region: gameData.region,
        categories: {
          create: [{
            category: { connect: { slug: categorySlug } },
          }],
        },
        genres: {
          create: [
            { genre: { connect: { slug: 'action' } } },
            { genre: { connect: { slug: 'adventure' } } },
          ],
        },
        platforms: {
          create: [
            { platform: { connect: { slug: 'steam' } } },
          ],
        },
        tags: {
          create: gameData.multiplayer
            ? [{ tag: { connect: { slug: 'multiplayer' } } }]
            : [{ tag: { connect: { slug: 'single-player' } } }],
        },
      },
    });

    // Create some game keys for each game
    if (gameData.inStock) {
      for (let i = 0; i < 5; i++) {
        const keyValue = `${gameData.slug.toUpperCase()}-${Math.random().toString(36).substring(2, 15).toUpperCase()}-${i + 1}`;
        try {
          await prisma.gameKey.create({
            data: {
              gameId: game.id,
              key: keyValue,
            },
          });
        } catch (e) {
          // Key might already exist, skip
        }
      }
    }
  }

  // Seed FAQ data
  console.log('📋 Seeding FAQ data...');
  const faqData = [
    // General Questions
    { category: 'general', question: 'What is GKEYS?', answer: 'GKEYS is a licensed online store for video game activation keys. We sell official keys for Steam, Epic Games, Origin, Uplay, Battle.net, and other platforms. All our keys are purchased from official distributors and publishers.', order: 0 },
    { category: 'general', question: 'Are the keys legal and official?', answer: 'Yes, all keys sold on GKEYS are 100% legal and official. We work directly with publishers and authorized distributors. Each key is verified before being added to our inventory.', order: 1 },
    { category: 'general', question: 'What platforms do you support?', answer: 'We support all major gaming platforms including Steam, Epic Games Store, Origin (EA App), Uplay (Ubisoft Connect), Battle.net, GOG, Xbox, PlayStation, and Nintendo eShop.', order: 2 },
    { category: 'general', question: 'Do you offer refunds?', answer: 'Due to the digital nature of our products, we cannot offer refunds once a key has been revealed. However, if you experience any issues with key activation, our support team will help resolve the problem.', order: 3 },
    // Buying a Game
    { category: 'buying', question: 'How do I purchase a game?', answer: 'Simply browse our catalog, add games to your cart, and proceed to checkout. You can pay using your account balance or credit/debit card. After payment, your keys will be delivered instantly to your account.', order: 0 },
    { category: 'buying', question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, Apple Pay, Google Pay, and account balance top-ups via various payment methods. You can also use promo codes for additional discounts.', order: 1 },
    { category: 'buying', question: 'How quickly will I receive my key?', answer: 'Keys are delivered instantly after successful payment. You can find your keys in your Profile under "My Orders". We also send an email confirmation with your activation keys.', order: 2 },
    { category: 'buying', question: 'Can I gift a game to someone?', answer: 'Yes! During checkout, you can select the "Send as Gift" option. Enter the recipient\'s email address, and they will receive the key directly.', order: 3 },
    // Pre-orders
    { category: 'preorder', question: 'How do pre-orders work?', answer: 'When you pre-order a game, payment is processed immediately. You will receive your activation key on or shortly before the game\'s official release date. We send email notifications when your key is ready.', order: 0 },
    { category: 'preorder', question: 'Can I cancel a pre-order?', answer: 'Pre-orders can be cancelled up to 14 days before the game\'s release date. After this period, cancellations are not possible. Contact our support team to request a cancellation.', order: 1 },
    { category: 'preorder', question: 'Will I receive any bonuses with pre-orders?', answer: 'Many pre-orders include exclusive bonuses, DLC, or early access. Check the game\'s product page for specific pre-order bonuses. All bonuses are delivered with your main game key.', order: 2 },
    // Key Activation
    { category: 'activation', question: 'How do I activate my key on Steam?', answer: 'Open Steam → Click "Games" in the top menu → Select "Activate a Product on Steam" → Enter your key → Follow the prompts to complete activation. The game will then appear in your library.', order: 0 },
    { category: 'activation', question: 'My key is not working. What should I do?', answer: 'First, ensure you\'re activating on the correct platform and region. If issues persist, contact our support with your order number. We\'ll verify the key and provide a replacement if necessary.', order: 1 },
    { category: 'activation', question: 'Are keys region-locked?', answer: 'Some keys have regional restrictions. Each product page clearly indicates any region locks. Make sure to check the "Region" information before purchasing. Global keys work worldwide.', order: 2 },
    { category: 'activation', question: 'Can I use a key multiple times?', answer: 'No, each key can only be activated once on a single account. Once activated, the key is permanently linked to that account and cannot be transferred or reused.', order: 3 },
    // Account & Balance
    { category: 'account', question: 'How do I top up my balance?', answer: 'Go to your Profile → Balance page → Enter the amount → Choose a payment method → Complete the payment. Your balance will be updated instantly and can be used for future purchases.', order: 0 },
    { category: 'account', question: 'Is there a minimum top-up amount?', answer: 'The minimum top-up amount is $5. There is no maximum limit. Your balance never expires and can be used for any purchase on GKEYS.', order: 1 },
    { category: 'account', question: 'Can I withdraw my balance?', answer: 'Account balance cannot be withdrawn as cash. However, you can use it for any purchase on GKEYS, including pre-orders and gift purchases.', order: 2 },
    { category: 'account', question: 'How do I change my password?', answer: 'Go to your Profile → Edit Profile → Password section. Enter your current password, then your new password twice. Click "Save Changes" to update your password.', order: 3 },
  ];

  for (const faq of faqData) {
    try {
      await prisma.fAQ.upsert({
        where: {
          id: `${faq.category}-${faq.order}`,
        },
        update: {
          question: faq.question,
          answer: faq.answer,
          order: faq.order,
          active: true,
        },
        create: {
          id: `${faq.category}-${faq.order}`,
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          order: faq.order,
          active: true,
        },
      });
    } catch (e) {
      // FAQ might already exist, skip
      console.log(`Skipping FAQ ${faq.category}-${faq.order}: ${e.message}`);
    }
  }

  console.log('✅ Seed completed');
  console.log(`   Admin: ${admin.email} / admin123`);
  console.log(`   User: ${user.email} / password123`);
  console.log(`   Created ${testGames.length} test games`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

