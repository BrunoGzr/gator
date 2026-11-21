# Gator

Gator is a command-line RSS feed aggregator written in TypeScript. It lets you:

- register and switch between users on the same machine
- add RSS feeds and follow feeds added by other users
- continuously scrape feeds and store their posts in PostgreSQL
- browse the latest posts from the feeds you follow, right in your terminal

The CLI is a multi-user application that runs entirely on your local machine. There is no authentication: anyone with access to the database credentials can act as any user.

## Requirements

- [Node.js](https://nodejs.org/) **v22.15.0** (the version is pinned in `.nvmrc`)
- [nvm](https://github.com/nvm-sh/nvm) (recommended way to install and switch Node versions)
- [PostgreSQL](https://www.postgresql.org/) **16+** running locally
- `psql` (optional, but handy for inspecting the database)

## Installation

```bash
git clone https://github.com/BrunoGzr/gator.git
cd gator
nvm use
npm install
```

## Database setup

Create a database for gator:

```bash
psql postgres -c "CREATE DATABASE gator;"
```

Run the database migrations:

```bash
npx drizzle-kit migrate
```

## Configuration

Gator stores its configuration in `~/.gatorconfig.json` in your home directory:

```json
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
  "current_user_name": ""
}
```

- `db_url` is the full PostgreSQL connection string. Keep `sslmode=disable` when connecting to a local database.
- `current_user_name` is managed by Gator: it is set automatically when you `register` or `login`.

You can start with just the `db_url`; Gator will add `current_user_name` when needed:

```json
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
}
```

## Usage

All commands are run through the `start` script:

```bash
npm run start <command> [args...]
```

### Users

```bash
npm run start register <username>   # create a user and log in as them
npm run start login <username>      # log in as an existing user
npm run start users                 # list users (the current one is marked)
npm run start reset                 # delete all users and their data
```

### Feeds

```bash
npm run start addfeed <name> <url>  # add a feed and follow it
npm run start feeds                 # list all feeds and their creators
npm run start follow <url>          # follow an existing feed
npm run start following             # list the feeds you follow
npm run start unfollow <url>        # stop following a feed
```

### Aggregation and browsing

```bash
npm run start agg <duration>        # scrape feeds continuously (e.g. 1s, 30s, 5m, 1h)
npm run start browse [limit]        # show the latest posts (default limit: 2)
```

`agg` runs until you press `Ctrl+C`. It always fetches the feed that was fetched
the longest time ago (feeds that were never fetched come first), saves new posts
to the database, and prints a short summary for each feed. You can leave it
running in one terminal while you use `browse` and the other commands in another.

For example:

```bash
# terminal 1
npm run start agg 1m

# terminal 2
npm run start register lane
npm run start addfeed "Hacker News" https://news.ycombinator.com/rss
npm run start browse 10
```

## Project structure

```
src/
├── index.ts                 CLI entrypoint and command registry
├── commands.ts              command types, registry helpers, logged-in middleware
├── config.ts                ~/.gatorconfig.json read/write
├── rss.ts                   RSS fetching and parsing
├── commands/                command handlers
└── lib/db/
    ├── index.ts             Drizzle database client
    ├── schema.ts            database tables (users, feeds, feed_follows, posts)
    ├── migrations/          generated SQL migrations
    └── queries/             database queries
```

## Development

```bash
npx tsc --noEmit    # type-check
npx drizzle-kit generate   # generate a migration after changing schema.ts
npx drizzle-kit migrate    # apply migrations
npx drizzle-kit check      # verify migration consistency
```
