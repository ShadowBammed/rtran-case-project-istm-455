# Trivy Security Scan Report

## Scan Details

| Field | Value |
|---|---|
| Tool | Trivy v0.70.0 |
| Scan command | `trivy fs --scanners vuln,secret,misconfig contacts-book/` |
| Scanners enabled | Vulnerabilities, Secrets, Misconfigurations |
| Date | 2026-05-01 |

---

## Summary of Initial Findings

| Target | Type | Vulnerabilities | Secrets | Misconfigurations |
|---|---|---|---|---|
| `package-lock.json` | npm | 0 | — | — |
| `Dockerfile` | dockerfile | — | — | 2 |
| `certs/key.pem` | text | — | 1 | — |
| `certs/server.pem` | text | — | 1 | — |

---

## Finding 1 — DS-0002 (HIGH): No non-root USER in Dockerfile

**Category:** Misconfiguration  
**Severity:** HIGH  
**File:** `Dockerfile`

**Description:**  
The Dockerfile had no `USER` instruction, so the container process ran as `root` by default. If an attacker exploits the application and escapes the container, they land as root on the host, dramatically increasing the blast radius of a breach.

**Fix applied:**  
Added a dedicated non-root system user and switched to it before the entry point:

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

**Result:** Trivy reports 0 misconfigurations on the updated Dockerfile.

---

## Finding 2 — DS-0026 (LOW): No HEALTHCHECK instruction in Dockerfile

**Category:** Misconfiguration  
**Severity:** LOW  
**File:** `Dockerfile`

**Description:**  
The Dockerfile had no `HEALTHCHECK` instruction. Without one, Docker (and orchestrators like Kubernetes) have no way to detect whether the running container is actually healthy. A crashed or hung process would continue to receive traffic.

**Fix applied:**  
Added a `HEALTHCHECK` that polls the `/health` endpoint:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --no-check-certificate https://localhost:3443/health || exit 1
```

**Result:** Trivy reports 0 misconfigurations on the updated Dockerfile.

---

## Finding 3 — AsymmetricPrivateKey (HIGH): Private key in `certs/key.pem`

**Category:** Secret  
**Severity:** HIGH  
**File:** `certs/key.pem` (lines 2–51)

**Description:**  
Trivy detected a private RSA key stored on disk. If this file were accidentally committed to version control or included in a container image, the TLS private key would be exposed, allowing an attacker to decrypt traffic or impersonate the server.

**Status / Action taken:**  
This file is intentional — it is the locally generated self-signed certificate key for development use only. It is already listed in [`.gitignore`](.gitignore) (`certs/key.pem`) and was never staged or committed to the repository. The Dockerfile also does not `COPY certs/` into the image.

In a production environment this key would be injected at runtime via a secrets manager (e.g. AWS Secrets Manager, HashiCorp Vault, or a Kubernetes Secret) rather than stored on disk.

---

## Finding 4 — AsymmetricPrivateKey (HIGH): Private key in `certs/server.pem`

**Category:** Secret  
**Severity:** HIGH  
**File:** `certs/server.pem` (lines 2–51)

**Description:**  
`server.pem` is a combined PEM file produced by concatenating `key.pem` and `cert.pem`. Trivy correctly flagged it because it contains the same private key material. The risk is identical to Finding 3.

**Status / Action taken:**  
Same as Finding 3 — the file is git-ignored, never committed, and excluded from the Docker image. The `gen-cert.sh` script that produces this file is documented in the README as a local setup step only.

---

## Observations and Takeaways

1. **Zero CVEs in npm dependencies.** All production and dev packages in `package-lock.json` were clean at the time of the scan, which reflects the benefit of using actively maintained, minimal dependencies.

2. **Dockerfile hardening is easy to miss.** The two Dockerfile findings (root user, missing healthcheck) are extremely common defaults that most developers overlook. Running Trivy as part of a CI pipeline catches these before they reach production.

3. **Trivy correctly flagged self-signed cert material.** Even though the private key is intentional here, the finding is valid — it demonstrates exactly the kind of accidental commit Trivy is designed to prevent. The `.gitignore` safeguard is essential.

4. **Secrets scanning works on generated files too.** Trivy does not care whether a file was checked in; it scans what is present on disk. This is useful during local development to catch mistakes before a `git add`.

5. **AI-assisted remediation was straightforward.** Both Dockerfile issues were resolved in a single edit by adding a non-root user and a `HEALTHCHECK` instruction. Re-running `trivy config Dockerfile` immediately confirmed 0 remaining misconfigurations.
