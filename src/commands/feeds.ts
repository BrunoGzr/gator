import {
  createFeedFollow,
  deleteFeedFollow,
  getFeedFollowsForUser,
} from "../lib/db/queries/feedFollows.js";
import { createFeed, getFeedByURL, getFeeds } from "../lib/db/queries/feeds.js";
import type { Feed, User } from "../lib/db/schema.js";

export function printFeed(feed: Feed, user: User): void {
  console.log(`* ID: ${feed.id}`);
  console.log(`* Created: ${feed.createdAt}`);
  console.log(`* Updated: ${feed.updatedAt}`);
  console.log(`* Name: ${feed.name}`);
  console.log(`* URL: ${feed.url}`);
  console.log(`* User: ${user.name}`);
}

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("a name and a url are required");
  }

  const [name, url] = args;

  const feed = await createFeed(name, url, user.id);
  if (!feed) {
    throw new Error("failed to create feed");
  }

  printFeed(feed, user);

  const follow = await createFeedFollow(user.id, feed.id);
  if (!follow) {
    throw new Error("failed to follow feed");
  }
  console.log(`Feed: ${follow.feedName}`);
  console.log(`User: ${follow.userName}`);
}

export async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const allFeeds = await getFeeds();

  for (const feed of allFeeds) {
    console.log(`* Name: ${feed.feedName}`);
    console.log(`* URL: ${feed.feedUrl}`);
    console.log(`* User: ${feed.userName}`);
  }
}

export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("a url is required");
  }

  const url = args[0];

  const feed = await getFeedByURL(url);
  if (!feed) {
    throw new Error(`feed not found: ${url}`);
  }

  const follow = await createFeedFollow(user.id, feed.id);
  if (!follow) {
    throw new Error("failed to follow feed");
  }

  console.log(`Feed: ${follow.feedName}`);
  console.log(`User: ${follow.userName}`);
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);

  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("a url is required");
  }

  const url = args[0];
  const follow = await deleteFeedFollow(user.id, url);

  if (!follow) {
    throw new Error(`feed not found or not followed: ${url}`);
  }

  console.log(`Unfollowed ${url}`);
}
