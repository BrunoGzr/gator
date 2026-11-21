import { fetchFeed } from "../rss.js";
import {
  getNextFeedToFetch,
  markFeedFetched,
} from "../lib/db/queries/feeds.js";
import { createPost } from "../lib/db/queries/posts.js";

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(`invalid duration: ${durationStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 1000 * 60;
    case "h":
      return value * 1000 * 60 * 60;
    default:
      throw new Error(`invalid duration unit: ${unit}`);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = "";
  if (hours > 0) {
    result += `${hours}h`;
  }
  if (hours > 0 || minutes > 0) {
    result += `${minutes}m`;
  }
  result += `${seconds}s`;
  return result;
}

export async function scrapeFeeds(): Promise<void> {
  const feed = await getNextFeedToFetch();

  if (!feed) {
    console.log("No feeds to fetch");
    return;
  }

  console.log(`Fetching ${feed.name} from ${feed.url}`);
  const rss = await fetchFeed(feed.url);
  await markFeedFetched(feed.id);

  let saved = 0;
  for (const item of rss.items) {
    const publishedAt = new Date(item.pubDate);

    try {
      await createPost({
        title: item.title,
        url: item.link,
        description: item.description,
        publishedAt: Number.isNaN(publishedAt.getTime()) ? null : publishedAt,
        feedId: feed.id,
      });
      saved++;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`failed to save post ${item.link}: ${error.message}`);
      } else {
        console.error(error);
      }
    }
  }

  console.log(`Saved ${saved} posts from ${feed.name}`);
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
}

export async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("a time between requests is required");
  }

  const timeBetweenRequests = parseDuration(args[0]);
  console.log(
    `Collecting feeds every ${formatDuration(timeBetweenRequests)}`,
  );

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}
