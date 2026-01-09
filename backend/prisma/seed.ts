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

  // Create categories (used implicitly via connect in game creation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Create genres (used implicitly via connect in game creation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Create platforms (used implicitly via connect in game creation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    prisma.platform.upsert({
      where: { slug: 'xbox-live' },
      update: {},
      create: {
        name: 'Xbox Live',
        slug: 'xbox-live',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'battlenet' },
      update: {},
      create: {
        name: 'Battle.net',
        slug: 'battlenet',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'ubisoft-connect' },
      update: {},
      create: {
        name: 'Ubisoft Connect',
        slug: 'ubisoft-connect',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'rockstar' },
      update: {},
      create: {
        name: 'Rockstar',
        slug: 'rockstar',
      },
    }),
  ]);

  // Create tags (used implicitly via connect in game creation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      image: 'https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Metro%20Exodus%20-%20Gold%20Edition.jpg?fit=crop',
      images: ['https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Metro%20Exodus%20-%20Gold%20Edition.jpg?fit=crop'],
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
      image: 'https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Fallout_%20New%20Vegas.jpg',
      images: ['https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Fallout_%20New%20Vegas.jpg'],
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
      image: 'https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Mad%20Max.jpg',
      images: ['https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Mad%20Max.jpg'],
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
      image: 'https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Days%20Gone.jpg',
      images: ['https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Days%20Gone.jpg'],
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
      image: 'https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Detroit_%20Become%20Human.jpg?fit=crop',
      images: ['https://nrmyfkltstwagsor.public.blob.vercel-storage.com/Images/Detroit_%20Become%20Human.jpg?fit=crop'],
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

  // G2A API Products
  const g2aProducts = [
    {
      title: 'Random PREMIUM 1 Key Steam Key GLOBAL',
      slug: 'random-premium-1-key-steam-key-global',
      description: 'Random PREMIUM 1 Key Steam Key GLOBAL - A random bundle containing premium Steam game keys.',
      shortDescription: 'Random PREMIUM 1 Key Steam Key GLOBAL',
      price: 1.59,
      originalPrice: 9.25,
      discount: 83,
      image: 'https://images.g2a.com/images/230x336/0x1x1/e7af1a6dff0b/5bae8d3d5bafe3f5cc69e212',
      images: ['https://images.g2a.com/images/0x0/1x1x1/bfd8c8e879b1/5bae8d3d5bafe3f5cc69e212'],
      releaseDate: null,
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Various',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Random PREMIUM 1 Key Steam Key GLOBAL (V2)',
      slug: 'random-premium-1-key-steam-key-global-v2',
      description: 'Random PREMIUM 1 Key Steam Key GLOBAL - A random bundle containing premium Steam game keys.',
      shortDescription: 'Random PREMIUM 1 Key Steam Key GLOBAL',
      price: 1.99,
      originalPrice: 9.25,
      discount: 78,
      image: 'https://images.g2a.com/images/230x336/0x1x1/6cca0f1a78dd/5bae8ec8ae653af7c43693ec',
      images: ['https://images.g2a.com/images/0x0/1x1x1/7a8405c45737/5bae8ec8ae653af7c43693ec'],
      releaseDate: null,
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Various',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Killing Floor 2 Steam Key GLOBAL',
      slug: 'killing-floor-2-steam-key-global',
      description: 'Killing Floor 2 is a co-op survival horror game that pits players against waves of mutated specimens called Zeds.',
      shortDescription: 'Co-op survival horror game with waves of mutated specimens.',
      price: 5.5,
      originalPrice: 9.25,
      discount: 41,
      image: 'https://images.g2a.com/images/230x336/0x1x1/2424cf695f5d/59124143ae653a685e3aec62',
      images: ['https://images.g2a.com/images/0x0/1x1x1/a7b89088bd08/59124143ae653a685e3aec62'],
      releaseDate: new Date('2016-11-18'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Tripwire Interactive',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Xbox Live GOLD Subscription Card 1 Month GLOBAL',
      slug: 'xbox-live-gold-subscription-card-1-month-global',
      description: 'Xbox Live Gold 1 Month subscription card for Xbox Live service.',
      shortDescription: 'Xbox Live Gold 1 Month subscription card.',
      price: 6.48,
      originalPrice: 9.25,
      discount: 30,
      image: 'https://images.g2a.com/images/230x336/0x1x1/f57ba75db180/5ae232565bafe33bd919a61a',
      images: ['https://images.g2a.com/images/0x0/1x1x1/ae77988ccfab/5ae232565bafe33bd919a61a'],
      releaseDate: null,
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Microsoft',
      activationService: 'Xbox Live',
      region: 'GLOBAL',
    },
    {
      title: 'Xbox Live GOLD Subscription Card 3 Months GLOBAL',
      slug: 'xbox-live-gold-subscription-card-3-months-global',
      description: 'Xbox Live Gold 3 Months subscription card for Xbox Live service.',
      shortDescription: 'Xbox Live Gold 3 Months subscription card.',
      price: 2.5,
      originalPrice: 9.25,
      discount: 73,
      image: 'https://images.g2a.com/images/230x336/0x1x1/abf71e13e2cd/5ae2324bae653ad0a4532f78',
      images: ['https://images.g2a.com/images/0x0/1x1x1/a468b9f2bf7c/5ae2324bae653ad0a4532f78'],
      releaseDate: null,
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Microsoft',
      activationService: 'Xbox Live',
      region: 'GLOBAL',
    },
    {
      title: 'Borderlands 2 GOTY Steam Key GLOBAL',
      slug: 'borderlands-2-goty-steam-key-global',
      description: 'Borderlands 2 Game of the Year Edition includes the base game and all DLC content.',
      shortDescription: 'Borderlands 2 Game of the Year Edition with all DLC.',
      price: 7.99,
      originalPrice: 9.25,
      discount: 14,
      image: 'https://images.g2a.com/images/230x336/0x1x1/93069a20070a/590de6645bafe33a140fa943',
      images: ['https://images.g2a.com/images/0x0/1x1x1/26fa59cdfae6/590de6645bafe33a140fa943'],
      releaseDate: new Date('2012-09-20'),
      inStock: false,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: '2K Games',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Pillars of Eternity - Hero Edition Steam Key GLOBAL',
      slug: 'pillars-of-eternity-hero-edition-steam-key-global',
      description: 'Pillars of Eternity Hero Edition is an isometric RPG inspired by classic games like Baldur\'s Gate.',
      shortDescription: 'Isometric RPG inspired by classic games like Baldur\'s Gate.',
      price: 4.43,
      originalPrice: 9.25,
      discount: 52,
      image: 'https://images.g2a.com/images/230x336/0x1x1/e55dc4192458/59122f9c5bafe35b590e2faa',
      images: ['https://images.g2a.com/images/0x0/1x1x1/17226403296f/59122f9c5bafe35b590e2faa'],
      releaseDate: new Date('2015-03-26'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Paradox Interactive',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Call of Duty: Black Ops II Steam Key GLOBAL',
      slug: 'call-of-duty-black-ops-ii-steam-key-global',
      description: 'Call of Duty: Black Ops II is a first-person shooter with both single-player and multiplayer modes.',
      shortDescription: 'First-person shooter with single-player and multiplayer modes.',
      price: 11,
      originalPrice: null,
      discount: 0,
      image: 'https://images.g2a.com/images/230x336/0x1x1/bc6994fc5842/59886485ae653acb850d4532',
      images: ['https://images.g2a.com/images/0x0/1x1x1/c3563ce1c430/59886485ae653acb850d4532'],
      releaseDate: new Date('2012-11-12'),
      inStock: false,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Activision',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Assassin\'s Creed: Liberation HD Uplay Key GLOBAL',
      slug: 'assassins-creed-liberation-hd-uplay-key-global',
      description: 'Assassin\'s Creed: Liberation HD is an action-adventure game set in New Orleans during the 18th century.',
      shortDescription: 'Action-adventure game set in New Orleans during the 18th century.',
      price: 1.99,
      originalPrice: 9.25,
      discount: 78,
      image: 'https://images.g2a.com/images/230x336/0x1x1/9e0ffc670439/5a8bda8dae653a92b20755c5',
      images: ['https://images.g2a.com/images/0x0/1x1x1/41c53311c13d/5a8bda8dae653a92b20755c5'],
      releaseDate: new Date('2014-01-15'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Ubisoft',
      activationService: 'Ubisoft Connect',
      region: 'GLOBAL',
    },
    {
      title: 'Call of Duty: Modern Warfare 3 Steam Key GLOBAL',
      slug: 'call-of-duty-modern-warfare-3-steam-key-global',
      description: 'Call of Duty: Modern Warfare 3 is a first-person shooter with an intense single-player campaign and multiplayer modes.',
      shortDescription: 'First-person shooter with intense campaign and multiplayer.',
      price: 8.47,
      originalPrice: 9.25,
      discount: 8,
      image: 'https://images.g2a.com/images/230x336/0x1x1/98d1f9192ee8/59123be15bafe375680e47b5',
      images: ['https://images.g2a.com/images/0x0/1x1x1/767d0bf757c2/59123be15bafe375680e47b5'],
      releaseDate: new Date('2011-11-07'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Activision',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Grand Theft Auto V Rockstar Key GLOBAL',
      slug: 'grand-theft-auto-v-rockstar-key-global',
      description: 'Grand Theft Auto V is an open-world action-adventure game set in the fictional city of Los Santos.',
      shortDescription: 'Open-world action-adventure game set in Los Santos.',
      price: 19,
      originalPrice: null,
      discount: 0,
      image: 'https://images.g2a.com/images/230x336/0x1x1/5d526a47248b/59e5efeb5bafe304c4426c47',
      images: ['https://images.g2a.com/images/0x0/1x1x1/bbe9cee9b959/59e5efeb5bafe304c4426c47'],
      releaseDate: new Date('2015-04-14'),
      inStock: false,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Rockstar Games',
      activationService: 'Rockstar',
      region: 'GLOBAL',
    },
    {
      title: 'Diablo 3 Battlechest Battle.net PC Key GLOBAL',
      slug: 'diablo-3-battlechest-battlenet-pc-key-global',
      description: 'Diablo 3 Battlechest includes the base game and Reaper of Souls expansion.',
      shortDescription: 'Diablo 3 Battlechest with base game and Reaper of Souls expansion.',
      price: 19.89,
      originalPrice: null,
      discount: 0,
      image: 'https://images.g2a.com/images/230x336/0x1x1/980940adef3a/5910f83dae653a855d5ab8ad',
      images: ['https://images.g2a.com/images/0x0/1x1x1/2ff1645ca0cf/5910f83dae653a855d5ab8ad'],
      releaseDate: new Date('2012-05-15'),
      inStock: false,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Blizzard Entertainment',
      activationService: 'Battle.net',
      region: 'GLOBAL',
    },
    {
      title: 'Fallout 4 Steam Key GLOBAL',
      slug: 'fallout-4-steam-key-global',
      description: 'Fallout 4 is an open-world RPG set in post-apocalyptic Boston.',
      shortDescription: 'Open-world RPG set in post-apocalyptic Boston.',
      price: 9.89,
      originalPrice: null,
      discount: 0,
      image: 'https://images.g2a.com/images/230x336/0x1x1/d651d5b0f4f8/5a718f545bafe318943d3514',
      images: ['https://images.g2a.com/images/0x0/1x1x1/c8fa89887c26/5a718f545bafe318943d3514'],
      releaseDate: new Date('2015-11-09'),
      inStock: false,
      isBestSeller: true,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Bethesda Softworks',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Destiny 2 Battle.net Key PC EUROPE',
      slug: 'destiny-2-battlenet-key-pc-europe',
      description: 'Destiny 2 is an online multiplayer first-person shooter with RPG elements.',
      shortDescription: 'Online multiplayer first-person shooter with RPG elements.',
      price: 19.99,
      originalPrice: null,
      discount: 0,
      image: 'https://images.g2a.com/images/230x336/0x1x1/d3201c430d41/5af448a95bafe3234418c7b4',
      images: ['https://images.g2a.com/images/0x0/1x1x1/8f0e168c54bf/5af448a95bafe3234418c7b4'],
      releaseDate: new Date('2017-10-24'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Bungie',
      activationService: 'Battle.net',
      region: 'EUROPE',
    },
    {
      title: 'Destiny 2 Battle.net Key PC NORTH AMERICA',
      slug: 'destiny-2-battlenet-key-pc-north-america',
      description: 'Destiny 2 is an online multiplayer first-person shooter with RPG elements.',
      shortDescription: 'Online multiplayer first-person shooter with RPG elements.',
      price: 17.9,
      originalPrice: null,
      discount: 0,
      image: 'https://images.g2a.com/images/230x336/0x1x1/d3201c430d41/5af448a95bafe3234418c7b4',
      images: ['https://images.g2a.com/images/0x0/1x1x1/8f0e168c54bf/5af448a95bafe3234418c7b4'],
      releaseDate: new Date('2017-10-24'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Bungie',
      activationService: 'Battle.net',
      region: 'NORTH AMERICA',
    },
    {
      title: 'Random 10 Keys Steam Key GLOBAL',
      slug: 'random-10-keys-steam-key-global',
      description: 'Random 10 Keys Steam Key GLOBAL - A random bundle containing 10 Steam game keys.',
      shortDescription: 'Random bundle containing 10 Steam game keys.',
      price: 2.99,
      originalPrice: 9.25,
      discount: 68,
      image: 'https://images.g2a.com/images/230x336/0x1x1/ca4ffb16f14a/5bae92295bafe3e077535765',
      images: ['https://images.g2a.com/images/0x0/1x1x1/adc371fd911f/5bae92295bafe3e077535765'],
      releaseDate: null,
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Various',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Random 5 Keys Steam Key GLOBAL',
      slug: 'random-5-keys-steam-key-global',
      description: 'Random 5 Keys Steam Key GLOBAL - A random bundle containing 5 Steam game keys.',
      shortDescription: 'Random bundle containing 5 Steam game keys.',
      price: 1.48,
      originalPrice: 9.25,
      discount: 84,
      image: 'https://images.g2a.com/images/230x336/0x1x1/a77b15f66d9e/5bae92065bafe3d2bb113908',
      images: ['https://images.g2a.com/images/0x0/1x1x1/c0198e72e77a/5bae92065bafe3d2bb113908'],
      releaseDate: null,
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Various',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Assassin\'s Creed: Revelations Uplay Key GLOBAL',
      slug: 'assassins-creed-revelations-uplay-key-global',
      description: 'Assassin\'s Creed: Revelations is an action-adventure game following Ezio Auditore in Constantinople.',
      shortDescription: 'Action-adventure game following Ezio Auditore in Constantinople.',
      price: 3.25,
      originalPrice: 9.25,
      discount: 65,
      image: 'https://images.g2a.com/images/230x336/0x1x1/ff8799b9b6e8/590db06e5bafe38c581a220f',
      images: ['https://images.g2a.com/images/0x0/1x1x1/3e5787a8ea7a/590db06e5bafe38c581a220f'],
      releaseDate: new Date('2011-11-30'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: false,
      publisher: 'Ubisoft',
      activationService: 'Ubisoft Connect',
      region: 'GLOBAL',
    },
    {
      title: 'Insurgency Steam Key GLOBAL',
      slug: 'insurgency-steam-key-global',
      description: 'Insurgency is a tactical first-person shooter focused on realistic combat and teamwork.',
      shortDescription: 'Tactical first-person shooter focused on realistic combat.',
      price: 1.85,
      originalPrice: 9.25,
      discount: 80,
      image: 'https://images.g2a.com/images/230x336/0x1x1/3150865a5e2a/5910bd5aae653a0c9213335a',
      images: ['https://images.g2a.com/images/0x0/1x1x1/95e5485687e1/5910bd5aae653a0c9213335a'],
      releaseDate: new Date('2014-01-22'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'New World Interactive',
      activationService: 'Steam',
      region: 'GLOBAL',
    },
    {
      title: 'Counter-Strike Complete Steam Key RU/CIS',
      slug: 'counter-strike-complete-steam-key-ru-cis',
      description: 'Counter-Strike Complete includes Counter-Strike, Counter-Strike: Condition Zero, and Counter-Strike: Source.',
      shortDescription: 'Complete Counter-Strike collection with all games.',
      price: 0.99,
      originalPrice: 9.25,
      discount: 89,
      image: 'https://images.g2a.com/images/230x336/0x1x1/f3fac24d76df/590e6fbb5bafe34d9c0dd5a3',
      images: ['https://images.g2a.com/images/0x0/1x1x1/9c0bc4bf52e3/590e6fbb5bafe34d9c0dd5a3'],
      releaseDate: new Date('2013-06-06'),
      inStock: false,
      isBestSeller: false,
      isNew: false,
      isPreorder: false,
      multiplayer: true,
      publisher: 'Valve',
      activationService: 'Steam',
      region: 'RU/CIS',
    },
  ];

  // Combine test games and G2A products
  const allGames = [...testGames, ...g2aProducts];

  // Map activation service to platform slug
  const getPlatformSlug = (activationService: string): string => {
    const mapping: Record<string, string> = {
      'Steam': 'steam',
      'Epic Games': 'epic',
      'Origin': 'origin',
      'Xbox Live': 'xbox-live',
      'Battle.net': 'battlenet',
      'Ubisoft Connect': 'ubisoft-connect',
      'Rockstar': 'rockstar',
    };
    return mapping[activationService] || 'steam';
  };

  for (const gameData of allGames) {
    const categorySlug = gameData.title.includes('Action') || gameData.title.includes('Mad Max') || gameData.title.includes('ARC')
      ? 'action'
      : 'adventure';
    
    const platformSlug = getPlatformSlug(gameData.activationService);
    
    // Determine genres based on game content
    const genreSlugs = ['action', 'adventure'];
    
    // Check if game is open world based on title, description, or shortDescription
    const isOpenWorld = 
      gameData.title.toLowerCase().includes('gta') ||
      gameData.title.toLowerCase().includes('grand theft auto') ||
      gameData.title.toLowerCase().includes('fallout') ||
      gameData.title.toLowerCase().includes('mad max') ||
      gameData.title.toLowerCase().includes('elder scrolls') ||
      gameData.title.toLowerCase().includes('skyrim') ||
      gameData.title.toLowerCase().includes('witcher') ||
      gameData.title.toLowerCase().includes('assassin\'s creed') ||
      gameData.title.toLowerCase().includes('red dead') ||
      (gameData.description && gameData.description.toLowerCase().includes('open world')) ||
      (gameData.shortDescription && gameData.shortDescription.toLowerCase().includes('open world'));
    
    if (isOpenWorld) {
      genreSlugs.push('open-world');
    }
    
    const createData = {
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
      releaseDate: gameData.releaseDate || new Date('2000-01-01'),
      isBestSeller: gameData.isBestSeller,
      isNew: gameData.isNew,
      isPreorder: gameData.isPreorder,
      multiplayer: gameData.multiplayer,
      publisher: gameData.publisher,
      activationService: gameData.activationService,
      region: gameData.region,
    };
    
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: {},
      create: {
        ...createData,
        categories: {
          create: [{
            category: { connect: { slug: categorySlug } },
          }],
        },
        genres: {
          create: genreSlugs.map(slug => ({
            genre: { connect: { slug } },
          })),
        },
        platforms: {
          create: [
            { platform: { connect: { slug: platformSlug } } },
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
        } catch {
          // Key might already exist, skip
        }
      }
    }
  }

  // Seed Blog Articles
  console.log('📝 Seeding blog articles...');
  const blogArticles = [
    {
      slug: 'how-to-activate-steam-keys',
      title: 'How to Activate Steam Keys: A Complete Guide',
      excerpt: 'Learn everything you need to know about activating Steam game keys, from basic steps to troubleshooting common issues.',
      content: `# How to Activate Steam Keys: A Complete Guide

Steam is one of the most popular digital distribution platforms for PC games, and activating game keys on Steam is a straightforward process. Whether you've purchased a key from GKEYS or received one as a gift, this guide will walk you through the activation process.

## Step-by-Step Activation Process

### 1. Open Steam Client
First, make sure you have the Steam client installed and are logged into your account. If you don't have Steam installed, download it from [steam.com](https://store.steampowered.com/about/).

### 2. Access the Activation Menu
- Click on **"Games"** in the top menu bar
- Select **"Activate a Product on Steam..."**
- Alternatively, you can use the shortcut: **Steam → Activate a Product on Steam**

### 3. Enter Your Product Key
- You'll see a product activation wizard
- Read and accept the Steam Subscriber Agreement
- Enter your product key in the provided field
- Click **"Next"** to proceed

### 4. Confirm Activation
- Steam will verify your key
- If valid, the game will be added to your library
- You can start downloading immediately or later

## Common Issues and Solutions

### "Invalid Product Key"
- **Double-check the key**: Make sure you've copied the entire key without spaces
- **Region restrictions**: Some keys are region-locked. Verify the key works in your region
- **Already activated**: Check if the key was already used on another account

### "Product Already Owned"
- The game is already in your library
- You may have purchased it previously or received it as a gift
- Check your Steam library to confirm

### "Region Lock"
- Some keys are restricted to specific regions
- Contact support if you believe you received the wrong region key
- Always check the product page for region information before purchasing

## Tips for Successful Activation

1. **Activate immediately**: Don't wait too long after purchase
2. **Keep your key safe**: Store it securely until activation
3. **Check system requirements**: Ensure your PC meets the game's requirements
4. **Verify region compatibility**: Always check region restrictions before buying

## What Happens After Activation?

Once your key is activated:
- The game appears in your Steam library
- You can download and install it anytime
- Updates are automatic through Steam
- You can access Steam features like achievements, trading cards, and community features

## Need Help?

If you encounter any issues during activation, our support team is here to help. Contact us with your order number and we'll assist you promptly.`,
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=600&fit=crop',
      category: 'guides',
      author: 'GKEYS Team',
      published: true,
      publishedAt: new Date('2024-12-15'),
      readTime: 5,
      tags: ['steam', 'activation', 'guide', 'tutorial'],
    },
    {
      slug: 'best-gaming-deals-december-2024',
      title: 'Best Gaming Deals: December 2024 Edition',
      excerpt: 'Discover the hottest game deals this December, featuring massive discounts on AAA titles and indie gems.',
      content: `# Best Gaming Deals: December 2024 Edition

The holiday season brings incredible gaming deals, and December 2024 is no exception. We've curated the best offers available on GKEYS, featuring everything from blockbuster AAA titles to hidden indie gems.

## Top AAA Deals

### The Witcher 3: Wild Hunt - 75% Off
Experience one of the greatest RPGs ever made at an unbeatable price. The Complete Edition includes all DLC and expansions, offering hundreds of hours of gameplay.

**Original Price**: $39.99  
**Sale Price**: $9.99  
**Savings**: $30.00

### Metro Exodus - 72% Off
Embark on an incredible journey across post-apocalyptic Russia in this critically acclaimed first-person shooter. The Gold Edition includes all story DLC.

**Original Price**: $49.99  
**Sale Price**: $13.99  
**Savings**: $36.00

### Bioshock Collection - 75% Off
Get all three Bioshock games remastered for modern platforms. This collection includes Bioshock, Bioshock 2, and Bioshock Infinite with all DLC.

**Original Price**: $59.99  
**Sale Price**: $14.99  
**Savings**: $45.00

## Indie Gems on Sale

### Hollow Knight - 50% Off
Explore a vast, interconnected world in this beautifully hand-drawn action-adventure game. A must-play for Metroidvania fans.

### Celeste - 60% Off
A challenging platformer with a touching story about overcoming personal struggles. Features tight controls and an incredible soundtrack.

## Pre-Order Specials

### Upcoming Releases
- **ARC Raiders** - Free-to-play extraction shooter launching soon
- Reserve your copy now and get exclusive bonuses

## How to Get the Best Deals

1. **Check Daily**: New deals are added regularly
2. **Follow Our Newsletter**: Get notified about flash sales
3. **Use Promo Codes**: Stack additional discounts
4. **Top Up Balance**: Use account balance for faster checkout

## Why Shop at GKEYS?

- ✅ **Instant Delivery**: Get your keys immediately after purchase
- ✅ **100% Official**: All keys are verified and legitimate
- ✅ **Best Prices**: We source directly from publishers
- ✅ **24/7 Support**: Our team is always ready to help

Don't miss out on these incredible deals! Shop now and build your gaming library at unbeatable prices.`,
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=600&fit=crop',
      category: 'deals',
      author: 'GKEYS Team',
      published: true,
      publishedAt: new Date('2024-12-01'),
      readTime: 4,
      tags: ['deals', 'sales', 'discounts', 'gaming'],
    },
    {
      slug: 'understanding-region-locks',
      title: 'Understanding Region Locks: What You Need to Know',
      excerpt: 'Everything about region-locked game keys: what they are, why they exist, and how to avoid issues when purchasing.',
      content: `# Understanding Region Locks: What You Need to Know

Region locks are an important consideration when purchasing digital game keys. Understanding how they work can save you from activation issues and ensure a smooth gaming experience.

## What Are Region Locks?

Region locks are restrictions placed on game keys that limit where they can be activated or used. These restrictions are typically set by publishers to control pricing and distribution in different markets.

## Types of Region Restrictions

### Activation Lock
- The key can only be activated in specific regions
- Once activated, the game can be played anywhere
- Most common type of region restriction

### Play Lock
- The game can only be played in specific regions
- Even after activation, you may be restricted
- Less common but more restrictive

### Content Lock
- Certain content or DLC may be region-specific
- Base game works, but some features are unavailable
- Rare but can affect your experience

## Why Do Region Locks Exist?

### Price Control
Publishers use region locks to maintain different pricing strategies across markets. This allows them to offer lower prices in regions with lower purchasing power.

### Distribution Agreements
Licensing agreements with local distributors may require region restrictions to protect their business interests.

### Content Regulations
Some regions have different content regulations, requiring modified versions of games.

## How to Identify Region-Locked Keys

### On GKEYS Product Pages
- **Region Information**: Clearly displayed on every product page
- **"Global" Label**: Keys marked as "Global" work worldwide
- **Specific Regions**: Listed if the key is region-restricted

### Common Region Indicators
- **EU**: European Union countries
- **US**: United States
- **ASIA**: Asian countries
- **ROW**: Rest of World
- **Global**: No restrictions

## What to Do Before Purchasing

1. **Check the Region**: Always verify the region compatibility
2. **Know Your Location**: Understand which region you're in
3. **Read Product Details**: Review all region information carefully
4. **Contact Support**: Ask if you're unsure about compatibility

## Troubleshooting Region Issues

### "This product is not available in your region"
- The key is locked to a different region
- Contact support for a refund or exchange
- We'll help resolve the issue promptly

### "Activation failed"
- Verify you're using a VPN (if applicable) correctly
- Check that the key matches your account region
- Contact support with your order number

## Best Practices

### Do's
✅ Always check region information before purchasing  
✅ Verify your account region matches the key region  
✅ Contact support if you have questions  
✅ Keep your order confirmation for reference

### Don'ts
❌ Don't assume all keys are global  
❌ Don't use VPNs to bypass restrictions (violates terms)  
❌ Don't purchase keys for regions you're not in  
❌ Don't ignore region warnings

## Global Keys: The Best Option

Global keys work in all regions and are the safest choice. While they may be slightly more expensive, they eliminate any region-related concerns.

## Our Commitment

At GKEYS, we:
- Clearly label all region restrictions
- Provide detailed product information
- Offer support for region-related issues
- Ensure all keys are legitimate and verified

## Need Help?

If you have questions about region locks or encounter any issues, our support team is available 24/7 to assist you. Contact us with your order number and we'll help resolve any problems.`,
      coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop',
      category: 'guides',
      author: 'GKEYS Team',
      published: true,
      publishedAt: new Date('2024-11-20'),
      readTime: 6,
      tags: ['region-lock', 'guide', 'activation', 'faq'],
    },
    {
      slug: 'g2a-integration-explained',
      title: 'G2A Integration: How We Source Our Games',
      excerpt: 'Learn about our partnership with G2A and how we ensure you get the best prices on legitimate game keys.',
      content: `# G2A Integration: How We Source Our Games

At GKEYS, we're proud to partner with G2A, one of the world's largest digital marketplaces for game keys. This partnership allows us to offer you an extensive catalog of games at competitive prices while maintaining the highest standards of legitimacy and quality.

## What is G2A?

G2A is a global digital marketplace that connects buyers with sellers of game keys, software licenses, and digital products. With millions of users worldwide, G2A has established itself as a trusted platform in the gaming community.

## Our Integration Process

### Automated Synchronization
We use G2A's Integration API to automatically sync:
- **Product Catalog**: Latest games and software
- **Pricing**: Real-time price updates
- **Stock Levels**: Current availability
- **Product Information**: Descriptions, images, and metadata

### Quality Assurance
Every key we receive goes through our verification process:
1. **Source Verification**: We only work with verified G2A sellers
2. **Key Validation**: All keys are checked before being added to inventory
3. **Customer Protection**: We guarantee all keys are legitimate

## Benefits for You

### Extensive Catalog
- Access to thousands of games from various publishers
- New releases added automatically
- Regular updates to pricing and availability

### Competitive Prices
- Direct integration means better prices
- Automatic price synchronization
- Best deals updated in real-time

### Instant Delivery
- Keys delivered immediately after purchase
- No waiting for manual processing
- Seamless shopping experience

## How It Works

### For Customers
1. Browse our catalog (powered by G2A)
2. Add games to cart
3. Complete purchase
4. Receive key instantly
5. Activate and play!

### Behind the Scenes
1. We query G2A's API for product information
2. Display products on our platform
3. When you purchase, we reserve the key from G2A
4. Key is delivered to your account
5. Transaction is completed securely

## Security and Trust

### Verified Sellers Only
We only work with G2A sellers who have:
- High ratings and positive reviews
- Verified business accounts
- Proven track record of legitimate keys

### Buyer Protection
- All keys are guaranteed to work
- Full refund if key doesn't activate
- 24/7 customer support
- Secure payment processing

## Pricing Transparency

### How Prices Are Set
- Based on G2A marketplace rates
- Updated automatically throughout the day
- Reflects current market conditions
- Includes our service fee for platform maintenance

### Best Price Guarantee
We continuously monitor prices to ensure you get the best deals. If you find a better price elsewhere (for the same product), contact us and we'll match it.

## Frequently Asked Questions

### Are G2A keys legitimate?
Yes! We only source keys from verified G2A sellers with excellent ratings. All keys are checked before being delivered.

### Why are prices so low?
G2A sellers often purchase keys in bulk or during sales, allowing them to offer competitive prices while maintaining profitability.

### What if my key doesn't work?
Contact our support team immediately. We'll verify the issue and provide a replacement key or full refund.

### How often is inventory updated?
Our catalog syncs with G2A multiple times daily, ensuring you always see current prices and availability.

## Our Commitment

We're committed to providing:
- ✅ Legitimate, verified game keys
- ✅ Competitive pricing
- ✅ Excellent customer service
- ✅ Secure transactions
- ✅ Instant key delivery

## Conclusion

Our G2A integration allows us to offer you an unparalleled selection of games at great prices. Combined with our commitment to quality and customer service, you can shop with confidence knowing you're getting legitimate keys at the best prices available.

Shop now and experience the difference!`,
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop',
      category: 'news',
      author: 'GKEYS Team',
      published: true,
      publishedAt: new Date('2024-12-10'),
      readTime: 7,
      tags: ['g2a', 'partnership', 'sourcing', 'integration'],
    },
    {
      slug: 'pre-order-guide-2024',
      title: 'Pre-Order Guide: Everything You Need to Know',
      excerpt: 'Complete guide to pre-ordering games: benefits, risks, and how to make the best decisions for your gaming library.',
      content: `# Pre-Order Guide: Everything You Need to Know

Pre-ordering games has become a standard practice in the gaming industry, offering players early access, exclusive bonuses, and guaranteed availability. This guide will help you make informed decisions about pre-orders.

## What is Pre-Ordering?

Pre-ordering allows you to purchase a game before its official release date. You pay upfront, and the game key is delivered to you on or shortly before the release date.

## Benefits of Pre-Ordering

### Exclusive Bonuses
Many publishers offer pre-order bonuses such as:
- Exclusive in-game items
- Early access to DLC
- Special editions with extra content
- Digital artbooks or soundtracks

### Guaranteed Availability
- Secure your copy before release
- Avoid stock shortages
- Get the game on launch day
- No waiting for restocks

### Better Prices
- Pre-order discounts are common
- Lock in the price before potential increases
- Special pre-order pricing available

## Things to Consider

### Research First
- Read reviews and previews
- Watch gameplay videos
- Check developer track record
- Understand what you're buying

### Cancellation Policy
- Most pre-orders can be cancelled before release
- Check our cancellation policy (14 days before release)
- Contact support if you need to cancel

### System Requirements
- Verify your PC meets requirements
- Check if you need to upgrade hardware
- Consider future-proofing your setup

## How Pre-Orders Work at GKEYS

### Step 1: Browse Pre-Order Games
Look for the "Pre-Order" badge on product pages. These games show:
- Release date
- Pre-order bonuses
- Expected delivery date

### Step 2: Complete Purchase
- Add to cart and checkout
- Payment is processed immediately
- Order confirmation sent via email

### Step 3: Receive Your Key
- Keys delivered on or before release date
- Email notification when key is ready
- Key appears in your account automatically

## Pre-Order Best Practices

### Do Pre-Order If:
✅ You're a fan of the franchise  
✅ Reviews and previews are positive  
✅ Pre-order bonuses are valuable to you  
✅ You want guaranteed launch day access  
✅ The price is right

### Don't Pre-Order If:
❌ You're unsure about the game  
❌ Reviews haven't been released  
❌ Developer has a poor track record  
❌ You can't afford to wait for reviews  
❌ System requirements are unclear

## Popular Pre-Orders for 2024-2025

### Upcoming Releases
- **ARC Raiders**: Free-to-play extraction shooter
- **Various AAA Titles**: Check our pre-order section regularly

## Pre-Order vs. Day-One Purchase

### Pre-Order Advantages
- Exclusive bonuses
- Guaranteed availability
- Early access (sometimes)
- Better pricing

### Day-One Purchase Advantages
- Reviews available
- Known performance
- Informed decision
- Same-day delivery

## Our Pre-Order Guarantee

At GKEYS, we guarantee:
- ✅ Keys delivered on or before release
- ✅ All pre-order bonuses included
- ✅ Full refund if cancelled within policy
- ✅ Support for any issues

## Cancellation Policy

- Cancellations allowed up to 14 days before release
- Full refund processed within 5-7 business days
- Contact support to request cancellation
- After 14-day window, cancellations not possible

## Tips for Smart Pre-Ordering

1. **Set a Budget**: Don't pre-order more than you can afford
2. **Research Thoroughly**: Know what you're buying
3. **Check Bonuses**: Ensure bonuses are worth it
4. **Monitor Release Dates**: Stay updated on delays
5. **Read Terms**: Understand cancellation policies

## Conclusion

Pre-ordering can be a great way to secure your favorite games with exclusive bonuses, but it's important to make informed decisions. Research the game, understand the terms, and only pre-order when you're confident in your purchase.

Happy gaming!`,
      coverImage: 'https://images.unsplash.com/photo-1493711662062-fa541f7f897a?w=1200&h=600&fit=crop',
      category: 'guides',
      author: 'GKEYS Team',
      published: true,
      publishedAt: new Date('2024-11-15'),
      readTime: 6,
      tags: ['pre-order', 'guide', 'gaming', 'tips'],
    },
    {
      slug: 'account-balance-top-up-guide',
      title: 'Account Balance Top-Up: Quick and Easy Guide',
      excerpt: 'Learn how to add funds to your GKEYS account balance for faster checkout and easier purchases.',
      content: `# Account Balance Top-Up: Quick and Easy Guide

GKEYS offers a convenient account balance system that makes purchasing games faster and easier. This guide will show you how to top up your balance and use it for purchases.

## What is Account Balance?

Your account balance is a prepaid wallet on GKEYS that stores funds for future purchases. Instead of entering payment details for every transaction, you can use your balance for instant checkout.

## Benefits of Using Account Balance

### Faster Checkout
- No need to enter payment details each time
- One-click purchasing
- Instant transaction processing
- Streamlined shopping experience

### Better Control
- Set a budget for gaming purchases
- Track your spending easily
- No surprise charges
- Manage your gaming expenses

### Convenience
- Top up once, use multiple times
- Works for all purchases
- Can be used for gifts
- Never expires

## How to Top Up Your Balance

### Step 1: Access Balance Page
1. Log into your GKEYS account
2. Go to your Profile
3. Click on "Balance" in the menu
4. You'll see your current balance

### Step 2: Enter Amount
- Choose your desired top-up amount
- Minimum: $5.00
- Maximum: No limit
- Enter custom amount if needed

### Step 3: Select Payment Method
Available payment methods:
- Credit/Debit Card (Visa, Mastercard)
- PayPal (where available)
- Other regional payment methods

### Step 4: Complete Payment
- Review your top-up amount
- Enter payment details
- Confirm transaction
- Balance updated instantly

## Using Your Balance

### During Checkout
1. Add items to cart
2. Proceed to checkout
3. Select "Use Account Balance"
4. Complete purchase instantly

### Partial Balance Use
- Use balance for part of purchase
- Pay remainder with card
- Flexible payment options
- Mix and match as needed

## Balance Management

### Viewing Your Balance
- Check balance in Profile → Balance
- See transaction history
- View top-up history
- Monitor spending

### Transaction History
- All top-ups recorded
- Purchase history available
- Download receipts
- Track all activity

## Important Information

### Minimum Top-Up
- Minimum amount: $5.00
- This helps reduce processing fees
- Keeps transactions efficient

### No Expiration
- Balance never expires
- Use anytime
- No time limits
- Store funds safely

### Non-Refundable
- Balance cannot be withdrawn as cash
- Can only be used for GKEYS purchases
- Can be used for gifts
- Transfer to purchases only

## Security

### Safe Storage
- Balance stored securely
- Encrypted transactions
- PCI-compliant processing
- Your funds are safe

### Account Protection
- Two-factor authentication available
- Secure login required
- Transaction notifications
- Monitor account activity

## Tips for Using Balance

1. **Top Up Strategically**: Add funds during sales
2. **Set a Budget**: Control your gaming expenses
3. **Use for Gifts**: Easy gift purchasing
4. **Track Spending**: Monitor your purchases
5. **Combine with Promos**: Use balance with discount codes

## Frequently Asked Questions

### Can I withdraw my balance?
No, account balance cannot be withdrawn as cash. It can only be used for purchases on GKEYS.

### Does my balance expire?
No, your balance never expires. You can use it anytime.

### Can I use balance for pre-orders?
Yes! Account balance works for all purchases including pre-orders.

### What's the minimum top-up?
The minimum top-up amount is $5.00.

### Can I get a refund to my balance?
Yes, refunds can be processed to your account balance for easy reuse.

## Conclusion

Account balance is a convenient way to manage your gaming purchases. Top up once and enjoy faster, easier checkout for all your gaming needs!

Start topping up today and experience the convenience!`,
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
      category: 'guides',
      author: 'GKEYS Team',
      published: true,
      publishedAt: new Date('2024-11-10'),
      readTime: 5,
      tags: ['balance', 'payment', 'guide', 'account'],
    },
  ];

  for (const article of blogArticles) {
    try {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          category: article.category,
          author: article.author,
          published: article.published,
          publishedAt: article.publishedAt,
          readTime: article.readTime,
          tags: article.tags,
        },
        create: article,
      });
    } catch (error) {
      console.log(`⚠️ Error seeding article ${article.slug}:`, error instanceof Error ? error.message : String(error));
    }
  }
  console.log(`✅ Created ${blogArticles.length} blog articles`);

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

