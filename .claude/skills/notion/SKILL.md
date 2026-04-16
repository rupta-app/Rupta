---
name: notion
description: Interact with the Rupta Notion workspace — query, create, move, or reorganize backlog cards and MVP epic tasks
argument-hint: "[what you want to do]"
---

# Notion Workspace

Use this skill for any task that touches the Rupta Notion board: listing cards by status, creating new cards or epics, moving cards between databases, restructuring the backlog, etc. For picking up a single card to work on, use `/notion-card` instead.

## Workspace Map

### Main Board (the "Backlog" database)

- **Database ID**: `342a95d1-87e3-803d-ac5b-f8858b3bcbe2`
- **URL**: https://www.notion.so/Board-342a95d187e380b7a904da86a113555b
- **Properties**:
  - `Name` (title)
  - `Status` (select): `Backlog`, `MVP`, `In Progress`, `Done`
  - `Tags` (multi_select): `dev`, `design`, `product`
  - `Assign` (people)

Cards prefixed with `[Epica] X` are container pages — each has an inline "Tasks Tracker" sub-database with the small features.

### Existing Epics

| Epic | Page ID | Tasks Tracker DB ID |
|------|---------|---------------------|
| [Epica] Social Interactions | `343a95d1-87e3-81b7-933e-e025b3199767` | `343a95d1-87e3-8127-a7d3-ddfa026fdb7c` |
| [Epica] Moderation & Trust | `343a95d1-87e3-8195-9ca4-f6dc0330de5c` | `343a95d1-87e3-81b3-a8fe-c4e30ed8fec1` |
| [Epica] Groups | `343a95d1-87e3-8107-b0d0-ec6416983e93` | `343a95d1-87e3-8182-a2e9-dbff2fb5ee9d` |
| [Epica] Sharing & Deep Links | `343a95d1-87e3-815c-b4a4-eeecd2334a63` | `343a95d1-87e3-817d-a9df-f182bd5d0c43` |
| [Epica] Monetization | `343a95d1-87e3-81a1-aac2-cf2350801e5e` | `343a95d1-87e3-817b-99c0-e1e9fb64fac0` |
| [Epica] Weekly Streak | `344a95d1-87e3-81fb-b220-d9db1337bb88` | _add inline DB_ |
| [Epica] Quest of the Week | `344a95d1-87e3-81ca-bdb7-f1bb172bf471` | _add inline DB_ |
| [Epica] Storylines | `344a95d1-87e3-81d4-bd04-eb4f5ef2eca0` | _add inline DB_ |
| [Epica] Badges | `344a95d1-87e3-810e-b3ef-d2ef8a0600eb` | _add inline DB_ |
| [Epica] Duo Quests | `344a95d1-87e3-8159-9bac-ffca7116420d` | _add inline DB_ |
| [Epica] Seasonal Events | `344a95d1-87e3-810b-a102-d51ad38baf0e` | _add inline DB_ |
| [Epica] Group Game Modes | `344a95d1-87e3-818f-9a05-c875adfad00d` | _add inline DB_ |

When new sub-databases are created, update the table above.

### Tasks Tracker sub-database schema

Each epic's Tasks Tracker has:
- `Task name` (title)
- `Status` (select): `Not started`, `In progress`, `Done`
- `Priority` (select): `High`, `Medium`, `Low`

Property option IDs differ per database — re-fetch the schema before writing.

## MCP Tools

The personal integration has full read/write access to this workspace. Prefer it over `claude_ai_Notion`.

- **Search**: `mcp__notion-personal__API-post-search` (pass empty `query` to list everything; filter results in memory by `parent.database_id`)
- **Read page**: `mcp__notion-personal__API-retrieve-a-page`
- **Read blocks**: `mcp__notion-personal__API-get-block-children`
- **Read DB schema**: `mcp__notion-personal__API-retrieve-a-database`
- **Create page**: `mcp__notion-personal__API-post-page`
- **Update page**: `mcp__notion-personal__API-patch-page`
- **Move page**: `mcp__claude_ai_Notion__notion-move-pages` (the personal one doesn't expose move)

The Notion 2025-09-03 API splits databases into data sources, but this workspace's databases all have a single data source — pass the `database_id` as `data_source_id` works for `query-data-source` only when paired with the right URL form. When in doubt, list via search and filter.

## Common Operations

### List cards in the main backlog with a given status

Use `post-search` with `query: ""` (returns up to 100 results), then filter in memory:

```
parent.database_id == "342a95d1-87e3-803d-ac5b-f8858b3bcbe2"
&& properties.Status.select.name == "Backlog"
```

Search results truncate fast — if `has_more: true`, paginate with `start_cursor`.
For large dumps, write the result to a file and `jq` over it instead of reading inline.

### Create a card on the main board

```
parent: { type: "database_id", database_id: "342a95d1-87e3-803d-ac5b-f8858b3bcbe2" }
properties: {
  Name: { title: [{ text: { content: "..." } }] },
  Status: { select: { name: "Backlog" } },     // or MVP / In Progress / Done
  Tags: { multi_select: [{ name: "dev" }] }
}
```

### Create a task inside an epic

Same shape, but `database_id` = the epic's Tasks Tracker DB ID. Property names differ:

```
properties: {
  "Task name": { title: [{ text: { content: "..." } }] },
  Status: { select: { name: "Not started" } },
  Priority: { select: { name: "Medium" } }
}
```

### Move a card into an epic's sub-database

`mcp__claude_ai_Notion__notion-move-pages` with `new_parent.database_id` set to the epic's Tasks Tracker DB ID. Note that property values reset since schemas differ — set Status/Priority afterward via `patch-page`.

## Conventions

- Epic cards on the main board are named `[Epica] X` (with the bracket prefix).
- New backlog work goes to `Status: Backlog` with `Tags: dev` (unless clearly design/product).
- Don't auto-assign owners — leave `Assign` empty unless told who.
- When restructuring, confirm the plan with the user before mass-creating or moving cards.

$ARGUMENTS
