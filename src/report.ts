import pc from "picocolors";
import type {
  ComplianceResult,
  ReadRateResult,
  Report,
  ReportRow,
  Rule,
  Status,
} from "./types.js";

/** Assemble rows + headline numbers from the two passes. */
export function buildReport(
  rules: Rule[],
  read: ReadRateResult[],
  compliance: ComplianceResult[],
  notes: string[],
): Report {
  const readById = new Map(read.map((r) => [r.ruleId, r]));
  const compById = new Map(compliance.map((c) => [c.ruleId, c]));

  const rows: ReportRow[] = rules.map((r) => ({
    rule: r,
    read: readById.get(r.id) ?? { ruleId: r.id, confidence: 0, present: false, matched: 0, total: 0 },
    compliance: compById.get(r.id) ?? { ruleId: r.id, status: "unknown", detail: "no checker", checkType: null },
  }));

  const totalRules = rules.length;
  const presentRules = rows.filter((r) => r.read.present).length;
  const checked = rows.filter((r) => r.compliance.status !== "unknown");
  const passed = checked.filter((r) => r.compliance.status === "pass");
  const checkedRules = checked.length;
  const passedChecks = passed.length;

  const readRatePct = totalRules ? Math.round((presentRules / totalRules) * 100) : 0;
  // compliance over checked rules only; no checks => neutral 100 (won't drag score)
  const compliancePct = checkedRules ? Math.round((passedChecks / checkedRules) * 100) : 100;

  const score = Math.round(readRatePct * 0.4 + compliancePct * 0.6);

  return { score, readRatePct, compliancePct, totalRules, presentRules, checkedRules, passedChecks, rows, notes };
}

export type Lamp = "g" | "y" | "r";

/** The promo's three-state lamp, derived from read + compliance. */
export function lampOf(row: ReportRow): Lamp {
  if (row.compliance.status === "fail") return "r";
  if (!row.read.present) return "r";
  if (row.compliance.status === "pass") return "g";
  return "y"; // present but unmeasured
}

