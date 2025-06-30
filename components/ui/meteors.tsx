"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number
  className?: string
}) => {
  const [meteorStyles, setMeteorStyles] = useState<
    Array<{
      id: number
      top: string
      left: string
      size: number
      opacity: number
      animationDelay: string
      animationDuration: string
    }>
  >([])

  useEffect(() => {
    const styles = [...Array(number)].map((_, i) => ({
      id: i,
      top: Math.floor(Math.random() * 100) + "%",
      left: Math.floor(Math.random() * 100) + "%",
      size: Math.floor(Math.random() * 2) + 1,
      opacity: Math.random() * 0.8 + 0.1,
      animationDelay: Math.random() * 2 + "s",
      animationDuration: Math.floor(Math.random() * 8 + 2) + "s",
    }))
    setMeteorStyles(styles)
  }, [number])

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {meteorStyles.map((style) => (
        <span
          key={style.id}
          className="meteor absolute inline-block rounded-full bg-blue-500"
          style={{
            top: style.top,
            left: style.left,
            width: `${style.size}px`,
            height: `${style.size * 80}px`,
            opacity: style.opacity,
            animationDelay: style.animationDelay,
            animationDuration: style.animationDuration,
          }}
        />
      ))}
    </div>
  )
}
