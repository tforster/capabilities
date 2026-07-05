---
applyTo: "**/*.md"
---

# Markdown Style Guide <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [1. Table of Contents and Section Numbering](#1-table-of-contents-and-section-numbering)
- [2. Code Blocks](#2-code-blocks)
- [3. Headings](#3-headings)
- [4. GFM Callouts](#4-gfm-callouts)
- [5. Horizontal Rules](#5-horizontal-rules)
- [6. File Naming](#6-file-naming)
- [7. Tables](#7-tables)
- [8. Language](#8-language)
- [9. Back Navigation](#9-back-navigation)
- [10. Category Indexes](#10-category-indexes)
- [11. Anti-Duplication](#11-anti-duplication)
- [12. Final Notes](#12-final-notes)
- [13. Linting Rules to Avoid](#13-linting-rules-to-avoid)

## 1. Table of Contents and Section Numbering

In VSCode we use the [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) extension, which supports automatic generation of a table of contents. It also supports automatic section numbering.

Since we do not want the page title or table of contents headings to appear in the Table of Contents itself, we need to use the `<!-- omit in toc -->` comment to exclude them.

```markdown
# Document Title <!-- omit in toc -->

Description of the document.

## Table of Contents <!-- omit in toc -->
```

The section numbering can be applied using the extension. The extension can be run subsequently to update the section numbers as you edit the document. In scenarios where editing takes place outside of VSCode the section number can be added manually by prefixing the heading text with the appropriate number. For example:

```markdown
## 1. First Section

### 1.1 Subsection

## 2. Second Section
```

We do not number the page title (heading level 1) since it is the only one and serves as the document title. And, we don't number the table of contents heading since it is not a real section of the document.

## 2. Code Blocks

Always add blank lines before and after fenced code blocks. **Always specify a language identifier.** Never use bare ` ``` `.

| Content                            | Identifier           |
| ---------------------------------- | -------------------- |
| JavaScript                         | `javascript` or `js` |
| TypeScript                         | `typescript` or `ts` |
| PHP                                | `php`                |
| SQL                                | `sql`                |
| Shell/Bash                         | `bash` or `shell`    |
| YAML                               | `yaml` or `yml`      |
| JSON                               | `json`               |
| HTML                               | `html`               |
| CSS                                | `css`                |
| Plain text / prompts / pseudo-code | `text`               |
| Markdown content                   | `markdown` or `md`   |

When in doubt, use `text` rather than no language.

## 3. Headings

- Use `#` for document title (one per document)
- Use `##` for major sections, `###` for subsections
- Always add a blank line before and after headings

## 4. GFM Callouts

Use GitHub Flavoured Markdown callouts for important notices:

```markdown
> [!NOTE]
> Useful information.

> [!TIP]
> Helpful suggestion.

> [!WARNING]
> Something that could go wrong.

> [!IMPORTANT]
> Critical information.
```

## 5. Horizontal Rules

**Do not use `---` as a section divider.** Use headings instead.

## 6. File Naming

Use kebab-case for all markdown file names: `database-setup.md`, `how-to-deploy.md`.

## 7. Tables

Use GFM column alignment in table headers:

| Alignment | Syntax  |
| --------- | ------- |
| Left      | `:---`  |
| Centre    | `:---:` |
| Right     | `---:`  |

## 8. Language

Always use British/Canadian English spelling: organise, colour, behaviour, centre, optimise, analyse.

## 9. Back Navigation

Every document must end with a back-navigation link:

```markdown
[← Back to Documentation Home](../README.md)
```

Adjust the relative path to suit the document's location in the folder hierarchy.

## 10. Category Indexes

Each `docs/` category folder has a `README.md` that lists all documents in that category. Always update the index when adding or removing a document.

## 11. Anti-Duplication

Never duplicate content across documents. Identify the canonical source and link to it from all other locations. Duplicated content creates maintenance burden and conflicting information.

**Bad** — same fact repeated in two files:

```markdown
<!-- In reference/oracle-guide.md -->

## Connection String Format

The Oracle connection string format is: user/password@//host:port/service

<!-- In how-to/developer-guide.md -->

## Database Connection

The Oracle connection string format is: user/password@//host:port/service
```

**Good** — one canonical source, one link:

```markdown
<!-- In reference/oracle-guide.md (canonical) -->

## Connection String Format

The Oracle connection string format is: user/password@//host:port/service

<!-- In how-to/developer-guide.md -->

## Database Connection

See [Connection String Format](../reference/oracle-guide.md#connection-string-format).
```
## 12. Final Notes

When writing markdown do not artificially break lines that don't need to be broken. Word wrapping should be handled by the markdown renderer, not in the markdown file itself.

## 13. Linting Rules to Avoid

- **MD040**: Fenced code blocks must have a language
- **MD022**: Headings must be surrounded by blank lines
- **MD031**: Fenced code blocks must be surrounded by blank lines
- **MD025**: Only one top-level heading per document
- **MD032**: Lists must be surrounded by blank lines
