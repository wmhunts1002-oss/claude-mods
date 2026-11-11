import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'mcpx',
      description: 'MCP servers: list | lean [keep...] | on <names> | off <names>',
    })
    return next(e)
  })

  on('command.run', { command: 'mcpx' }, async ($, e) => {
    const home = ((await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '').replaceAll('\\', '/')
    if (!home) return { text: 'mcpx: cannot find your home folder.' }
    const CFG = `${home}/.claude.json`
    const PARKED = `${home}/.claude/mcp-parked.json`
    const [sub = 'list', ...names] = e.args.trim().split(/[\s,]+/).filter(Boolean)
    const raw = await $.fs.read(CFG)
    const cfg: any = JSON.parse(raw)
    let parked: Record<string, { scope: string; entry: unknown }> = {}
    try {
      parked = JSON.parse(await $.fs.read(PARKED))
    } catch {
      // no parked file yet
    }

    const scopes = (): Record<string, any> => {
      const s: Record<string, any> = { user: (cfg.mcpServers ??= {}) }
      for (const [p, v] of Object.entries<any>(cfg.projects ?? {})) {
        if (v.mcpServers && Object.keys(v.mcpServers).length) s[p] = v.mcpServers
      }
      return s
    }
    const park = (name: string) => {
      for (const [scope, servers] of Object.entries(scopes())) {
        if (name in servers) {
          parked[name] = { scope, entry: servers[name] }
          delete servers[name]
          return true
        }
      }
      return false
    }
    const unpark = (name: string) => {
      const p = parked[name]
      if (!p) return false
      const target = p.scope === 'user' ? (cfg.mcpServers ??= {}) : (cfg.projects[p.scope].mcpServers ??= {})
      target[name] = p.entry
      delete parked[name]
      return true
    }

    const active = () => Object.values(scopes()).flatMap(s => Object.keys(s))
    let done: string[] = []
    let missed: string[] = []

    if (sub === 'lean') {
      const keep = new Set(names)
      for (const n of active()) if (!keep.has(n) && park(n)) done.push(n)
    } else if (sub === 'off') {
      for (const n of names) (park(n) ? done : missed).push(n)
    } else if (sub === 'on') {
      for (const n of names) (unpark(n) ? done : missed).push(n)
    } else if (sub !== 'list') {
      return { text: 'Usage: /mcpx list | lean [keep...] | on <names> | off <names>' }
    }

    if (done.length) {
      await $.fs.write(CFG + '.pm-bak', raw)
      await $.fs.write(PARKED, JSON.stringify(parked, null, 2))
      await $.fs.write(CFG, JSON.stringify(cfg, null, 2))
    }

    const lines = [
      ...active().map(n => `on   ${n}`),
      ...Object.keys(parked).map(n => `off  ${n}`),
    ]
    const head = sub === 'list' ? '' : `${sub}: changed ${done.join(', ') || 'nothing'}${missed.length ? `; not found: ${missed.join(', ')}` : ''}\n`
    const tail = done.length ? '\nTakes effect on the next session start; running servers are not unloaded. Backup: ~/.claude.json.pm-bak' : ''
    return { text: head + lines.join('\n') + tail }
  })
}
