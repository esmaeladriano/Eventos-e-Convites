---
name: OpenAPI integer compatibility
description: Orval's generated Zod client currently targets Zod 3 and cannot emit zod.int().
---

Use numeric OpenAPI fields instead of integer fields when generating this workspace's Zod client, unless the generator configuration is upgraded in lockstep.

**Why:** The current codegen completed but the generated library failed typechecking on `zod.int()`.

**How to apply:** Prefer `type: number` plus minimum/maximum validation in the shared OpenAPI contract for counts and capacities.