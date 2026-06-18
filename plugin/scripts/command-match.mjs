const FORCE_PUSH_RE = /\bgit\b(?:(?![\n\r;&|]).)*?\bpush\b(?:(?![\n\r;&|]).)*?(?:--force(?:-with-lease)?(?:=\S+)?|-f)(?=$|[\s"'`;&|])/i;

function isForcePushNeedle(needle) {
  const n = String(needle || "").toLowerCase().trim();
  return /\bpush\b/.test(n) && (n.includes("--force") || /\s-f(?:\s|$)/.test(` ${n} `) || n.includes("force push"));
}

export function matchesForbiddenCommand(text, forbiddenCommand) {
  const command = String(forbiddenCommand || "").toLowerCase().trim();
  if (!command) return false;
  if (isForcePushNeedle(command)) return FORCE_PUSH_RE.test(String(text || ""));
  return String(text || "").toLowerCase().includes(command);
}
