"use client"

import { useState } from "react"
import { Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// A small, curated, fully-offline emoji set. No external requests — picking an
// emoji just inserts a unicode character, keeping the app private by design.
const GROUPS: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: "😀 😄 😁 😅 😂 🤣 😊 🙂 😉 😍 🥰 😘 😜 🤪 😎 🤩 🥳 🤔 🤨 😐 😴 😪 😌 😔 😢 😭 😤 😠 😳 🥺 😱 🤯 😬 🙄 😷 🤒 🤕 🤗 🤭 🤫".split(" "),
  },
  {
    name: "Gestures",
    emojis: "👍 👎 👌 🤌 ✌️ 🤞 🤟 🤘 👊 ✊ 🤛 🤜 👏 🙌 👐 🙏 💪 🫶 👋 🤙 👈 👉 👆 👇 ☝️ ✍️".split(" "),
  },
  {
    name: "Hearts",
    emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ✨ 💫 ⭐ 🌟 🔥 💯".split(" "),
  },
  {
    name: "Animals",
    emojis: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐬 🐳 🐙".split(" "),
  },
  {
    name: "Food",
    emojis: "🍏 🍎 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🍅 🥑 🌽 🍔 🍟 🍕 🌮 🍿 🍩 🍪 🎂 🍰 ☕ 🍵 🍺 🥂".split(" "),
  },
  {
    name: "Activity",
    emojis: "⚽ 🏀 🏈 ⚾ 🎾 🏐 🎱 🏓 🏸 🥊 🎯 🎮 🎲 🎸 🎧 🎉 🎊 🎁 🏆 🥇 🎨 📸 ✈️ 🚀 🌈 ☀️ 🌙".split(" "),
  },
  {
    name: "Symbols",
    emojis: "✅ ❌ ⚠️ ❓ ❗ 💬 👀 🎵 🔒 🔗 📎 📌 💡 ⏰ ✔️ ➕ ➖ ♻️ 🆗 🆒 🔴 🟢 🔵 ⚫ ⚪".split(" "),
  },
]

export function EmojiPicker({ onPick, disabled }: { onPick: (emoji: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-11 w-11 shrink-0"
          disabled={disabled}
          aria-label="Add emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="max-h-72 overflow-y-auto p-2">
          {GROUPS.map((group) => (
            <div key={group.name} className="mb-2">
              <p className="px-1 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.name}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji, i) => (
                  <button
                    key={`${group.name}-${i}`}
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-accent"
                    onClick={() => onPick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
