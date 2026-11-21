import { eq, sql } from "drizzle-orm";

import { db } from "../index.js";
import { feedFollows, feeds, posts } from "../schema.js";

export type CreatePostParams = {
  title: string;
  url: string;
  description: string | null;
  publishedAt: Date | null;
  feedId: string;
};

export async function createPost(params: CreatePostParams) {
  const [result] = await db
    .insert(posts)
    .values({
      title: params.title,
      url: params.url,
      description: params.description,
      publishedAt: params.publishedAt,
      feedId: params.feedId,
    })
    .onConflictDoNothing({ target: posts.url })
    .returning();

  return result;
}

export async function getPostsForUser(userId: string, limit: number) {
  return await db
    .select({
      id: posts.id,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedId: posts.feedId,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feedFollows, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(sql`${posts.publishedAt} DESC NULLS LAST`)
    .limit(limit);
}
