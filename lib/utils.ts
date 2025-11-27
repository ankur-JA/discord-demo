// Simple idempotency check helper
export function sanitizeContent(content: string) {
    // Basic sanitization
    return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

