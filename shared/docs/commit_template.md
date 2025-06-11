# *Are-u-Queryous?* - Commit Template

This template provides a professional, consistent structure for writing Git commit messages in the Are-U-Query-ous project.

## Format

```bash
<emoji> <TYPE> | <YYYY-MM-DD> | <Short Summary>

- <Bullet 1: what was done + file/module affected>
- <Bullet 2: why it was done or what problem it solves>
- <Bullet 3: technical details or tools involved (optional)>
- ...

<Optional final note explaining purpose, milestone reached, or broader impact>
```

## Example

```git
🗃️ DB | 2025-04-15 | Added full PostGIS schema and unified views

- Added database/schema.sql with table definitions for cities, districts, neighbourhoods, indicators, and point_features
- Added database/views.sql including 'geographical_unit_view' to unify all geo levels
- Enables reproducibility and setup of Supabase schema from scratch
```

## How to request from a language model (LLM)

> "Generate a commit message with this format: `<emoji> <TYPE> | <YYYY-MM-DD> | <Summary>` with clear bullet points, focused on [describe the work you did]."

## Available Types

| Emoji  | Type      | When to use                                               |
|--------|-----------|-----------------------------------------------------------|
| 🛠️     | Setup     | Project setup, configuration, environment                 |
| 📦     | Feature   | New functionality or module                               |
| 🐛     | Fix       | Bug fixes                                                 |
| 🔐     | Config    | Secrets, env variables, authentication                    |
| 🗃️     | DB        | Database schema changes, migrations                       |
| 📄     | Docs      | Documentation changes                                     |
| 🧪     | Test      | Test-related changes                                      |
| ♻️     | Refactor  | Internal improvements, no behavior changes                |
| 🚀     | Deploy    | Deployment-related scripts or configurations              |

## License & Ownership

All code and scripts in this repository are released under the [MIT License](../LICENSE).  
You are free to use, modify, and distribute them with proper attribution.
