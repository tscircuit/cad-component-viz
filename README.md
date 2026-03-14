# cad-component-viz

React/Vite viewer for inspecting Circuit JSON `cad_component` placement and board-normal behavior.

## Run

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## What it does

- Paste a `cad_component` JSON payload into the editor.
- View the raw model in model space, with its declared board normal shown explicitly.
- View the transformed placement in board space, where board-up is always `z+`.
- Fall back to a simple box from `model_bounds` when an OBJ URL is missing or unavailable.
