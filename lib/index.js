/**
 * @fileoverview Core search library for Facebook Marketplace.
 * Provides functions to query Facebook Marketplace listing pages, extract
 * structured item data, and enrich results with full listing details.
 * @module index
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_MARKETPLACE = { vanity: "saopaulo", lat: -23.55, lng: -46.6333 };
const DEFAULT_RADIUS_KM = 200;
const DEFAULT_LIMIT = 20;
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_CONCURRENCY = 5;

/**
 * Brazilian cities with their Facebook Marketplace vanity URLs and coordinates.
 * @type {Map<string, {vanity: string, name: string, lat: number, lng: number, uf: string}>}
 */
const CITIES = new Map([
  ["riobranco", { vanity: "riobranco", name: "Rio Branco", lat: -9.9753, lng: -67.8249, uf: "AC" }],

  ["maceio", { vanity: "maceio", name: "Maceió", lat: -9.6498, lng: -35.7089, uf: "AL" }],

  ["manaus", { vanity: "manaus", name: "Manaus", lat: -3.119, lng: -60.0217, uf: "AM" }],

  ["macapa", { vanity: "macapa", name: "Macapá", lat: 0.0349, lng: -51.0694, uf: "AP" }],

  ["salvador", { vanity: "salvador", name: "Salvador", lat: -12.9714, lng: -38.5124, uf: "BA" }],
  ["feirasantana", { vanity: "feirasantana", name: "Feira de Santana", lat: -12.2664, lng: -38.9663, uf: "BA" }],
  ["vitoriadaconquista", { vanity: "vitoriadaconquista", name: "Vitória da Conquista", lat: -14.8661, lng: -40.8444, uf: "BA" }],
  ["camacari", { vanity: "camacari", name: "Camaçari", lat: -12.6994, lng: -38.3249, uf: "BA" }],
  ["ilheus", { vanity: "ilheus", name: "Ilhéus", lat: -14.7888, lng: -39.049, uf: "BA" }],

  ["fortaleza", { vanity: "fortaleza", name: "Fortaleza", lat: -3.7172, lng: -38.5433, uf: "CE" }],
  ["caucaia", { vanity: "caucaia", name: "Caucaia", lat: -3.7249, lng: -38.6534, uf: "CE" }],
  ["juazeiro", { vanity: "juazeiro", name: "Juazeiro do Norte", lat: -7.2132, lng: -39.3151, uf: "CE" }],
  ["sobral", { vanity: "sobral", name: "Sobral", lat: -3.6882, lng: -40.3493, uf: "CE" }],

  ["brasilia", { vanity: "brasilia", name: "Brasília", lat: -15.7975, lng: -47.8919, uf: "DF" }],

  ["vitoria", { vanity: "vitoria", name: "Vitória", lat: -20.3155, lng: -40.3128, uf: "ES" }],
  ["vilavelha", { vanity: "vilavelha", name: "Vila Velha", lat: -20.3297, lng: -40.2925, uf: "ES" }],
  ["serra", { vanity: "serra", name: "Serra", lat: -20.1297, lng: -40.307, uf: "ES" }],
  ["cariacica", { vanity: "cariacica", name: "Cariacica", lat: -20.2633, lng: -40.4156, uf: "ES" }],

  ["goiania", { vanity: "goiania", name: "Goiânia", lat: -16.6864, lng: -49.2643, uf: "GO" }],
  ["aparecidadegoiania", { vanity: "aparecidadegoiania", name: "Aparecida de Goiânia", lat: -16.8234, lng: -49.2437, uf: "GO" }],
  ["anapolis", { vanity: "anapolis", name: "Anápolis", lat: -16.3281, lng: -48.9528, uf: "GO" }],

  ["saoluis", { vanity: "saoluis", name: "São Luís", lat: -2.5297, lng: -44.2825, uf: "MA" }],
  ["imperatriz", { vanity: "imperatriz", name: "Imperatriz", lat: -5.5248, lng: -47.4743, uf: "MA" }],

  ["belohorizonte", { vanity: "belohorizonte", name: "Belo Horizonte", lat: -19.9191, lng: -43.9386, uf: "MG" }],
  ["uberlandia", { vanity: "uberlandia", name: "Uberlândia", lat: -18.9186, lng: -48.2772, uf: "MG" }],
  ["contagem", { vanity: "contagem", name: "Contagem", lat: -19.9317, lng: -44.0536, uf: "MG" }],
  ["juizdefora", { vanity: "juizdefora", name: "Juiz de Fora", lat: -21.7629, lng: -43.3501, uf: "MG" }],
  ["betim", { vanity: "betim", name: "Betim", lat: -19.9678, lng: -44.1982, uf: "MG" }],
  ["montesclaros", { vanity: "montesclaros", name: "Montes Claros", lat: -16.7282, lng: -43.8619, uf: "MG" }],
  ["uberaba", { vanity: "uberaba", name: "Uberaba", lat: -19.7477, lng: -47.9318, uf: "MG" }],

  ["campogrande", { vanity: "campogrande", name: "Campo Grande", lat: -20.4697, lng: -54.6201, uf: "MS" }],
  ["dourados", { vanity: "dourados", name: "Dourados", lat: -22.2211, lng: -54.8058, uf: "MS" }],

  ["cuiaba", { vanity: "cuiaba", name: "Cuiabá", lat: -15.596, lng: -56.0974, uf: "MT" }],
  ["varzeagrande", { vanity: "varzeagrande", name: "Várzea Grande", lat: -15.6467, lng: -56.1324, uf: "MT" }],
  ["sinop", { vanity: "sinop", name: "Sinop", lat: -11.8642, lng: -55.5044, uf: "MT" }],

  ["belem", { vanity: "belem", name: "Belém", lat: -1.4558, lng: -48.5024, uf: "PA" }],
  ["ananindeua", { vanity: "ananindeua", name: "Ananindeua", lat: -1.3656, lng: -48.3722, uf: "PA" }],
  ["santarem", { vanity: "santarem", name: "Santarém", lat: -2.4386, lng: -54.6983, uf: "PA" }],
  ["maraba", { vanity: "maraba", name: "Marabá", lat: -5.3686, lng: -49.1178, uf: "PA" }],

  ["joaopessoa", { vanity: "joaopessoa", name: "João Pessoa", lat: -7.115, lng: -34.861, uf: "PB" }],
  ["campinagrande", { vanity: "campinagrande", name: "Campina Grande", lat: -7.2232, lng: -35.8817, uf: "PB" }],

  ["recife", { vanity: "recife", name: "Recife", lat: -8.0476, lng: -34.877, uf: "PE" }],
  ["olinda", { vanity: "olinda", name: "Olinda", lat: -8.0089, lng: -34.8553, uf: "PE" }],
  ["jaboatao", { vanity: "jaboatao", name: "Jaboatão dos Guararapes", lat: -8.1128, lng: -35.0029, uf: "PE" }],
  ["caruaru", { vanity: "caruaru", name: "Caruaru", lat: -8.2843, lng: -35.9761, uf: "PE" }],
  ["petrolina", { vanity: "petrolina", name: "Petrolina", lat: -9.39, lng: -40.5082, uf: "PE" }],

  ["teresina", { vanity: "teresina", name: "Teresina", lat: -5.089, lng: -42.8019, uf: "PI" }],
  ["parnaiba", { vanity: "parnaiba", name: "Parnaíba", lat: -2.9049, lng: -41.7757, uf: "PI" }],

  ["curitiba", { vanity: "curitiba", name: "Curitiba", lat: -25.4284, lng: -49.2733, uf: "PR" }],
  ["londrina", { vanity: "londrina", name: "Londrina", lat: -23.3045, lng: -51.1696, uf: "PR" }],
  ["maringa", { vanity: "maringa", name: "Maringá", lat: -23.4273, lng: -51.9375, uf: "PR" }],
  ["pontagrossa", { vanity: "pontagrossa", name: "Ponta Grossa", lat: -25.0935, lng: -50.1659, uf: "PR" }],
  ["cascavel", { vanity: "cascavel", name: "Cascavel", lat: -24.9578, lng: -53.4595, uf: "PR" }],
  ["fozdoiguacu", { vanity: "fozdoiguacu", name: "Foz do Iguaçu", lat: -25.5478, lng: -54.5882, uf: "PR" }],

  ["riodejaneiro", { vanity: "riodejaneiro", name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, uf: "RJ" }],
  ["niteroi", { vanity: "niteroi", name: "Niterói", lat: -22.8833, lng: -43.1036, uf: "RJ" }],
  ["saogoncalo", { vanity: "saogoncalo", name: "São Gonçalo", lat: -22.8267, lng: -43.0539, uf: "RJ" }],
  ["novaiguacu", { vanity: "novaiguacu", name: "Nova Iguaçu", lat: -22.7597, lng: -43.4516, uf: "RJ" }],
  ["duquedecaxias", { vanity: "duquedecaxias", name: "Duque de Caxias", lat: -22.7856, lng: -43.3117, uf: "RJ" }],
  ["petropolis", { vanity: "petropolis", name: "Petrópolis", lat: -22.5044, lng: -43.1786, uf: "RJ" }],
  ["camposdosgoytacazes", { vanity: "camposdosgoytacazes", name: "Campos dos Goytacazes", lat: -21.7543, lng: -41.3244, uf: "RJ" }],

  ["natal", { vanity: "natal", name: "Natal", lat: -5.7945, lng: -35.211, uf: "RN" }],
  ["mossoro", { vanity: "mossoro", name: "Mossoró", lat: -5.1878, lng: -37.3443, uf: "RN" }],

  ["portovelho", { vanity: "portovelho", name: "Porto Velho", lat: -8.7612, lng: -63.9004, uf: "RO" }],

  ["boavista", { vanity: "boavista", name: "Boa Vista", lat: 2.8235, lng: -60.6758, uf: "RR" }],

  ["portoalegre", { vanity: "portoalegre", name: "Porto Alegre", lat: -30.0346, lng: -51.2177, uf: "RS" }],
  ["caxiasdosul", { vanity: "caxiasdosul", name: "Caxias do Sul", lat: -29.1681, lng: -51.1794, uf: "RS" }],
  ["pelotas", { vanity: "pelotas", name: "Pelotas", lat: -31.7654, lng: -52.3376, uf: "RS" }],
  ["canoas", { vanity: "canoas", name: "Canoas", lat: -29.9156, lng: -51.1839, uf: "RS" }],
  ["santamaria", { vanity: "santamaria", name: "Santa Maria", lat: -29.6842, lng: -53.8069, uf: "RS" }],
  ["gravatai", { vanity: "gravatai", name: "Gravataí", lat: -29.9442, lng: -51.0211, uf: "RS" }],

  ["florianopolis", { vanity: "florianopolis", name: "Florianópolis", lat: -27.5954, lng: -48.548, uf: "SC" }],
  ["joinville", { vanity: "joinville", name: "Joinville", lat: -26.3044, lng: -48.8487, uf: "SC" }],
  ["blumenau", { vanity: "blumenau", name: "Blumenau", lat: -26.9194, lng: -49.0661, uf: "SC" }],
  ["criciuma", { vanity: "criciuma", name: "Criciúma", lat: -28.6773, lng: -49.3694, uf: "SC" }],
  ["chapeco", { vanity: "chapeco", name: "Chapecó", lat: -27.1009, lng: -52.6153, uf: "SC" }],

  ["aracaju", { vanity: "aracaju", name: "Aracaju", lat: -10.9091, lng: -37.0677, uf: "SE" }],

  ["saopaulo", { vanity: "saopaulo", name: "São Paulo", lat: -23.55, lng: -46.6333, uf: "SP" }],
  ["campinas", { vanity: "campinas", name: "Campinas", lat: -22.9099, lng: -47.0626, uf: "SP" }],
  ["guarulhos", { vanity: "guarulhos", name: "Guarulhos", lat: -23.4525, lng: -46.5333, uf: "SP" }],
  ["saojosedoscampos", { vanity: "saojosedoscampos", name: "São José dos Campos", lat: -23.1794, lng: -45.8869, uf: "SP" }],
  ["sorocaba", { vanity: "sorocaba", name: "Sorocaba", lat: -23.5015, lng: -47.4526, uf: "SP" }],
  ["santos", { vanity: "santos", name: "Santos", lat: -23.9608, lng: -46.3336, uf: "SP" }],
  ["ribeiraopreto", { vanity: "ribeiraopreto", name: "Ribeirão Preto", lat: -21.1704, lng: -47.8103, uf: "SP" }],
  ["osasco", { vanity: "osasco", name: "Osasco", lat: -23.5329, lng: -46.7919, uf: "SP" }],
  ["santoandre", { vanity: "santoandre", name: "Santo André", lat: -23.6639, lng: -46.5383, uf: "SP" }],
  ["saobernardodocampo", { vanity: "saobernardodocampo", name: "São Bernardo do Campo", lat: -23.6949, lng: -46.5654, uf: "SP" }],
  ["maua", { vanity: "maua", name: "Mauá", lat: -23.6678, lng: -46.4614, uf: "SP" }],
  ["carapicuiba", { vanity: "carapicuiba", name: "Carapicuíba", lat: -23.5224, lng: -46.8351, uf: "SP" }],
  ["mogidascruzes", { vanity: "mogidascruzes", name: "Mogi das Cruzes", lat: -23.5229, lng: -46.1853, uf: "SP" }],
  ["diadema", { vanity: "diadema", name: "Diadema", lat: -23.6867, lng: -46.623, uf: "SP" }],
  ["jundiai", { vanity: "jundiai", name: "Jundiaí", lat: -23.1857, lng: -46.8978, uf: "SP" }],
  ["piracicaba", { vanity: "piracicaba", name: "Piracicaba", lat: -22.7253, lng: -47.6492, uf: "SP" }],
  ["bauru", { vanity: "bauru", name: "Bauru", lat: -22.3246, lng: -49.0761, uf: "SP" }],
  ["saojosedoripreto", { vanity: "saojosedoripreto", name: "São José do Rio Preto", lat: -20.8197, lng: -49.3794, uf: "SP" }],

  ["palmas", { vanity: "palmas", name: "Palmas", lat: -10.184, lng: -48.3336, uf: "TO" }],
]);

