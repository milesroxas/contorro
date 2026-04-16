# shadcn/ui: variants over call-site overrides

Repo source of truth: root **`AGENTS.md`** → section **shadcn/ui** and **No ad-hoc visual overrides at call sites**.

## For agents

- Use shadcn primitives with **`variant` / `size` / documented props** only unless the user explicitly asks for a `className` exception or there is an unavoidable constraint.
- Do **not** add feature-level `className` on `Button`, `Item`, `Card`, etc. to change radius, border, background, or spacing — that creates **design drift** between screens.
- If a new appearance is required, extend **CVA variants** in the owning **`components/ui/*`** file (or a thin wrapper), so the look is **named and centralized**.

Package ownership: Studio UI `packages/presentation/studio/components.json`; CMS app UI `apps/cms` when applicable.
