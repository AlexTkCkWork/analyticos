const encoder = new TextEncoder();

export const generateVisitorHash = async (params: {
    ip: string;
    userAgent: string;
    projectId: string;
    date?: string;
}): Promise<string> => {
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
        throw new Error(
            'AUTH_SECRET is not set — refusing to generate unsalted visitor hashes'
        );
    }

    const date = params.date ?? new Date().toISOString().slice(0, 10);
    const raw = `${params.ip}:${params.userAgent}:${params.projectId}:${date}:${date}`;

    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(raw));

    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};
