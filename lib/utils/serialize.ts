/**
 * Converts TypeORM entity instances (class objects) to plain objects
 * that can safely be passed from Server Components to Client Components.
 *
 * Next.js RSC serialization only supports plain objects, not class instances.
 */
export function toPlain<T>(entity: T): T {
  return JSON.parse(JSON.stringify(entity))
}

export function toPlainArray<T>(entities: T[]): T[] {
  return JSON.parse(JSON.stringify(entities))
}
