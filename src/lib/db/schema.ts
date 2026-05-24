import {
    pgTable,
    text,
    timestamp,
    integer,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
    name: text('name'),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    image: text('image'),
    hashedPassword: text('hashed_password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable(
    'accounts',
    {
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: text('type').notNull(),
        provider: text('provider').notNull(),
        providerAccountId: text('provider_account_id').notNull(),
        refresh_token: text('refresh_token'),
        access_token: text('access_token'),
        expires_at: integer('expires_at'),
        token_type: text('token_type'),
        scope: text('scope'),
        id_token: text('id_token'),
        session_state: text('session_state'),
    },
    (t) => [
        uniqueIndex('accounts_provider_idx').on(
            t.provider,
            t.providerAccountId
        ),
    ]
);

export const sessions = pgTable('sessions', {
    sessionToken: text('session_token').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable(
    'projects',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => createId()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        domain: text('domain').notNull(),
        publicKey: text('public_key')
            .notNull()
            .unique()
            .$defaultFn(() => createId()),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        index('projects_user_idx').on(t.userId),
        uniqueIndex('projects_domain_user_idx').on(t.userId, t.domain),
    ]
);

export const pageviews = pgTable(
    'pageviews',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => createId()),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        url: text('url').notNull(),
        referrer: text('referrer'),
        browser: text('browser'),
        os: text('os'),
        device: text('device'),
        country: text('country'),
        visitorHash: text('visitor_hash'),
        timestamp: timestamp('timestamp').defaultNow().notNull(),
    },
    (t) => [
        index('pageviews_project_time_idx').on(t.projectId, t.timestamp),
        index('pageviews_visitor_idx').on(t.visitorHash),
    ]
);

export const verificationTokens = pgTable(
    'verification_tokens',
    {
        identifier: text('identifier').notNull(),
        token: text('token').notNull(),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    (t) => [
        uniqueIndex('verification_tokens_identifier_token_idx').on(
            t.identifier,
            t.token
        ),
    ]
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Pageview = typeof pageviews.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type NewPageview = typeof pageviews.$inferInsert;
