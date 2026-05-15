# Security Protocol

## Mission

Every feature must pass security review.

---

# Authentication

Verify:
- session integrity
- token expiration
- authorization boundaries

---

# Input Validation

All external input must be:
- validated
- sanitized
- type-safe

Never trust client input.

---

# Secrets

Forbidden:
- hardcoded secrets
- exposed API keys
- credentials in repositories

Use environment variables only.

---

# Database Safety

Prevent:
- SQL injection
- unsafe queries
- unrestricted access

Use parameterized queries.

---

# API Security

Verify:
- auth middleware
- permission checks
- secure error responses

Never expose internal stack traces.

---

# Dependency Safety

Avoid:
- deprecated packages
- vulnerable dependencies
- abandoned libraries