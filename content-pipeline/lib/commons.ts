/**
 * Wikimedia Commons helpers.
 *
 * For a given filename ("Some Image.jpg") we want both a high-quality
 * display URL and a thumbnail URL. The Commons API can resolve both with
 * a single `imageinfo` call — but for our pipeline (pure URL construction)
 * the `Special:FilePath` redirect endpoint is faster and doesn't require
 * an extra API call. It supports a `width=` query parameter for thumbs.
 */

const COMMONS_BASE = "https://commons.wikimedia.org/wiki/Special:FilePath";

export type CommonsImage = {
  filename: string;
  url: string;
  thumb_url: string;
};

export function buildCommonsUrls(
  filename: string,
  thumbWidth = 800,
): CommonsImage {
  const encoded = encodeURIComponent(filename.replaceAll(" ", "_"));
  return {
    filename,
    url: `${COMMONS_BASE}/${encoded}`,
    thumb_url: `${COMMONS_BASE}/${encoded}?width=${thumbWidth}`,
  };
}
