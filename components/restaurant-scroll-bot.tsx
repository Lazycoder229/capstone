"use client"

import { useEffect, useRef } from "react"

const actions = [
  { limit: 0.34, name: "prepare", label: "PREPARING FRESH ORDERS" },
  { limit: 0.67, name: "serve", label: "SERVING THE TABLE" },
  { limit: 1, name: "clean", label: "RESETTING THE TABLE" },
] as const

export function RestaurantScrollBot() {
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const updateScene = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight
        const progress =
          maxScroll > 0
            ? Math.max(0, Math.min(1, window.scrollY / maxScroll))
            : 0
        const mascotWidth =
          scene.querySelector(".restaurant-scroll-mascot")?.getBoundingClientRect()
            .width ?? 150
        const sideInset = 28
        const travel = Math.max(
          0,
          scene.clientWidth - mascotWidth - sideInset * 2
        )
        const action =
          actions.find((item) => progress <= item.limit) ?? actions[2]

        scene.style.setProperty(
          "--restaurant-bot-x",
          `${sideInset + progress * travel}px`
        )
        scene.dataset.action = action.name
        scene.dataset.actionLabel = action.label
      })
    }

    updateScene()
    window.addEventListener("scroll", updateScene, { passive: true })
    window.addEventListener("resize", updateScene)
    const resizeObserver = new ResizeObserver(updateScene)
    resizeObserver.observe(document.documentElement)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", updateScene)
      window.removeEventListener("resize", updateScene)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={sceneRef}
      className="restaurant-scroll-scene"
      data-action="prepare"
      data-action-label="PREPARING FRESH ORDERS"
      aria-hidden="true"
    >
      <svg
        className="restaurant-scene-art"
        viewBox="0 0 720 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="restaurant-wall" x1="360" y1="0" x2="360" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D8D1C3" stopOpacity=".32" />
            <stop offset="1" stopColor="#F7F8F5" stopOpacity=".08" />
          </linearGradient>
          <linearGradient
            id="restaurant-wood"
            x1="0"
            y1="0"
            x2="720"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BBA987" stopOpacity=".28" />
            <stop offset="1" stopColor="#8C806B" stopOpacity=".18" />
          </linearGradient>
        </defs>

        <rect width="720" height="900" fill="url(#restaurant-wall)" />
        <path d="M80 0V260M330 0V230M585 0V250" stroke="#716958" strokeOpacity=".11" />
        <path d="M0 245H720M0 265H720" stroke="#716958" strokeOpacity=".08" />
        <path d="M112 0V72M360 0V62M608 0V82" stroke="#716958" strokeOpacity=".18" />
        <path d="M75 72H149L162 105H62L75 72ZM323 62H397L410 95H310L323 62ZM571 82H645L658 115H558L571 82Z" fill="#B79B69" fillOpacity=".1" />
        <path d="M0 725H720M0 744H720" stroke="#716958" strokeOpacity=".09" />
        <path d="M115 745V900M355 745V900M595 745V900" stroke="#716958" strokeOpacity=".06" />

        <g opacity=".42" stroke="#766A55" strokeOpacity=".24">
          <path d="M20 580H287L316 608H0V602L20 580Z" fill="url(#restaurant-wood)" />
          <path d="M58 608V673M248 608V673" />
          <path d="M30 674H276" strokeOpacity=".12" />
          <path d="M414 588C414 568 438 552 468 552C498 552 522 568 522 588V600H414V588Z" fill="url(#restaurant-wood)" />
          <path d="M403 600H533L520 616H416L403 600Z" fill="#E8C994" fillOpacity=".18" />
          <path d="M424 616V682M512 616V682" />
          <path d="M538 645C538 630 558 619 583 619C608 619 628 630 628 645V654H538V645Z" fill="url(#restaurant-wood)" />
          <path d="M530 654H636L625 668H541L530 654Z" fill="#E8C994" fillOpacity=".16" />
          <path d="M550 668V716M615 668V716" />
        </g>

        <g opacity=".34" stroke="#E9C88C" strokeOpacity=".45">
          <path d="M465 576C477 565 492 565 504 576" />
          <path d="M459 579H510" />
          <path d="M573 641C581 633 591 633 599 641" />
        </g>
      </svg>

      <span className="restaurant-scroll-track" />
      <svg
        className="restaurant-scroll-mascot"
        viewBox="0 0 180 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="90" cy="207" rx="54" ry="9" fill="#07090A" fillOpacity=".55" />
        <path d="M90 10V24" stroke="#F2D6A2" strokeWidth="4" strokeLinecap="round" />
        <circle cx="90" cy="9" r="6" fill="#F5B74E" />
        <rect x="55" y="24" width="70" height="53" rx="19" fill="#F0E8D8" stroke="#FFF8EA" strokeWidth="3" />
        <rect x="64" y="37" width="52" height="24" rx="10" fill="#18333A" />
        <circle cx="78" cy="49" r="4" fill="#7DE8D0" />
        <circle cx="102" cy="49" r="4" fill="#7DE8D0" />
        <path d="M82 66C87 71 94 71 99 66" stroke="#B87642" strokeWidth="3" strokeLinecap="round" />
        <rect x="84" y="77" width="12" height="13" rx="4" fill="#C3A783" />
        <path d="M51 102C51 91 61 84 72 84H108C119 84 129 91 129 102V151H51V102Z" fill="#E8DDC8" stroke="#FFF6E8" strokeWidth="3" />
        <rect x="70" y="101" width="40" height="31" rx="8" fill="#244750" />
        <path d="M78 116H102" stroke="#F6BC62" strokeWidth="3" strokeLinecap="round" />
        <path d="M51 101L38 128M129 101L142 128" stroke="#E8DDC8" strokeWidth="11" strokeLinecap="round" />
        <path d="M63 151H117L125 184C127 191 122 196 115 196H65C58 196 53 191 55 184L63 151Z" fill="#D4C4A9" stroke="#FFF6E8" strokeWidth="3" />
        <circle cx="75" cy="173" r="6" fill="#40545A" />
        <circle cx="105" cy="173" r="6" fill="#40545A" />
        <circle cx="68" cy="205" r="9" fill="#27363A" stroke="#B59E7B" strokeWidth="3" />
        <circle cx="112" cy="205" r="9" fill="#27363A" stroke="#B59E7B" strokeWidth="3" />

        <g className="restaurant-action restaurant-action-prepare">
          <path d="M137 108L153 80" stroke="#F4E3C3" strokeWidth="5" strokeLinecap="round" />
          <path d="M146 82L158 64" stroke="#E6B766" strokeWidth="4" strokeLinecap="round" />
          <path d="M140 137H170L166 153H144L140 137Z" fill="#3B5660" stroke="#E6D4B5" strokeWidth="3" />
          <path d="M137 135C137 129 143 125 155 125C167 125 173 129 173 135" stroke="#E6D4B5" strokeWidth="3" />
          <path d="M148 124C143 116 153 112 148 104M160 124C155 116 165 112 160 104" stroke="#F6D59B" strokeWidth="3" strokeLinecap="round" />
        </g>

        <g className="restaurant-action restaurant-action-serve">
          <path d="M35 143H145" stroke="#FFF1D5" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="90" cy="140" rx="34" ry="10" fill="#F5E7CB" />
          <path d="M68 139C70 125 80 123 88 137C96 121 110 126 112 139" fill="#D98B4D" />
          <circle cx="58" cy="132" r="5" fill="#95D4A7" />
          <circle cx="122" cy="133" r="5" fill="#F5B74E" />
        </g>

        <g className="restaurant-action restaurant-action-clean">
          <path d="M132 117C149 111 165 115 171 127L164 144C149 145 137 140 128 132L132 117Z" fill="#8FC9C3" stroke="#E9FFFF" strokeWidth="3" />
          <path d="M155 145H178" stroke="#F4D8A6" strokeWidth="4" strokeLinecap="round" />
          <path d="M145 158L141 168M164 158L160 168M176 153L173 162" stroke="#8BE8CC" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}
