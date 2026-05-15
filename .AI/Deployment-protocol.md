# Deployment Protocol

## Mission

Maintain production deployment integrity.

---

# Environment Rules

- use environment variables only
- never hardcode secrets
- maintain environment consistency

---

# Deployment Validation

Before deployment:
- run tests
- run linting
- validate builds
- validate migrations
- validate environment variables

---

# Rollback Safety

Every deployment must support rollback.

Never deploy:
- irreversible changes
- unverified migrations
- unsafe runtime configs

---

# Observability

Production must expose:
- logs
- health checks
- runtime visibility

without excessive complexity.