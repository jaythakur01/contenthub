/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug uniqueness by appending a number if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  tableName: string,
  checkExistence: (slug: string) => Promise<boolean>,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 0;

  while (await checkExistence(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}
