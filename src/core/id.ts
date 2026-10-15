import { randomUUID } from 'expo-crypto';

/** Every primary key in the app is a UUID v4 string. */
export function newId(): string {
  return randomUUID();
}