function lampChar(l: Lamp): string {
  return l === "g" ? pc.green("●") : l === "y" ? pc.yellow("●") : pc.red("●");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Colored terminal report. */
export function renderTerminal(rep: Report): string {
  const grade = rep.score >= 80 ? "良好" : rep.score >= 50 ? "一般" : "不及格 ⚠";
  const scoreColor = rep.score >= 80 ? pc.green : rep.score >= 50 ? pc.yellow : pc.red;

  const lines: string[] = [];
  lines.push("");
  lines.push(pc.bold("  RuleDoctor · 规则体检"));
  lines.push(
    `  ${scoreColor(pc.bold(`${rep.score}/100`))}  ${scoreColor(grade)}    ` +
      pc.dim(`读到率 ${rep.readRatePct}%  ·  遵守率 ${rep.compliancePct}%  ·  检查 ${rep.checkedRules}/${rep.totalRules}`),
  );
  lines.push(pc.dim("  " + "─".repeat(64)));

  for (const row of rep.rows) {
    const l = lampChar(lampOf(row));
    const rid = pc.dim(row.rule.id.padEnd(3));
    const text = truncate(row.rule.text, 42).padEnd(44);
    const readPct = Math.round(row.read.confidence * 100);
    const readStr = (row.read.total === 0 ? pc.dim("  n/a") : pc.cyan(`${String(readPct).padStart(3)}%`));
    const compStr = formatCompliance(row.compliance.status);
    lines.push(`  ${l} ${rid} ${text} 读到 ${readStr}   ${compStr}`);
  }

  lines.push(pc.dim("  " + "─".repeat(64)));
  // detail lines for failures
  const fails = rep.rows.filter((r) => r.compliance.status === "fail");
  if (fails.length) {
    lines.push(pc.red(pc.bold("  违规详情:")));
    for (const f of fails) lines.push(`    ${pc.red("✗")} ${f.rule.id}  ${pc.dim(truncate(f.compliance.detail, 70))}`);
  }
  const missing = rep.rows.filter((r) => !r.read.present && r.read.total > 0);
  if (missing.length) {
    lines.push(pc.red(pc.bold("  未进入上下文的规则:")));
    for (const m of missing) lines.push(`    ${pc.red("✗")} ${m.rule.id}  ${pc.dim(truncate(m.rule.text, 60))}`);
  }
  for (const n of rep.notes) lines.push(pc.dim(`  ${n}`));
  lines.push("");
  return lines.join("\n");
}

function formatCompliance(s: Status): string {
  if (s === "pass") return pc.green("✓");
  if (s === "fail") return pc.red("✗");
  return pc.dim("—");
}

/** Pretty JSON (stable key order). */
export function renderJSON(rep: Report): string {
  return JSON.stringify(rep, null, 2);
}

/** Standalone branded HTML report — same look as the promo dashboard. */
export function renderHTML(rep: Report): string {
  const rows = rep.rows
    .map((row) => {
      const l = lampOf(row);
      const readPct = row.read.total === 0 ? "n/a" : Math.round(row.read.confidence * 100) + "%";
      const comp = row.compliance.status === "pass" ? "✓" : row.compliance.status === "fail" ? "✗" : "—";
      const compColor = row.compliance.status === "pass" ? "#30D158" : row.compliance.status === "fail" ? "#FF453A" : "#6B7790";
      const readColor = readPct === "n/a" ? "#6B7790" : row.read.present ? "#30D158" : "#FF453A";
      return `<tr>
        <td><span class="ln"><span class="lamp ${l}"></span><code>${esc(row.rule.id)}</code> ${esc(truncate(row.rule.text, 46))}</span></td>
        <td style="color:${readColor}">${readPct}</td>
        <td class="r" style="color:${compColor};font-weight:800">${comp}</td>
      </tr>`;
    })
    .join("\n");

  const scoreColor = rep.score >= 80 ? "#30D158" : rep.score >= 50 ? "#FFD60A" : "#FF453A";
  const grade = rep.score >= 80 ? "良好" : rep.score >= 50 ? "一般" : "不及格 ⚠️";

  return `<!DOCTYPE html>
<html lang="zh"><head><meta charset="UTF-8"><title>RuleDoctor 体检报告</title>
<style>
  :root{--bg:#0B0E14;--card:#161C2B;--line:#263049;--muted:#9AA7BD;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",Arial,sans-serif;background:var(--bg);color:#fff;padding:48px;}
  .wrap{max-width:920px;margin:0 auto;}
  .head{display:flex;align-items:center;gap:18px;margin-bottom:28px;}
  .logo{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#5E5CE6,#FF2D55);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;}
  h1{font-size:30px;font-weight:900;} .head .sub{color:var(--muted);font-size:18px;}
  .score{display:flex;align-items:center;gap:30px;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:28px 32px;margin-bottom:24px;}
  .ring{width:120px;height:120px;border-radius:50%;background:conic-gradient(${scoreColor} 0 ${rep.score}%, #2A3350 ${rep.score}% 100%);display:flex;align-items:center;justify-content:center;}
  .ring .in{width:94px;height:94px;border-radius:50%;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .ring .n{font-size:42px;font-weight:900;color:${scoreColor};} .ring .u{font-size:14px;color:var(--muted);}
  .score .meta .t{font-size:26px;font-weight:900;margin-bottom:6px;} .score .meta .d{font-size:16px;color:var(--muted);}
  .stats{display:flex;gap:14px;margin-bottom:20px;} .stat{flex:1;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;}
  .stat .k{color:var(--muted);font-size:14px;} .stat .v{font-size:24px;font-weight:900;margin-top:4px;}
  table{width:100%;border-collapse:separate;border-spacing:0 8px;}
  th{color:#6B7790;text-align:left;font-size:13px;font-weight:600;padding:0 14px;}
  th.r,td.r{text-align:right;} td{background:var(--card);padding:14px;font-size:16px;}
  td:first-child{border-radius:12px 0 0 12px;} td:last-child{border-radius:0 12px 12px 0;}
  .ln{display:flex;align-items:center;gap:12px;} .ln code{font-family:"SF Mono",Menlo,monospace;color:#9AA7BD;font-size:13px;}
  .lamp{width:14px;height:14px;border-radius:50%;display:inline-block;flex:none;}
  .lamp.g{background:#30D158;box-shadow:0 0 12px #30D158;} .lamp.y{background:#FFD60A;box-shadow:0 0 12px #FFD60A;} .lamp.r{background:#FF453A;box-shadow:0 0 12px #FF453A;}
  .foot{margin-top:24px;color:#6B7790;font-size:14px;}
</style></head>
<body><div class="wrap">
  <div class="head"><div class="logo">R</div><div><h1>RuleDoctor · 规则体检报告</h1><div class="sub">读到率 = 规则是否进入了模型上下文 · 遵守率 = 是否被实际遵守</div></div></div>
  <div class="score"><div class="ring"><div class="in"><div class="n">${rep.score}</div><div class="u">/ 100</div></div></div>
    <div class="meta"><div class="t">${grade}</div><div class="d">${rep.totalRules} 条规则 · ${rep.presentRules} 条进入上下文 · ${rep.passedChecks}/${rep.checkedRules} 项检查通过</div></div></div>
  <div class="stats">
    <div class="stat"><div class="k">读到率</div><div class="v" style="color:${rep.readRatePct>=50?'#30D158':'#FF453A'}">${rep.readRatePct}%</div></div>
    <div class="stat"><div class="k">遵守率</div><div class="v" style="color:${rep.compliancePct>=50?'#30D158':'#FF453A'}">${rep.compliancePct}%</div></div>
    <div class="stat"><div class="k">已检查</div><div class="v">${rep.checkedRules}/${rep.totalRules}</div></div>
  </div>
  <table><tr><th>规则</th><th>读到</th><th class="r">遵守</th></tr>${rows}</table>
  <div class="foot">Generated by RuleDoctor · 规则体检 · <a style="color:#5E5CE6" href="https://github.com/ruledoctor/ruledoctor">github.com/ruledoctor/ruledoctor</a></div>
</div></body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
