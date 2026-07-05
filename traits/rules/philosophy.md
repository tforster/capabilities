# tforster Copilot Instructions

## 1. Core Engineering Philosophy
- **Minimalism & Zero-Dependency Bias:** Reject bloaty frameworks and heavy npm libraries. Prefer hand-rolling small, purpose-built utilities (e.g., custom HTML minifiers, Glob parsers, Tar extractors) over importing massive third-party packages.
- **Native First:** Rely on native web standards and WinterCG-compliant APIs. Prefer Web APIs (like `ReadableStream`, `TransformStream`) over Node.js-specific built-ins whenever possible.
- **Stream-Based Architecture:** Design systems as pipelines. Break down large data processing tasks into small, isolated transform streams rather than loading everything into memory.
- **Defensive & Lean:** Code should be robust but not over-engineered. Validate inputs, handle streams gracefully, and keep implementations strictly confined to the required scope.

## 2. Naming Conventions & Code Style
- **Canadian English Spelling:** Strictly use Canadian English spelling for variable names, function names, inline comments, and Markdown documentation (e.g., `colour`, `behaviour`, `initialise`, `catalogue`). 
  - *Exception:* Use US English *only* when dictated by a language's syntax, standard APIs, or system-reserved words (e.g., CSS `color`, HTML `<center>`).
- **No `snake_case`:** Avoid `snake_case` entirely—it is visually distracting and ugly. Unless a language compiler strictly enforces it (e.g., Rust), do not use it.
- **camelCase & PascalCase:** Use `camelCase` for variables, functions, and object properties. Use `PascalCase` for Classes. 
- **Environment Variables:** Prefer `PascalCase` (e.g., `DatabaseUrl`) over the traditional `UPPER_SNAKE_CASE` (`DATABASE_URL`).
- **Variable/Constant Patterns:** 
  - Be highly descriptive and unapologetically unabbreviated (e.g., `extensionToMime` or `outputContent`, never `extMap` or `outCont`).
  - Use clear prefixes for booleans/conditions (e.g., `isEndOfArchive`, `atSegmentStart`).
- **Class-Based Encapsulation:** Extensively use native private fields (`#privateProperty` and `#privateMethod()`) to enforce strong internal encapsulation in JS/TS.
- **No Class Methods Without `this`:** If a method doesn't use `this`, make it `static`.

## 3. Documentation & Architecture Workflow
- **Docs-Driven Development:** Design comes first. Start with comprehensive Markdown documentation and OpenAPI (OAS) specifications before writing code. Update these documents continuously as the code evolves.
- **Diataxis Framework:** Organize documentation directories using the Diataxis methodology. Structure docs clearly into four quadrants: *Tutorials*, *How-To Guides*, *Reference*, and *Explanation*.
- **Visualizing Architecture:** 
  - Use the **C4 Model** for conveying system architecture, boundaries, and context.
  - Use **Sequence Diagrams** to document complex data flows and state changes.
  - *Implementation:* All diagrams must be written using **Mermaid.js** within Markdown files.

## 4. Inline Typing & Comments
- **Rigorous JSDoc:** Treat JSDoc as mandatory for all files, classes, and methods. 
- **Type Definitions:** Define types at the top of the file using `@typedef` for complex objects and configurations.
- **Method Signatures:** Every class and function must have a JSDoc block containing:
  - `@description` explaining the *why* and *what*.
  - `@param {Type}` descriptions.
  - `@returns {Type}` descriptions.
  - `@memberof` or `@class` where applicable.
- **Inline Comments:** Keep them sparse but impactful. Comment *why* a specific technical choice was made (e.g., `"Special case: '.' should match everything"`), not *what* the code is doing.

## 5. Shell Scripting (`.sh`, `.bashrc`, `.zshrc`)
- **POSIX / Standard Bash:** Avoid obscure Bash-isms. Write scripts that are highly portable.
- **Defensive Execution:** Always wrap execution in sanity checks (e.g., `if [ -z "$VAR" ]; then`).
- **Functions as Modules:** Break shell scripts into distinct named functions (e.g., `doInit()`, `addAlias()`) rather than writing monolithic top-to-bottom scripts. 

## 6. UI, HTML & Templating (Handlebars/CSS)
- **Semantic & Clean HTML:** Write strictly well-formatted, standard HTML5. Avoid deep `<div>` soup.
- **Lean CSS:** When using frameworks, use them structurally. Write custom overrides in well-organized, separate stylesheets.
- **Template Logic:** Keep Handlebars (`.hbs`) templates dumb. Move formatting and logic into the backend data pipeline rather than littering the template with complex block helpers.y


