# Session: ruledoctor skill scripts + bootstrap

**Goal:** Add `skills/ruledoctor/scripts/`, bootstrap hooks, rules-anchor, reinject/guard updates.

**Status:** Done.

**Files:** skills/ruledoctor/scripts/*, rules-anchor.md; updated scripts/reinject-rules.mjs, rule-guard.mjs.

**Verify:** rule-guard denies `git push --force` without .ruledoctor.json; bootstrap runs OK.
