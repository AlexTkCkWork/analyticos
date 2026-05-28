import { describe, it, expect } from 'vitest';
import {
    LoginSchema,
    RegisterSchema,
    CreateProjectSchema,
    DeleteProjectSchema,
    PageviewEventSchema,
    DashboardFiltersSchema,
} from './validations';

describe('LoginSchema', () => {
    it('accepts valid email + password', () => {
        const r = LoginSchema.safeParse({
            email: 'user@example.com',
            password: 'something',
        });
        expect(r.success).toBe(true);
    });

    it('lowercases the email (transform)', () => {
        const r = LoginSchema.safeParse({
            email: 'User@Example.COM',
            password: 'something',
        });
        expect(r.success).toBe(true);
        if (r.success) expect(r.data.email).toBe('user@example.com');
    });

    it('rejects invalid email format', () => {
        const r = LoginSchema.safeParse({
            email: 'not-an-email',
            password: 'something',
        });
        expect(r.success).toBe(false);
    });

    it('rejects empty password', () => {
        const r = LoginSchema.safeParse({
            email: 'user@example.com',
            password: '',
        });
        expect(r.success).toBe(false);
    });
});

describe('RegisterSchema', () => {
    const valid = {
        email: 'user@example.com',
        password: 'longenough',
        confirmPassword: 'longenough',
    };

    it('accepts a valid registration', () => {
        expect(RegisterSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
        const r = RegisterSchema.safeParse({
            ...valid,
            password: 'short',
            confirmPassword: 'short',
        });
        expect(r.success).toBe(false);
    });

    it('rejects when confirmPassword does not match', () => {
        const r = RegisterSchema.safeParse({
            ...valid,
            confirmPassword: 'different',
        });
        expect(r.success).toBe(false);
    });

    it('reports the mismatch error against the confirmPassword field', () => {
        const r = RegisterSchema.safeParse({
            ...valid,
            confirmPassword: 'different',
        });
        expect(r.success).toBe(false);
        if (!r.success) {
            const fieldPaths = r.error.issues.map((i) => i.path.join('.'));
            expect(fieldPaths).toContain('confirmPassword');
        }
    });
});

describe('CreateProjectSchema', () => {
    it('accepts a valid project', () => {
        const r = CreateProjectSchema.safeParse({
            name: 'My Site',
            domain: 'example.com',
        });
        expect(r.success).toBe(true);
    });

    it('accepts subdomains and hyphenated names', () => {
        const r = CreateProjectSchema.safeParse({
            name: 'X',
            domain: 'blog.my-site.co.uk',
        });
        expect(r.success).toBe(true);
    });

    it('rejects an empty name', () => {
        const r = CreateProjectSchema.safeParse({
            name: '',
            domain: 'example.com',
        });
        expect(r.success).toBe(false);
    });

    it('rejects a name over 50 characters', () => {
        const r = CreateProjectSchema.safeParse({
            name: 'x'.repeat(51),
            domain: 'example.com',
        });
        expect(r.success).toBe(false);
    });

    it('rejects a domain with a protocol prefix', () => {
        const r = CreateProjectSchema.safeParse({
            name: 'X',
            domain: 'https://example.com',
        });
        expect(r.success).toBe(false);
    });

    it('rejects a domain with a path', () => {
        const r = CreateProjectSchema.safeParse({
            name: 'X',
            domain: 'example.com/about',
        });
        expect(r.success).toBe(false);
    });

    it('rejects single-word domains (no TLD)', () => {
        const r = CreateProjectSchema.safeParse({
            name: 'X',
            domain: 'localhost',
        });
        expect(r.success).toBe(false);
    });
});

describe('DeleteProjectSchema', () => {
    it('accepts valid input', () => {
        const r = DeleteProjectSchema.safeParse({
            projectId: 'abc123',
            confirmation: 'example.com',
        });
        expect(r.success).toBe(true);
    });

    it('rejects missing projectId', () => {
        const r = DeleteProjectSchema.safeParse({
            projectId: '',
            confirmation: 'example.com',
        });
        expect(r.success).toBe(false);
    });

    it('rejects empty confirmation', () => {
        const r = DeleteProjectSchema.safeParse({
            projectId: 'abc123',
            confirmation: '',
        });
        expect(r.success).toBe(false);
    });
});

describe('PageviewEventSchema', () => {
    it('accepts a valid payload', () => {
        const r = PageviewEventSchema.safeParse({
            key: 'pub_abc',
            url: 'https://example.com/about',
            referrer: 'https://google.com',
        });
        expect(r.success).toBe(true);
    });

    it('rejects a missing key', () => {
        const r = PageviewEventSchema.safeParse({
            url: 'https://example.com/about',
        });
        expect(r.success).toBe(false);
    });

    it('rejects a malformed URL', () => {
        const r = PageviewEventSchema.safeParse({
            key: 'pub_abc',
            url: 'not-a-url',
        });
        expect(r.success).toBe(false);
    });

    it('defaults referrer to empty string when omitted', () => {
        const r = PageviewEventSchema.safeParse({
            key: 'pub_abc',
            url: 'https://example.com/about',
        });
        expect(r.success).toBe(true);
        if (r.success) expect(r.data.referrer).toBe('');
    });
});

describe('DashboardFiltersSchema', () => {
    it('accepts a valid date range', () => {
        const r = DashboardFiltersSchema.safeParse({
            from: '2026-05-01',
            to: '2026-05-10',
        });
        expect(r.success).toBe(true);
    });

    it('coerces date strings to Date objects', () => {
        const r = DashboardFiltersSchema.safeParse({
            from: '2026-05-01',
            to: '2026-05-10',
        });
        expect(r.success).toBe(true);
        if (r.success) {
            expect(r.data.from).toBeInstanceOf(Date);
            expect(r.data.to).toBeInstanceOf(Date);
        }
    });

    it('rejects when from > to (refine)', () => {
        const r = DashboardFiltersSchema.safeParse({
            from: '2026-05-10',
            to: '2026-05-01',
        });
        expect(r.success).toBe(false);
    });

    it('accepts optional filter fields', () => {
        const r = DashboardFiltersSchema.safeParse({
            from: '2026-05-01',
            to: '2026-05-10',
            browser: 'Chrome',
            device: 'mobile',
        });
        expect(r.success).toBe(true);
    });

    it('rejects country code of wrong length (must be ISO 2-char)', () => {
        const r = DashboardFiltersSchema.safeParse({
            from: '2026-05-01',
            to: '2026-05-10',
            country: 'USA',
        });
        expect(r.success).toBe(false);
    });

    it('rejects invalid device enum value', () => {
        const r = DashboardFiltersSchema.safeParse({
            from: '2026-05-01',
            to: '2026-05-10',
            device: 'laptop',
        });
        expect(r.success).toBe(false);
    });
});