/**
 * Facebook Marketplace category slugs.
 * @type {Map<string, string>}
 */
const CATEGORIES = new Map([
  ["vehicles", "Veículos"],
  ["propertyrentals", "Imóveis para Alugar"],
  ["apparel", "Vestuário"],
  ["electronics", "Eletrônicos"],
  ["entertainment", "Entretenimento"],
  ["family", "Família"],
  ["free", "Grátis"],
  ["garden", "Jardim e Ar Livre"],
  ["hobbies", "Hobbies"],
  ["home", "Casa e Jardim"],
  ["homeimprovement", "Materiais de Construção"],
  ["homesales", "Imóveis à Venda"],
  ["instruments", "Instrumentos Musicais"],
  ["office", "Material de Escritório"],
  ["petsupplies", "Pet Shop"],
  ["sports", "Esportes"],
  ["toys", "Brinquedos e Jogos"],
]);

/**
 * Searches Facebook Marketplace and returns a structured result set.
 *
 * @param {string} query - The search query string.
 * @param {object} [options={}] - Search options.
 * @param {number} [options.limit=20] - Maximum number of items to return.
 * @param {number} [options.timeout=15000] - HTTP request timeout in milliseconds.
 * @param {'price_asc'|'price_desc'|'date'|'distance'|'relevance'} [options.sort] - Sort order.
 * @param {number} [options.concurrency=5] - Max parallel detail requests per batch.
 * @param {string} [options.city] - City slug for location-based filtering.
 * @param {string} [options.category] - Category slug to filter.
 * @param {number} [options.minPrice] - Minimum price filter.
 * @param {number} [options.maxPrice] - Maximum price filter.
 * @param {number} [options.radius] - Search radius in km.
 * @param {boolean} [options.strict=false] - Only show results where ALL search terms appear.
 * @returns {Promise<{items: object[], query: object, pagination: object}>} Search result.
 */
