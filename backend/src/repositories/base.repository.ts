import { db } from '../database';
import type { QueryResultRow } from 'pg';

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected constructor(protected readonly tableName: string) {
    if (!tableName) {
      throw new Error('Repository requires a table name.');
    }
  }

  protected get selectColumns(): string {
    return '*';
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.query<QueryResultRow>(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  abstract findById(id: number): Promise<T | null>;
  abstract create(input: CreateInput): Promise<T>;
  abstract update(id: number, input: UpdateInput): Promise<T>;
}
