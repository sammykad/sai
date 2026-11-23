"use client"

import { useEffect } from "react"
import Lenis from "lenis"

declare global {
  interface Window {
    __lenis?: Lenis | null
  }
}

const SCROLL_DURATION = 1.25

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: SCROLL_DURATION, smoothWheel: true })
    window.__lenis = lenis

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      window.__lenis = null
    }
  }, [])

  return null
}