export async function search(query, options = {}) {
  const { limit = DEFAULT_LIMIT, timeout = DEFAULT_TIMEOUT, sort, concurrency = DEFAULT_CONCURRENCY, city, category, minPrice, maxPrice, radius, strict = false } = options;

  if (category && !CATEGORIES.has(category)) {
    const list = [...CATEGORIES.entries()].map(([slug, name]) => `  ${slug.padEnd(22)} ${name}`).join("\n");
    throw new Error(`Unknown category "${category}".\n\nValid categories:\n${list}\n\nUse --list-categories to see all options.`);
  }

  const cityConfig = city ? resolveCity(city) : null;

  const location = cityConfig ? { vanity: cityConfig.vanity, lat: cityConfig.lat, lng: cityConfig.lng } : { vanity: DEFAULT_MARKETPLACE.vanity, lat: DEFAULT_MARKETPLACE.lat, lng: DEFAULT_MARKETPLACE.lng };

  const searchRadius = radius || (cityConfig ? 65 : DEFAULT_RADIUS_KM);

  const MAX_PAGES = 10;
  const firstUrl = buildUrl(query, { vanity: location.vanity, category });
  const firstHtml = await fetchPage(firstUrl, timeout);

  const pageData = extractPageData(firstHtml);
  if (!pageData || !pageData.listings || pageData.listings.length === 0) {
    throw new Error("Could not extract search results. The page structure may have changed, or Facebook may be blocking requests.");
  }

  const seenIds = new Set();
  let items = pageData.listings.map((l) => parseListing(l)).filter(Boolean);
  for (const item of items) if (item.id) seenIds.add(item.id);

  let endCursor = pageData.endCursor;
  let hasNextPage = pageData.hasNextPage;
  let pagesFetched = 1;

  while (items.length < limit && hasNextPage && endCursor && pagesFetched < MAX_PAGES) {
    const pageResult = await fetchNextPage({
      query,
      cursor: endCursor,
      location,
      radius: searchRadius,
      category,
      minPrice,
      maxPrice,
      lsd: pageData.lsd,
      queryId: pageData.queryId,
      timeout,
    });

    if (!pageResult || !pageResult.listings || pageResult.listings.length === 0) break;

    const prevCount = items.length;
    for (const raw of pageResult.listings) {
      const item = parseListing(raw);
      if (!item) continue;
      if (item.id && seenIds.has(item.id)) continue;
      if (item.id) seenIds.add(item.id);
      items.push(item);
    }

    if (items.length === prevCount) break;

    endCursor = pageResult.endCursor;
    hasNextPage = pageResult.hasNextPage;
    pagesFetched++;
  }

  const capped = items.length >= limit || (hasNextPage && pagesFetched >= MAX_PAGES);

  if (strict) {
    const tokens = getQueryTokens(query);
    if (tokens.length > 0) items = items.filter((item) => matchesTokens(item, tokens));
  }

  if (sort === "price_asc") {
    items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  } else if (sort === "price_desc") {
    items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }

  items = items.slice(0, limit);

  if (items.length > 0) {
    const queue = items.filter((item) => item.permalink);
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const html = await fetchPage(item.permalink, timeout);

            let description = null;
            {
              const marker = '"redacted_description"';
              let idx = html.indexOf(marker);
              if (idx < 0) idx = html.indexOf('"description"');
              if (idx >= 0) {
                const textMarker = '"text":"';
                const textIdx = html.indexOf(textMarker, idx);
                if (textIdx >= 0 && textIdx - idx <= 200) {
                  const start = textIdx + textMarker.length;
                  let end = start;
                  for (let k = start; k < html.length; k++) {
                    if (html[k] === '"' && html[k - 1] !== "\\") {
                      end = k;
                      break;
                    }
                  }
                  try {
                    const raw = JSON.parse('"' + html.slice(start, end) + '"');
                    description = raw.trim() || null;
                  } catch {
                    description = html.slice(start, end).replace(/\\n/g, "\n").replace(/\\"/g, '"').trim() || null;
                  }
                }
              }
            }

            const images = [];
            const seen = new Set();
            {
              const startIdx = html.indexOf('"listing_photos"');
              if (startIdx >= 0) {
                const section = html.substring(startIdx, Math.min(startIdx + 20000, html.length));
                const uriRegex = /"uri"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
                let match;
                while ((match = uriRegex.exec(section)) !== null) {
                  const url = match[1].replace(/\\\//g, "/");
                  if (url.includes("fbcdn.net/v/") && !url.includes("rsrc.php") && !seen.has(url)) {
                    seen.add(url);
                    images.push({ url });
                  }
                }
              }
              if (images.length === 0) {
                const uriRegex = /"uri"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
                let m;
                while ((m = uriRegex.exec(html)) !== null) {
                  const url = m[1].replace(/\\\//g, "/");
                  if (url.includes("fbcdn.net/v/") && url.includes("_nc_cat") && !url.includes("p60x60") && !url.includes("p100x100") && !url.includes("cp0")) {
                    if (url.includes("p720x720") || url.includes("s960x960") || url.includes("_o.jpg")) {
                      if (!seen.has(url)) {
                        seen.add(url);
                        images.push({ url });
                      }
                    }
                  }
                }
              }
            }

            let sellerName = null;
            {
              const sellerIdx = html.indexOf('"marketplace_listing_seller"');
              if (sellerIdx >= 0) {
                const section = html.substring(sellerIdx, Math.min(sellerIdx + 500, html.length));
                if (!section.startsWith('"marketplace_listing_seller":null')) {
                  const nameMatch = section.match(/"name"\s*:\s*"([^"]+)"/);
                  if (nameMatch) sellerName = nameMatch[1];
                }
              }
              if (!sellerName) {
                const ownerMatch = html.match(/"story_bucket_owner"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/);
                if (ownerMatch) sellerName = ownerMatch[1];
              }
            }

            let condition = null;
            {
              const conditionMatch = html.match(/"condition_text":\{[^}]*"text":"([^"]+)"/);
              if (conditionMatch) condition = conditionMatch[1];
              if (!condition) {
                const altMatch = html.match(/"listing_condition_type":"([^"]+)"/);
                if (altMatch) {
                  const map = { NEW: "Novo", USED_GOOD: "Usado - Bom estado", USED_FAIR: "Usado - Aceitável", USED_LIKE_NEW: "Usado - Como novo" };
                  condition = map[altMatch[1]] || altMatch[1];
                }
              }
            }

            return {
              description,
              images: images.length > 0 ? images : null,
              sellerName,
              condition,
            };
          } catch {
            return null;
          }
        }),
      );
      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled" && result.value) Object.assign(batch[j], result.value);
      }
    }
  }

  return {
    items,
    query: {
      text: query,
      sort: sort || null,
      city: cityConfig?.name || null,
      category: category || null,
      strict,
      url: firstUrl,
    },
    pagination: {
      total: items.length,
      limit,
      pagesFetched,
      capped,
    },
  };
}

