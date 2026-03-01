# fmp-search-cli

Command line and library tool to extract structured search results from Facebook Marketplace.

## Highlights

- Node.js CLI command: `fmp-search`
- Programmatic API: `search`, `searchRaw`, `getCategories`, `getCities`
- Multiple output formats: `json`, `table`, `jsonl`, `csv`
- Extra terminal utility modes: `--list-categories`, `--list-cities`, `--web`, `--raw`
- Supports paging, detail enrichment, strict token filtering, city/category filters, and price/radius filters

## Requirements

- Node.js `>=18`
- Network access to Facebook Marketplace pages
- **Optional:** Python `>=3.10` + [`curl_cffi`](https://github.com/lexiforest/curl_cffi) for Chrome TLS/HTTP2 fingerprint impersonation (reduces blocks)

## Installation

This package is intended for local use and is not published to npm.

### Link CLI globally from local source

```bash
npm install
npm link
```

Then run:

```bash
fmp-search --help
```

### Anti-bot enhancement (optional)

Install `curl_cffi` to enable Chrome TLS fingerprint impersonation, which significantly reduces rate limiting and blocking:

```bash
npm run setup-cffi
```

Or manually:

```bash
pip install curl_cffi
```

When installed, the CLI automatically uses `curl_cffi` as a fallback when native fetch fails. No extra flags needed. Without it, the CLI works as before (fetch → curl).

### Link package into another local project

```bash
npm link fmp-search-cli
```

### Unlink when needed

```bash
npm unlink -g fmp-search-cli
```

## Quick Start

```bash
fmp-search "iphone 15"
fmp-search "notebook dell" -l 10 -f table
fmp-search "bicicleta" --city saopaulo --radius 80 --min-price 500 --max-price 3000
fmp-search --list-categories
fmp-search --list-cities
```

## CLI Usage

```text
fmp-search <query> [options]
```

### Arguments

| Argument | Required | Description |
|---|---|---|
| `query` | Yes | Search terms. |

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `-l, --limit <n>` | integer | `20` | Maximum number of results returned. |
| `-s, --sort <order>` | string | `relevance` | Sort order: `price_asc`, `price_desc`, `relevance`. |
| `-c, --city <slug>` | string | none | Filter by city slug, ex: `saopaulo`, `riodejaneiro`, `curitiba`. |
| `-g, --category <slug>` | string | none | Filter by category slug, ex: `electronics`, `vehicles`. |
| `-G, --list-categories` | flag | `false` | Print all supported category slugs and exit. |
| `-x, --list-cities` | flag | `false` | Print all supported city slugs and exit. |
| `-m, --min-price <n>` | number | none | Minimum listing price filter. |
| `-M, --max-price <n>` | number | none | Maximum listing price filter. |
| `-k, --radius <km>` | integer | dynamic | Radius in km. Defaults to `65` for city mode and `200` for general search. |
| `-t, --timeout <ms>` | integer | `15000` | HTTP timeout for each request. |
| `-n, --concurrency <n>` | integer | `5` | Parallel listing-detail requests. |
| `-S, --strict` | flag | `false` | Require all query tokens to appear in title/description. |
| `-d, --no-details` | flag | `false` | Skip detail enrichment requests (faster, returns only basic listing data — no description, images, or seller info). |
| `-R, --no-rate-limit` | flag | `false` | Disable built-in rate limiting (may get your IP blocked). |
| `-1, --save-on-first` | flag | `false` | Save the first HTTP response to the project root as `fmp-first_<timestamp>.json` + `.html`. |
| `-e, --save-on-error` | flag | `false` | Save any HTTP response that returns an error to the project root as `fmp-error_<timestamp>.json` + `.html`. |
| `-f, --format <type>` | string | `json` | Output format: `json`, `table`, `jsonl`, `csv`. |
| `-p, --pretty` | flag | `false` | Pretty print JSON output. |
| `-r, --raw` | flag | `false` | Output raw extracted data object and exit. |
| `-F, --fields <list>` | csv string | none | Keep only selected fields, ex: `title,price,permalink`. |
| `-w, --web` | flag | `false` | Render results in an HTML page and open browser. |
| `-L, --log` | flag | `false` | Write a timestamped `.log` file to the project root with HTTP, search, and detail-enrichment traces. |
| `-h, --help` | flag | `false` | Show help. |
| `-v, --version` | flag | `false` | Show package version. |

## Rate Limiting

Built-in rate limiting is **enabled by default** to prevent your IP from being blocked by Facebook.

- **Page delay:** 200 ms between pagination requests
- **Detail delay:** 100 ms between detail-enrichment batches
- **Max concurrency:** 3 parallel detail requests (overrides `--concurrency` when lower)

To disable rate limiting (at your own risk):

```bash
fmp-search "notebook" --no-rate-limit
```

## Logging

Pass `--log` to write a timestamped log file (`fmp-search_YYYY-MM-DD_HH-MM-SS.log`) to the project root.
The file records every HTTP request/response (URL, status code, content-type, body size), the constructed search URL, per-page parse counts, pagination progress, per-item detail-enrichment results, and a request count summary (total, page, and detail calls).
No file is created when `--log` is omitted.

```bash
fmp-search "iphone 15" --log
```

## Output Formats

### `json` (default)
Prints full result object:

- `items`: normalized result items
- `query`: normalized query metadata
- `pagination`: pagination and cap info

### `table`
Human friendly, colorized terminal output.

### `jsonl`
One JSON object per line (best for streaming pipelines).

### `csv`
Header + row output based on item keys.

## Common Examples

```bash
# Basic
fmp-search "iphone 15"

# Sorted by price
fmp-search "notebook" --sort price_asc -f table

# Strict matching
fmp-search "samsung s20" --strict --pretty -l 10

# City + radius + price interval
fmp-search "bicicleta" --city curitiba --radius 100 --min-price 500 --max-price 2500

# CSV export with selected fields
fmp-search "tv samsung" --fields title,price,permalink --format csv > results.csv

# Raw data for debugging
fmp-search "webcam" --raw > raw-facebook-marketplace.json
```

## Library Usage

```js
import { search, searchRaw, getCategories, getCities } from "fmp-search-cli";

const result = await search("iphone 15", {
  limit: 20,
  sort: "price_asc",
  city: "saopaulo",
  category: "electronics",
  minPrice: 1000,
  maxPrice: 6000,
  radius: 80,
  timeout: 15000,
  concurrency: 5,
  strict: false,
});

console.log(result.items.length);

const raw = await searchRaw("iphone 15", { city: "saopaulo", timeout: 15000 });
console.log(Object.keys(raw));

console.log(getCategories().slice(0, 5));
console.log(getCities().slice(0, 5));
```

### API Reference

#### `search(query, options?)`

Returns:

- `items: object[]`
- `query: { text, sort, city, category, strict, url }`
- `pagination: { total, limit, pagesFetched, capped }`

Main options:

- `limit?: number`
- `timeout?: number`
- `sort?: "price_asc" | "price_desc" | "date" | "distance" | "relevance"`
- `concurrency?: number`
- `city?: string`
- `category?: string`
- `minPrice?: number`
- `maxPrice?: number`
- `radius?: number`
- `strict?: boolean`
- `noRateLimit?: boolean`

#### `searchRaw(query, options?)`

Returns raw extracted marketplace payload.

#### `getCategories()`

Returns array of `{ slug, name }`.

#### `getCities()`

Returns array of `{ slug, name, uf }`.

## Item Schema (normalized)

Each item can include:

- `id`
- `title`
- `price`
- `currency`
- `oldPrice`
- `discountPercent`
- `location`
- `city`
- `state`
- `thumbnail`
- `permalink`
- `categoryId`
- `deliveryTypes`
- `hasShipping`
- `isPending`
- `description`
- `images`
- `sellerName`
- `condition`

Note:

- `description`, `images`, `sellerName`, and `condition` are enriched through detail-page requests.
- Some fields may be `null` when not present in source data.

## Error Handling and Validation

The CLI validates:

- positive integer values for `--limit`, `--timeout`, `--concurrency`, `--radius`
- non-negative numbers for `--min-price` and `--max-price`
- allowed output formats
- valid city and category values

Typical errors include:

- unknown city/category slug
- structure extraction failures if platform markup changes
- network/timeout issues

## Performance Notes

- Higher `--concurrency` can be faster but increases load and may trigger remote blocking.
- Large `--limit` values may stop early when pagination caps are reached.
- `--strict` can reduce final item count significantly.

## Development

```bash
npm install
npm run format
```

## License

MIT
