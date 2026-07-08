// Robust clipboard copy that also works over plain HTTP / LAN IPs.
//
// navigator.clipboard is only available in a "secure context" (HTTPS or
// localhost). When Wisp is opened over a LAN address like http://192.168.x.x,
// that API is missing or throws, so we fall back to the legacy execCommand copy.
export async function copyText(text: string): Promise<boolean> {
  // Preferred path: async Clipboard API (secure contexts).
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fall through to legacy path */
    }
  }

  // Legacy fallback: a hidden textarea + document.execCommand("copy").
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.top = "0"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
