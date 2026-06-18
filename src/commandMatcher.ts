const FORCE_PUSH_RE = /\bgit\b(?:(?![\n\r;&|]).)*?\bpush\b(?:(?![\n\r;&|]).)*?(?:--force(?:-with-lease)?(?:=\S+)?|-f)(?=$|[\s"'`;&|])/i;

function isForcePushNeedle(needle: string): boolean {
  const n = needle.toLowerCase().trim();
  return /\bpush\b/.test(n) && (n.includes("--force") || /\s-f(?:\s|$)/.test(` ${n} `) || n.includes("force push"));
}

export function matchesForbiddenCommand(text: string, forbiddenCommand: string): boolean {
  const command = forbiddenCommand.toLowerCase().trim();
  if (!command) return false;
  if (isForcePushNeedle(command)) return FORCE_PUSH_RE.test(text);
  return text.toLowerCase().includes(command);
}
