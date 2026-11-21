import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channelTitle: string;
  channelLink: string;
  channelDescription: string;
  items: RSSItem[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(
      `failed to fetch feed: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();

  const parser = new XMLParser({ processEntities: false });
  const parsed: unknown = parser.parse(xml);

  if (!isObject(parsed) || !isObject(parsed.rss)) {
    throw new Error("invalid feed: missing rss element");
  }

  const channel = parsed.rss.channel;
  if (!isObject(channel)) {
    throw new Error("invalid feed: missing rss.channel element");
  }

  const channelTitle = channel.title;
  const channelLink = channel.link;
  const channelDescription = channel.description;

  if (
    typeof channelTitle !== "string" ||
    typeof channelLink !== "string" ||
    typeof channelDescription !== "string"
  ) {
    throw new Error("invalid feed: missing channel metadata");
  }

  const rawItems = channel.item;
  let itemList: unknown[];
  if (Array.isArray(rawItems)) {
    itemList = rawItems;
  } else if (isObject(rawItems)) {
    itemList = [rawItems];
  } else {
    itemList = [];
  }

  const items: RSSItem[] = [];
  for (const rawItem of itemList) {
    if (!isObject(rawItem)) {
      continue;
    }

    const title = rawItem.title;
    const link = rawItem.link;
    const description = rawItem.description;
    const pubDate = rawItem.pubDate;

    if (
      typeof title !== "string" ||
      typeof link !== "string" ||
      typeof description !== "string" ||
      typeof pubDate !== "string"
    ) {
      continue;
    }

    items.push({ title, link, description, pubDate });
  }

  return {
    channelTitle,
    channelLink,
    channelDescription,
    items,
  };
}
