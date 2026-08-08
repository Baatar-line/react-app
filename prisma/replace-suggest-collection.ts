import { prisma } from '../lib/prisma';
import { destroyCloudinaryImages } from '../lib/cloudinary';

export interface SuggestItem {
  name: string;
  description: string;
  /** Where the card goes when clicked. Blank leaves it a plain tile. */
  link?: string;
  /** Absolute URL, or '' to fall back to the placeholder graphic. */
  image?: string;
}

/**
 * Swaps one suggest collection's entire card list for `items`.
 *
 * Destructive by design: every existing card in that collection is deleted
 * first, so re-running a seed is idempotent rather than additive. Other
 * collections are never touched.
 *
 * Shared by the per-collection seed scripts because the delete-then-insert
 * order, the Cloudinary cleanup and the reverse-insert trick below all have to
 * agree across them, and would drift if each script kept its own copy.
 */
export async function replaceSuggestCollection(collectionSlug: string, items: SuggestItem[]): Promise<void> {
  // Every suggest card needs an addedBy owner (the model requires it), and
  // these are editorial content rather than anyone's submission — so they go
  // under whichever admin account exists, same as if they'd been added from
  // the admin panel.
  const admin = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' }, select: { id: true } });
  if (!admin) throw new Error('No admin user found — run `bun run seed` first.');

  const existing = await prisma.suggestCard.findMany({
    where: { collectionSlug },
    select: { name: true, image: true },
  });
  if (existing.length) {
    await prisma.suggestCard.deleteMany({ where: { collectionSlug } });
    // Only previously uploaded covers are Cloudinary assets worth reclaiming;
    // destroyCloudinaryImages ignores anything that isn't one, so external
    // URLs a re-run would pass here are simply skipped.
    await destroyCloudinaryImages(existing.map((card) => card.image));
    console.log(`Removed ${existing.length}: ${existing.map((card) => card.name).join(' | ')}`);
  }

  // createdAt descending is how the page orders cards (see GET
  // /api/suggest-cards), so they go in reversed to make `items` read
  // top-to-bottom in the order it was written.
  for (const item of [...items].reverse()) {
    await prisma.suggestCard.create({
      data: {
        collectionSlug,
        name: item.name,
        description: item.description,
        link: item.link || undefined,
        image: item.image || undefined,
        addedBy: admin.id,
      },
    });
  }
  console.log(`Added ${items.length}: ${items.map((item) => item.name).join(' | ')}`);
}
