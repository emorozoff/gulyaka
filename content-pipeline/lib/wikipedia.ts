/**
 * Wikipedia REST + Action API helpers.
 *
 * For each POI we want a clean plain-text extract — short enough to fit a
 * Claude prompt comfortably, long enough to capture the building's history.
 */

const MAX_EXTRACT_CHARS = 5000;

type WikiTitle = { lang: "ru" | "en"; title: string };

export async function fetchExtract({
  lang,
  title,
}: WikiTitle): Promise<string | undefined> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "extracts",
    exlimit: "1",
    explaintext: "1",
    redirects: "1",
    titles: title,
  });

  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
    headers: {
      "User-Agent":
        "Gulyaka/0.1 (content pipeline; https://github.com/emorozoff/gulyaka)",
    },
  });
  if (!res.ok) return undefined;

  const json = (await res.json()) as {
    query?: { pages?: Array<{ extract?: string; missing?: boolean }> };
  };
  const page = json.query?.pages?.[0];
  if (!page || page.missing || !page.extract) return undefined;

  let extract = page.extract.trim();
  if (extract.length > MAX_EXTRACT_CHARS) {
    extract = extract.slice(0, MAX_EXTRACT_CHARS) + "\n\n[...обрезано...]";
  }
  return extract;
}
