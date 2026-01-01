
import { Post, UserRole, Comment } from '../types';

// Moderation State
let BANNED_USERS: Set<string> = new Set();
let BANNED_WORDS: Set<string> = new Set(['badword', 'abuse', 'spam']);

// Empty Mock Data
let POSTS: Post[] = [];

// --- Moderation Functions ---

export const isUserBanned = (userId: string): boolean => {
  return BANNED_USERS.has(userId);
};

export const toggleUserBan = (userId: string): boolean => {
  if (BANNED_USERS.has(userId)) {
    BANNED_USERS.delete(userId);
    return false;
  } else {
    BANNED_USERS.add(userId);
    return true;
  }
};

export const getBannedWords = (): string[] => {
  return Array.from(BANNED_WORDS);
};

export const addBannedWord = (word: string) => {
  BANNED_WORDS.add(word.toLowerCase());
};

export const removeBannedWord = (word: string) => {
  BANNED_WORDS.delete(word.toLowerCase());
};

export const validateContent = (text: string): { isValid: boolean; error?: string } => {
  const lowerText = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      return { isValid: false, error: `Content contains restricted word: "${word}"` };
    }
  }
  return { isValid: true };
};

// --- Post Functions ---

export const getPosts = (scope: 'CLASS' | 'GLOBAL', userId?: string): Post[] => {
  return POSTS.filter(p => p.scope === scope).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createPost = (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>): Post => {
  if (isUserBanned(post.authorId)) {
    throw new Error("You are banned from posting.");
  }

  const validation = validateContent(post.content);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const newPost: Post = {
    ...post,
    id: `p-${Date.now()}`,
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: 0,
    commentsList: [],
    isLiked: false
  };
  POSTS.unshift(newPost);
  return newPost;
};

export const likePost = (postId: string) => {
  const post = POSTS.find(p => p.id === postId);
  if (post) {
    if (post.isLiked) {
      post.likes--;
      post.isLiked = false;
    } else {
      post.likes++;
      post.isLiked = true;
    }
  }
};

export const votePoll = (postId: string, optionId: string) => {
  const post = POSTS.find(p => p.id === postId);
  if (post && post.type === 'POLL' && post.pollOptions) {
    const option = post.pollOptions.find(o => o.id === optionId);
    if (option) {
      option.votes++;
    }
  }
};

export const addComment = (postId: string, commentData: { authorId: string, authorName: string, authorAvatar?: string, content: string }) => {
  if (isUserBanned(commentData.authorId)) {
    throw new Error("You are banned from commenting.");
  }
  
  const validation = validateContent(commentData.content);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const post = POSTS.find(p => p.id === postId);
  if (post) {
    if (!post.commentsList) post.commentsList = [];
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...commentData
    };
    post.commentsList.push(newComment);
    post.comments++;
    return newComment;
  }
  return null;
};