/**
 * Fetches and returns the raw embedded data from a Facebook Marketplace page.
 *
 * @param {string} query - The search query string.
 * @param {object} [options={}] - Request options.
 * @param {number} [options.timeout=15000] - HTTP request timeout in ms.
 * @param {string} [options.city] - City slug.
 * @param {string} [options.category] - Category slug.
 * @returns {Promise<object>} The raw extracted data.
 */
export async function searchRaw(query, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, city, category } = options;

  if (category && !CATEGORIES.has(category)) {
    const list = [...CATEGORIES.entries()].map(([slug, name]) => `  ${slug.padEnd(22)} ${name}`).join("\n");
    throw new Error(`Unknown category "${category}".\n\nValid categories:\n${list}\n\nUse --list-categories to see all options.`);
  }

  const cityConfig = city ? resolveCity(city) : null;
  const vanity = cityConfig?.vanity || DEFAULT_MARKETPLACE.vanity;

  const url = buildUrl(query, { vanity, category });
  const html = await fetchPage(url, timeout);
  const data = extractPageData(html);

  if (!data) {
    throw new Error("Could not extract data from Facebook Marketplace.");
  }

  return data;
}

/**
 * Returns known categories as an array of `{slug, name}` objects.
 * @returns {{slug: string, name: string}[]}
 */
