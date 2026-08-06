import { Kysely } from 'kysely'
import { LibSQLDialect } from 'kysely-turso/libsql'
import turso from '@/lib/turso'
import type { Database } from './schema'

export const db = new Kysely<Database>({
  dialect: new LibSQLDialect({ client: turso }),
})

export type { Database } from './schema'
