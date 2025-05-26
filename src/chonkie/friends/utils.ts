/** Utility functions for Chonkie's Handshakes. */

const ADJECTIVES = [
  "happy", "chonky", "splashy", "munchy", "muddy", "groovy", "bubbly",
  "swift", "lazy", "hungry", "glowing", "radiant", "mighty", "gentle",
  "whimsical", "snug", "plump", "jovial", "sleepy", "sunny", "peppy",
  "breezy", "sneaky", "clever", "peaceful", "dreamy",
];

const VERBS = [
  "chomping", "splashing", "munching", "wading", "floating", "drifting", "chunking",
  "slicing", "dancing", "wandering", "sleeping", "dreaming", "gliding", "swimming",
  "bubbling", "giggling", "jumping", "diving", "hopping", "skipping", "trotting", "sneaking",
  "exploring", "nibbling", "resting",
];

const NOUNS = [
  "hippo", "river", "chunk", "lilypad", "mudbath", "stream", "pod", "chomp",
  "byte", "fragment", "slice", "splash", "nugget", "lagoon", "marsh",
  "pebble", "ripple", "cluster", "patch", "parcel", "meadow", "glade",
  "puddle", "nook", "bite", "whisper", "journey", "haven", "buddy", "pal",
  "snack", "secret"
];

/**
 * Generate a random, fun, 3-part Chonkie-themed name (Adj-Verb-Noun).
 * 
 * Combines one random adjective, one random verb, and one random noun from
 * predefined lists, joined by a separator.
 * 
 * @param sep - The separator to use between the words. Defaults to "-".
 * @returns A randomly generated collection name string (e.g., "happy-splashes-hippo").
 */
export function generateRandomCollectionName(sep: string = "-"): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  return `${adjective}${sep}${verb}${sep}${noun}`;
}