export function getCategories() {
  return [...CATEGORIES.entries()].map(([slug, name]) => ({ slug, name }));
}

/**
 * Returns known cities as an array of objects.
 * @returns {{slug: string, name: string, uf: string}[]}
 */
export function getCities() {
  return [...CITIES.entries()].map(([slug, c]) => ({ slug, name: c.name, uf: c.uf }));
}

/**
 * Resolves a city slug to its configuration.
 * @param {string} input
 * @returns {{vanity: string, name: string, lat: number, lng: number, uf: string}}
 */
let _normalizedCityMap = null;
function getNormalizedCityMap() {
  if (!_normalizedCityMap) {
    _normalizedCityMap = new Map();
    for (const [, city] of CITIES) {
      const key = city.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s\-_]+/g, "");
      _normalizedCityMap.set(key, city);
    }
  }
  return _normalizedCityMap;
}

function resolveCity(input) {
  const key = input.toLowerCase().replace(/[\s\-_]+/g, "");
  if (CITIES.has(key)) return CITIES.get(key);

  const normalized = getNormalizedCityMap().get(key);
  if (normalized) return normalized;

  const list = [...CITIES.values()].map((c) => `  ${c.vanity.padEnd(20)} ${c.name} (${c.uf})`).join("\n");
  throw new Error(`Unknown city "${input}".\n\nSupported cities:\n${list}\n\nUse --list-cities to see all options.`);
}

