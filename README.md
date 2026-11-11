# claude-mods

Two small Claude Code mods.

| Mod | What it does |
|---|---|
| `prompt-master` | Adds a **✨ Prompt Master** button above the prompt box. Click it to rewrite your draft into a clearer, more specific prompt (Sonnet, through your own session). The rewrite replaces your draft; you review it before sending. |
| `mcp-switch` | Adds `/mcpx` to park MCP servers so sessions start lean, then bring back only what you need. |

## Install

At the prompt of a terminal session:

```
/plugin install prompt-master --marketplace wmhunts1002-oss/claude-mods
/plugin install mcp-switch --marketplace wmhunts1002-oss/claude-mods
```

From a shell: `claude plugin install <mod> --marketplace wmhunts1002-oss/claude-mods`.
In the desktop app: click + next to the prompt box, Plugins, Add marketplace with `wmhunts1002-oss/claude-mods`, then Add plugin.

## `/mcpx` usage

```
/mcpx list                 # every server, on or off (read-only)
/mcpx lean [keep ...]      # park all servers except the ones named
/mcpx off <names>          # park servers
/mcpx on <names>           # restore parked servers
```

Changes apply at the next session start; running servers are not unloaded.

## Security notes

- `prompt-master` sends your draft prompt to the model through your own session. It makes no other network calls and stores nothing.
- `mcp-switch` reads and rewrites `~/.claude.json`, which can hold MCP server settings including API tokens. Before each change it writes a copy to `~/.claude.json.pm-bak`, and parked entries are saved in `~/.claude/mcp-parked.json`. Both contain whatever secrets your config holds, in plain text, like the original. Do not commit, share or sync them. It makes no network calls.
- Neither mod runs shell commands, downloads anything, or sends data anywhere except as described above.
- Read `hooks/register.tsx` in each mod before installing; each is under 100 lines.
