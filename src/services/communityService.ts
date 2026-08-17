import { CommunityPost, CommunityEvent, Badge, PaperclipStage, MysterySwapItem } from '../types';
import {
  INITIAL_COMMUNITY_POSTS,
  INITIAL_EVENTS,
  INITIAL_MYSTERY_ITEMS,
  CURRENT_USER,
} from '../data/mockData';
import { INITIAL_BADGES, PAPERCLIP_STAGES } from '../constants';

let postsStore: CommunityPost[] = [...INITIAL_COMMUNITY_POSTS];
let eventsStore: CommunityEvent[] = [...INITIAL_EVENTS];
let badgesStore: Badge[] = [...INITIAL_BADGES];
let paperclipStore: PaperclipStage[] = [...PAPERCLIP_STAGES];
let mysteryItemsStore: MysterySwapItem[] = [...INITIAL_MYSTERY_ITEMS];

export const communityService = {
  getPosts(): CommunityPost[] {
    return [...postsStore];
  },

  createPost(title: string, content: string, tags: string[], tradeStory?: CommunityPost['tradeStory']): CommunityPost {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: CURRENT_USER,
      title,
      content,
      tags,
      tradeStory,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      createdAt: 'Az önce',
    };
    postsStore = [newPost, ...postsStore];
    return newPost;
  },

  toggleLikePost(postId: string): boolean {
    const post = postsStore.find((p) => p.id === postId);
    if (post) {
      post.isLiked = !post.isLiked;
      post.likesCount += post.isLiked ? 1 : -1;
      return post.isLiked;
    }
    return false;
  },

  likePost(postId: string): CommunityPost | undefined {
    const post = postsStore.find((p) => p.id === postId);
    if (post) {
      post.isLiked = !post.isLiked;
      post.likesCount += post.isLiked ? 1 : -1;
      return post;
    }
    return undefined;
  },

  getEvents(): CommunityEvent[] {
    return [...eventsStore];
  },

  getEventById(id: string): CommunityEvent | undefined {
    return eventsStore.find((e) => e.id === id);
  },

  toggleEventAttendance(eventId: string): CommunityEvent | undefined {
    const ev = eventsStore.find((e) => e.id === eventId);
    if (ev) {
      ev.isAttending = !ev.isAttending;
      ev.attendeesCount += ev.isAttending ? 1 : -1;
      return ev;
    }
    return undefined;
  },

  toggleRsvp(eventId: string): boolean {
    const ev = eventsStore.find((e) => e.id === eventId);
    if (ev) {
      ev.isAttending = !ev.isAttending;
      ev.attendeesCount += ev.isAttending ? 1 : -1;
      return ev.isAttending;
    }
    return false;
  },

  getBadges(): Badge[] {
    return [...badgesStore];
  },

  getPaperclipStages(): PaperclipStage[] {
    return [...paperclipStore];
  },

  advancePaperclipStage(): PaperclipStage[] {
    const currentIdx = paperclipStore.findIndex((s) => s.isCurrent);
    if (currentIdx !== -1 && currentIdx < paperclipStore.length - 1) {
      paperclipStore[currentIdx].isCurrent = false;
      paperclipStore[currentIdx].isCompleted = true;
      paperclipStore[currentIdx].dateCompleted = 'Bugün';

      paperclipStore[currentIdx + 1].isCurrent = true;
    }
    return [...paperclipStore];
  },

  getMysterySwapItems(): MysterySwapItem[] {
    return [...mysteryItemsStore];
  },

  drawMysterySwap(): MysterySwapItem {
    const randomIdx = Math.floor(Math.random() * mysteryItemsStore.length);
    return mysteryItemsStore[randomIdx];
  },
};
