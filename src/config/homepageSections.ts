import type { SectionConfig } from '../types/sections';

/**
 * Homepage Section Configurations
 * Defines all game sections to display on the homepage
 * Based on spec.md requirements
 */
export const homepageSections: SectionConfig[] = [
  // 1. Best Sellers (with tabs)
  {
    id: 'best-sellers',
    title: 'Best Sellers',
    dataSource: {
      type: 'api',
      method: 'getBestSellers',
    },
    display: {
      columns: 8,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?sort=best-sellers',
    },
    // Tabs will be loaded dynamically from database in HomePage
    tabs: undefined, // Will be set dynamically from DB genres
  },

  // 2. New in the Catalog
  {
    id: 'new-in-catalog',
    title: 'New in the Catalog',
    dataSource: {
      type: 'api',
      method: 'getNewInCatalog',
    },
    display: {
      columns: 8,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?sort=new',
    },
  },

  // 3. Preorders
  {
    id: 'preorders',
    title: 'Preorders',
    dataSource: {
      type: 'api',
      method: 'getPreorders',
    },
    display: {
      columns: 5,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?filter=preorder',
    },
  },

  // 4. New Games (with description box)
  {
    id: 'new-games',
    title: 'New games',
    description: {
      title: 'New games',
      text: "There's nothing more exciting than trying something new",
    },
    dataSource: {
      type: 'api',
      method: 'getNewGames',
    },
    display: {
      columns: 4,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?filter=new',
      checkAllText: 'Check all',
    },
  },

  // 5. Action
  {
    id: 'action',
    title: 'Action',
    dataSource: {
      type: 'api',
      method: 'getGamesByGenre',
      params: { genre: 'Action' },
    },
    display: {
      columns: 6,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?genre=action',
    },
  },

  // 6. Open World
  {
    id: 'open-world',
    title: 'Open World',
    dataSource: {
      type: 'api',
      method: 'getGamesByGenre',
      params: { genre: 'Open World' },
    },
    display: {
      columns: 6,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?genre=open-world',
    },
  },

  // 7. Former Sony Exclusives
  {
    id: 'sony-exclusives',
    title: 'Former Sony Exclusives',
    dataSource: {
      type: 'collection',
      collectionId: 'sony-exclusives',
    },
    display: {
      columns: 6,
      carousel: true,
      showCheckAll: true,
      checkAllLink: '/catalog?collection=sony-exclusives',
    },
  },

  // 8. Noir (with description box)
  {
    id: 'noir',
    title: 'Noir',
    description: {
      title: 'Noir',
      text: 'The situation was quickly going from bad to worse',
    },
    dataSource: {
      type: 'api',
      method: 'getGamesByGenre',
      params: { genre: 'Noir' },
    },
    display: {
      columns: 4,
      carousel: false,
      showCheckAll: true,
      checkAllLink: '/catalog?genre=noir',
      checkAllText: 'Check all',
    },
  },

  // 9. Remakes / Remasters / Reboots
  {
    id: 'remakes',
    title: 'Remakes / Remasters / Reboots',
    dataSource: {
      type: 'collection',
      collectionId: 'remakes',
    },
    display: {
      columns: 5,
      carousel: false,
      showCheckAll: true,
      checkAllLink: '/catalog?collection=remakes',
    },
  },

  // 10. Role-Playing (RPG)
  {
    id: 'rpg',
    title: 'Role-Playing',
    dataSource: {
      type: 'api',
      method: 'getGamesByGenre',
      params: { genre: 'RPG' },
    },
    display: {
      columns: 5,
      carousel: false,
      showCheckAll: true,
      checkAllLink: '/catalog?genre=rpg',
    },
  },
];
