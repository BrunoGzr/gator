import { getPostsForUser } from "../lib/db/queries/posts.js";
import type { User } from "../lib/db/schema.js";

export async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  let limit = 2;

  if (args.length > 0) {
    const parsed = parseInt(args[0], 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  const userPosts = await getPostsForUser(user.id, limit);

  if (userPosts.length === 0) {
    console.log("No posts found");
    return;
  }

  for (const post of userPosts) {
    console.log(`* ${post.title}`);
    console.log(`  ${post.url}`);
    if (post.publishedAt) {
      console.log(`  ${post.publishedAt.toISOString()}`);
    }
    console.log(`  (${post.feedName})`);
    console.log("");
  }
}
