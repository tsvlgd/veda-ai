'use client'

import { Sparkles } from 'lucide-react'

export default function ExtractingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="rounded-3xl bg-card p-16 text-center shadow-sm">
        <div className="relative mx-auto mb-6 h-20 w-24">
          {/* Large sparkle */}
          <Sparkles className="animate-sparkle-1 absolute right-2 top-0 size-10 text-orange-500" />
          {/* Small sparkle bottom-left */}
          <Sparkles className="animate-sparkle-2 absolute bottom-2 left-0 size-7 text-orange-400" />
          {/* Tiny sparkle */}
          <Sparkles className="animate-sparkle-3 absolute bottom-0 right-0 size-4 text-orange-300" />
          {/* Decorative dot */}
          <div className="absolute left-4 top-4 size-2 rounded-full bg-orange-400 animate-sparkle-2" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Extracting...
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This may take a while
        </p>
      </div>
    </div>
  )
}
