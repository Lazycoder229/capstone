"use client"

import { useEffect, useRef } from "react"

export function RestaurantScrollBot() {
  const botRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bot = botRef.current
    if (!bot) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const updatePosition = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight
        const progress =
          maxScroll > 0
            ? Math.max(0, Math.min(1, window.scrollY / maxScroll))
            : 0
        const topInset = 32
        const mascotHeight =
          bot.querySelector("svg")?.getBoundingClientRect().height ?? 94
        const travel = Math.max(
          0,
          window.innerHeight - topInset - mascotHeight - 32
        )
        bot.style.setProperty(
          "--restaurant-bot-y",
          `${topInset + progress * travel}px`
        )
      })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, { passive: true })
    window.addEventListener("resize", updatePosition)
    const resizeObserver = new ResizeObserver(updatePosition)
    resizeObserver.observe(document.documentElement)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("resize", updatePosition)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={botRef} className="restaurant-scroll-bot" aria-hidden="true">
      <span className="restaurant-scroll-track" />
      <svg
        className="restaurant-scroll-mascot"
        viewBox="0 0 96 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="48" cy="124" rx="31" ry="6" fill="#07090A" fillOpacity=".55" />
        <path d="M48 8V17" stroke="#F2D6A2" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="7" r="4" fill="#F5B74E" />
        <rect x="22" y="17" width="52" height="39" rx="15" fill="#F0E8D8" stroke="#FFF8EA" strokeWidth="2" />
        <rect x="29" y="27" width="38" height="18" rx="8" fill="#18333A" />
        <circle cx="39" cy="36" r="3" fill="#7DE8D0" />
        <circle cx="57" cy="36" r="3" fill="#7DE8D0" />
        <path d="M42 47C45 50 51 50 54 47" stroke="#B87642" strokeWidth="2" strokeLinecap="round" />
        <rect x="44" y="55" width="8" height="8" rx="3" fill="#C3A783" />
        <path d="M25 68C25 61 31 57 38 57H58C65 57 71 61 71 68V96H25V68Z" fill="#E8DDC8" stroke="#FFF6E8" strokeWidth="2" />
        <rect x="37" y="68" width="22" height="17" rx="5" fill="#244750" />
        <path d="M41 77H55" stroke="#F6BC62" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 67L17 84M71 67L79 82" stroke="#E8DDC8" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 82H78" stroke="#FFF1D5" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="48" cy="80" rx="13" ry="4" fill="#F5E7CB" />
        <path d="M40 78C41 72 45 71 48 77C51 70 56 73 56 78" fill="#D98B4D" />
        <path d="M29 96H67L73 112C74 116 71 119 67 119H29C25 119 22 116 23 112L29 96Z" fill="#D4C4A9" stroke="#FFF6E8" strokeWidth="2" />
        <circle cx="36" cy="108" r="4" fill="#40545A" />
        <circle cx="60" cy="108" r="4" fill="#40545A" />
        <circle cx="30" cy="125" r="6" fill="#27363A" stroke="#B59E7B" strokeWidth="2" />
        <circle cx="66" cy="125" r="6" fill="#27363A" stroke="#B59E7B" strokeWidth="2" />
      </svg>
    </div>
  )
}
