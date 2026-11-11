import type { Register } from 'claude-code'

const SYSTEM =
  'You rewrite rough draft prompts into clear, specific, well-structured prompts for an AI coding assistant. ' +
  'Keep the original intent and every concrete detail; add goal, context, constraints and desired output only where implied. ' +
  'Do not invent facts. Reply with the rewritten prompt only, no preamble or quotes.'

export const register: Register = on => {
  let isBusy = false

  // shortcut: a button in the band above the prompt; no hook slot exists beside the + button.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box>
        <Button
          key="pm"
          label="✨ Prompt Master"
          onPress={async () => {
            if (isBusy) return
            const { text } = await $.prompt.read()
            if (!text.trim()) {
              $.ui.toast('Prompt Master: type a prompt first')
              return
            }
            isBusy = true
            $.ui.toast('Prompt Master: rewriting…')
            try {
              const r = await $.model.complete({ model: 'sonnet', system: SYSTEM, prompt: text })
              if (r.isAnswered) {
                await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
              } else {
                $.ui.toast(`Prompt Master failed: ${r.reason}`)
              }
            } finally {
              isBusy = false
            }
          }}
        />
        {await next(e)}
      </Box>
    )
  })
}
