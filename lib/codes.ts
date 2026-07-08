// Client helpers for the code-reservation API. All are best-effort: if the
// network or database is down, we never block the user — connection uniqueness
// still falls back to the in-memory room cap (max 2 peers per code).

export interface ReserveResult {
  ok: boolean
  taken: boolean
}

// Try to reserve a code for hosting. `taken` means someone else holds it.
export async function reserveCode(code: string): Promise<ReserveResult> {
  try {
    const res = await fetch("/api/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    if (res.status === 409) return { ok: false, taken: true }
    const data = await res.json().catch(() => ({}))
    return { ok: data.ok !== false, taken: false }
  } catch {
    return { ok: true, taken: false }
  }
}

// Release a code we reserved. Fire-and-forget, survives tab close via keepalive.
export function releaseCode(code: string): void {
  try {
    void fetch("/api/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action: "release" }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}