/**
 * Builds the Facebook Marketplace search URL.
 *
 * @param {string} query - Search query.
 * @param {object} params - URL parameters.
 * @returns {string} The search URL.
 */
function buildUrl(query, { vanity, category }) {
  let path;
  if (category) {
    path = `/marketplace/${vanity}/${category}`;
  } else {
    path = `/marketplace/${vanity}/search`;
  }

  const params = new URLSearchParams();
  params.set("query", query);

  return `https://www.facebook.com${path}?${params.toString()}`;
}

/**
 * Standard browser-like headers for Facebook requests.
 */
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate",
  "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "max-age=0",
};

const BROWSER_HEADERS_ENTRIES = Object.entries(BROWSER_HEADERS);

async function fetchWithFetch(url, timeout) {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(timeout),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

async function fetchWithCurl(url, timeout) {
  const timeoutSec = Math.max(1, Math.ceil(timeout / 1000));
  const args = ["-sS", "-L", "--max-time", String(timeoutSec), "--compressed", "-w", "\n%{http_code}"];
  for (const [key, value] of BROWSER_HEADERS_ENTRIES) {
    args.push("-H", `${key}: ${value}`);
  }
  args.push(url);

  const { stdout } = await execFileAsync("curl", args, { maxBuffer: 10 * 1024 * 1024 });
  const lastNewline = stdout.lastIndexOf("\n");
  const statusCode = parseInt(stdout.slice(lastNewline + 1).trim(), 10);
  const body = stdout.slice(0, lastNewline);
  if (statusCode >= 400) throw new Error(`HTTP ${statusCode}`);
  return body;
}

async function fetchPage(url, timeout) {
  try {
    return await fetchWithFetch(url, timeout);
  } catch {
    return fetchWithCurl(url, timeout);
  }
}

/**
 * Extracts listing data from Facebook Marketplace HTML.
 * Searches for `<script data-sjs>` tags containing marketplace listing data
 * in Facebook's Relay store format.
 *
 * @param {string} html - Raw HTML string.
 * @returns {{listings: object[], endCursor: string|null, hasNextPage: boolean, lsd: string|null, queryId: string|null}|null}
 */
export function extractPageData(html) {
  const lsdMatch = html.match(/"LSD"[^}]*"token":"([^"]+)/);
  const lsd = lsdMatch ? lsdMatch[1] : null;

  const queryIdMatch = html.match(/CometMarketplaceSearchContentContainerQuery[^"]*"[^"]*"queryID":"(\d+)"/);
  const queryId = queryIdMatch ? queryIdMatch[1] : null;

  const sjsRegex = /<script[^>]*data-sjs[^>]*>(.+?)<\/script>/gs;
  let match;
  while ((match = sjsRegex.exec(html)) !== null) {
    const content = match[1];
    if (!content.includes("marketplace_listing_title")) continue;

    try {
      const data = JSON.parse(content);
      const searchResult = findMarketplaceSearch(data);
      if (searchResult && searchResult.feed_units?.edges?.length > 0) {
        const listings = searchResult.feed_units.edges.map((e) => e?.node?.listing).filter(Boolean);

        const pageInfo = searchResult.feed_units.page_info || {};

        return {
          listings,
          endCursor: pageInfo.end_cursor || null,
          hasNextPage: pageInfo.has_next_page || false,
          lsd,
          queryId,
          raw: searchResult,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Recursively searches an object tree for the `marketplace_search` data node.
 *
 * @param {any} obj - The object to search.
 * @returns {object|null} The marketplace_search object, or null.
 */
function findMarketplaceSearch(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (obj.marketplace_search) return obj.marketplace_search;

  const values = Array.isArray(obj) ? obj : Object.values(obj);
  for (const val of values) {
    const result = findMarketplaceSearch(val);
    if (result) return result;
  }

  return null;
}

/**
 * Fetches the next page of results using Facebook's GraphQL API.
 *
 * @param {object} params - Query parameters.
 * @returns {Promise<{listings: object[], endCursor: string|null, hasNextPage: boolean}|null>}
 */
async function fetchNextPage({ query, cursor, location, radius, category, minPrice, maxPrice, lsd, queryId, timeout }) {
  if (!lsd || !queryId) return null;

  const variables = {
    buyLocation: { latitude: location.lat, longitude: location.lng },
    contextual_data: null,
    count: 24,
    cursor,
    params: {
      bqf: { callsite: "COMMERCE_MKTPLACE_WWW", query },
      browse_request_params: {
        commerce_enable_local_pickup: true,
        commerce_enable_shipping: true,
        commerce_search_and_rp_available: true,
        commerce_search_and_rp_category_id: [],
        commerce_search_and_rp_condition: null,
        commerce_search_and_rp_ctime_days: null,
        filter_location_latitude: location.lat,
        filter_location_longitude: location.lng,
        filter_price_lower_bound: minPrice ? Math.round(minPrice * 100) : 0,
        filter_price_upper_bound: maxPrice ? Math.round(maxPrice * 100) : 214748364700,
        filter_radius_km: radius || 65,
      },
      custom_request_params: {
        browse_context: null,
        contextual_filters: [],
        referral_code: null,
        referral_ui_component: null,
        saved_search_strid: null,
        search_vertical: "C2C",
        seo_url: null,
        serp_landing_settings: { virtual_category_id: "" },
        surface: "SEARCH",
        virtual_contextual_filters: [],
      },
    },
    savedSearchID: null,
    savedSearchQuery: query,
    scale: 1,
    shouldIncludePopularSearches: false,
    topicPageParams: { location_id: location.vanity, url: null },
  };

  const body = new URLSearchParams();
  body.set("lsd", lsd);
  body.set("variables", JSON.stringify(variables));
  body.set("doc_id", queryId);

  try {
    const res = await fetch("https://www.facebook.com/api/graphql/", {
      method: "POST",
      headers: {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        Accept: "*/*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-FB-Friendly-Name": "CometMarketplaceSearchContentContainerQuery",
        "X-FB-LSD": lsd,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) return null;

    const text = await res.text();
    const data = JSON.parse(text);
    const searchData = findMarketplaceSearch(data?.data || data);

    if (!searchData?.feed_units?.edges) return null;

    const listings = searchData.feed_units.edges.map((e) => e?.node?.listing).filter(Boolean);
    const pageInfo = searchData.feed_units.page_info || {};

    return {
      listings,
      endCursor: pageInfo.end_cursor || null,
      hasNextPage: pageInfo.has_next_page || false,
    };
  } catch {
    return null;
  }
}

/**
 * Normalises a string for fuzzy matching.
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "ou", "em", "com", "para", "por", "um", "uma", "o", "a", "os", "as", "no", "na", "nos", "nas", "the", "and", "or", "for", "in", "of", "to", "with"]);

/**
 * Checks whether an item matches ALL significant terms in the search query.
 * @param {object} item
 * @param {string} query
 * @returns {boolean}
 */
function getQueryTokens(query) {
  return normalize(query)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function matchesTokens(item, tokens) {
  if (tokens.length === 0) return true;

  let corpus = normalize(item.title || "");
  if (item.description) corpus += " " + normalize(item.description);

  return tokens.every((token) => corpus.includes(token));
}

function matchesQuery(item, query) {
  return matchesTokens(item, getQueryTokens(query));
}

/**
 * Normalises a single raw Facebook Marketplace listing into a structured object.
 *
 * @param {object} listing - A raw listing from the Relay data.
 * @returns {object|null} Normalised item, or null if invalid.
 */
function parseListing(listing) {
  if (!listing) return null;

  const title = listing.marketplace_listing_title || "";
  if (!title) return null;

  const priceObj = listing.listing_price || {};
  const rawPrice = priceObj.amount ? parseFloat(priceObj.amount) : null;
  const price = rawPrice != null && !isNaN(rawPrice) ? rawPrice : null;
  const currency = priceObj.formatted_amount?.replace(/[\d.,\s]+/g, "").trim() || "BRL";

  const strikethrough = listing.strikethrough_price;
  const rawOldPrice = strikethrough?.amount ? parseFloat(strikethrough.amount) : null;
  const oldPrice = rawOldPrice != null && !isNaN(rawOldPrice) ? rawOldPrice : null;

  let discountPercent = null;
  if (oldPrice && price && oldPrice > price) {
    discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  const photo = listing.primary_listing_photo;
  const thumbnail = photo?.image?.uri || null;

  const loc = listing.location?.reverse_geocode;
  const city = loc?.city || null;
  const state = loc?.state || null;
  const location = city && state ? `${city}, ${state}` : city || state || null;

  const isSold = listing.is_sold || false;
  const isLive = listing.is_live !== false;
  const isPending = listing.is_pending || false;
  const isHidden = listing.is_hidden || false;

  if (isSold || isHidden || !isLive) return null;

  const deliveryTypes = listing.delivery_types || [];
  const hasShipping = deliveryTypes.includes("SHIPPING");

  const permalink = listing.id ? `https://www.facebook.com/marketplace/item/${listing.id}/` : "";

  const categoryId = listing.marketplace_listing_category_id || null;

  return {
    id: listing.id || null,
    title,
    price,
    currency,
    oldPrice,
    discountPercent,
    location,
    city,
    state,
    thumbnail,
    permalink,
    categoryId,
    deliveryTypes,
    hasShipping,
    isPending,
    description: null,
    images: null,
    sellerName: null,
    condition: null,
  };
}
