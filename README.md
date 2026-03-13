# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## More to complete

### High value:

1. ~~Custom tabs - Let users create their own token categories (e.g., "Animation", "Opacity", "Grid") with configurable value schemas. This would make the tool much more flexible.~~ ✅
2. ~~Persist state to localStorage - Right now everything resets on page reload. Auto-saving would be a huge UX win.~~ ✅
3. ~~Undo/Redo - Easy to accidentally delete something with no way back.~~ ✅


### Medium value:

4. Search/filter within tabs - Useful once token lists grow large.
5. Bulk edit - Select multiple tokens and change a property across all of them (e.g., change font family for all body styles).
6. Token references/aliases - Colors already support {primitives.blue.600} syntax; extending this to other tabs would be powerful.
7. Duplicate row/group - Quick way to create variations.

### Nice to have:

8. Dark/light theme toggle for the tool itself
9. Export to CSS variables / Tailwind config in addition to DTCG JSON
10. Drag-and-drop reorder for groups, not just rows
