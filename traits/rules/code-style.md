---
applyTo: "**"
---

# Code Style Standards

All files in this project follow these formatting rules, enforced via ESLint and Prettier.

## Formatting

- **Indentation**: 2 spaces — no tabs
- **Line width**: 132 characters maximum
- **Quotes**: Double quotes for strings
- **Trailing commas**: ES5 style (objects and arrays)
- **Arrow parens**: Always include parentheses
- **Line endings**: LF (Unix)

## Language

- Modern JavaScript (ESNext) — **not TypeScript**
- ES Modules (`import`/`export`) — no CommonJS `require`
- ES6 classes with `#` prefix for private members
- JSDoc required on all functions, classes, and methods

## Naming Conventions

- **Variables and instances**: camelCase
- **Classes**: PascalCase — filename must match class name (e.g., `MyClass.js` exports `MyClass`)
- **Files**: kebab-case for non-class files; PascalCase for class files

## After Every Edit

Run `npm run lint` and fix all reported errors before considering the task complete. VS Code formats on save — trigger a save to auto-format.
