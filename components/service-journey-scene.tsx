"use client"

import { useEffect, useRef } from "react"

export function ServiceJourneyScene() {
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (reducedMotion || !("IntersectionObserver" in window)) {
      scene.classList.add("service-scene-active")
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        scene.classList.add("service-scene-active")
        observer.disconnect()
      },
      { threshold: 0.2 }
    )

    observer.observe(scene)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={sceneRef}
      className="service-scene relative isolate mx-auto mt-12 h-[360px] max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-[#091725] sm:h-[430px]"
      role="img"
      aria-label="Animated restaurant scene: a service robot carries a freshly prepared order from the kitchen to the dining tables."
    >
      <div aria-hidden className="service-scene-glow" />
      <div aria-hidden className="service-scene-window-grid" />

      <div aria-hidden className="service-kitchen">
        <div className="service-kitchen-sign">KITCHEN · ORDER 024</div>
        <div className="service-kitchen-shelf">
          <i />
          <i />
          <i />
        </div>
        <div className="service-kitchen-pass">
          <span className="service-steam service-steam-one" />
          <span className="service-steam service-steam-two" />
          <span className="service-steam service-steam-three" />
          <div className="service-dish">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="service-counter-edge" />
      </div>

      <div aria-hidden className="service-dining-room">
        <div className="service-room-light service-room-light-one" />
        <div className="service-room-light service-room-light-two" />
        {["one", "two", "three"].map((table) => (
          <div className={`service-table service-table-${table}`} key={table}>
            <span className="service-chair service-chair-left" />
            <span className="service-chair service-chair-right" />
            <span className="service-table-top">
              <i className="service-plate" />
              <i className="service-glass" />
            </span>
            <span className="service-table-leg" />
          </div>
        ))}
        <span className="service-floor-line service-floor-line-one" />
        <span className="service-floor-line service-floor-line-two" />
      </div>

      <div aria-hidden className="service-route">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div aria-hidden className="service-order-ticket">
        <span className="service-ticket-check">✓</span>
        <span>
          <strong>Order ready</strong>
          <small>Fresh from the kitchen</small>
        </span>
      </div>

      <div aria-hidden className="service-bot">
        <span className="service-bot-shadow" />
        <span className="service-bot-antenna" />
        <span className="service-bot-head">
          <i />
          <i />
          <b />
        </span>
        <span className="service-bot-neck" />
        <span className="service-bot-body">
          <i className="service-bot-panel" />
          <i className="service-bot-arm service-bot-arm-left" />
          <i className="service-bot-arm service-bot-arm-right" />
        </span>
        <span className="service-bot-tray">
          <i />
          <i />
          <i />
        </span>
        <span className="service-bot-base">
          <i />
          <i />
        </span>
        <span className="service-bot-wheel service-bot-wheel-left" />
        <span className="service-bot-wheel service-bot-wheel-right" />
      </div>

      <div aria-hidden className="service-scene-caption">
        <span className="service-live-dot" />
        <span>PREPARED WITH CARE</span>
        <span className="service-caption-divider" />
        <span>DELIVERED TO YOUR TABLE</span>
      </div>
    </div>
  )
}
