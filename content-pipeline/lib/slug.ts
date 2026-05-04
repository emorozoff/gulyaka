/**
 * Russian → URL-safe slug. Falls back to OSM id if name is empty.
 */

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  const lowered = input.toLowerCase().trim();
  let out = "";
  for (const char of lowered) {
    if (char in TRANSLIT) out += TRANSLIT[char];
    else if (/[a-z0-9]/.test(char)) out += char;
    else if (/[\s\-_/.,]/.test(char)) out += "-";
  }
  return out
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
