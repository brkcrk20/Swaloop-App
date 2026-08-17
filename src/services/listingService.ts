import { Listing, CategoryId, ListingCondition } from '../types';
import { INITIAL_LISTINGS } from '../data/mockData';
import { impactService } from './impactService';

let listingsStore: Listing[] = [...INITIAL_LISTINGS];

export const listingService = {
  getAllListings(): Listing[] {
    return [...listingsStore];
  },

  getListingById(id: string): Listing | undefined {
    return listingsStore.find((item) => item.id === id);
  },

  getUserListings(userId: string): Listing[] {
    return listingsStore.filter((item) => item.userId === userId);
  },

  createListing(data: {
    userId: string;
    user: Listing['user'];
    title: string;
    description: string;
    categoryId: CategoryId;
    condition: ListingCondition;
    images: string[];
    location: Listing['location'];
    lookingFor: string;
    deliveryOptions: ('in_person' | 'cargo' | 'safe_point')[];
    tags?: string[];
  }): Listing {
    const estimatedImpact = impactService.calculateListingImpact(data.categoryId, data.condition);
    const newListing: Listing = {
      id: `list-${Date.now()}`,
      userId: data.userId,
      user: data.user,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      condition: data.condition,
      images:
        data.images.length > 0
          ? data.images
          : [
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            ],
      location: data.location,
      lookingFor: data.lookingFor,
      deliveryOptions: data.deliveryOptions,
      estimatedImpact,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 1,
      favoriteCount: 0,
      isFavorite: false,
      tags: data.tags || [],
    };

    listingsStore = [newListing, ...listingsStore];
    return newListing;
  },

  updateListing(id: string, updates: Partial<Listing>): Listing | undefined {
    const idx = listingsStore.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    listingsStore[idx] = {
      ...listingsStore[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return listingsStore[idx];
  },

  deleteListing(id: string): boolean {
    const beforeLen = listingsStore.length;
    listingsStore = listingsStore.filter((l) => l.id !== id);
    return listingsStore.length < beforeLen;
  },

  toggleFavorite(id: string): boolean {
    const item = listingsStore.find((l) => l.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      item.favoriteCount += item.isFavorite ? 1 : -1;
      return item.isFavorite;
    }
    return false;
  },

  getFavorites(): Listing[] {
    return listingsStore.filter((l) => l.isFavorite);
  },

  searchListings(query: string, categoryId?: string, condition?: string, maxDistance?: number): Listing[] {
    const q = query.trim().toLowerCase();
    return listingsStore.filter((item) => {
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.lookingFor.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      const matchCat = !categoryId || categoryId === 'all' || item.categoryId === categoryId;
      const matchCond = !condition || condition === 'all' || item.condition === condition;
      const matchDist = !maxDistance || item.location.distanceKm <= maxDistance;

      return matchQuery && matchCat && matchCond && matchDist;
    });
  },
};
