import type { Db } from '../types';

export interface Migration {
  /** Sequential, starting at 1. Never reuse or reorder. */
  version: number;
  name: string;
  up(db: Db): Promise<void>;
}
