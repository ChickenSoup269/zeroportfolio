"use client"

import React, { useRef, useEffect } from "react"

const PixelRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const raindrops: {
      x: number
      y: number
      speed: number
      size: number
    }[] = []

    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const createRaindrop = () => {
      raindrops.push({
        x: random(0, width),
        y: random(-200, 0),
        speed: random(2, 6),
        size: random(1, 2),
      })
    }

    for (let i = 0; i < 150; i++) {
      createRaindrop()
      raindrops[i].y = random(0, height)
    }

    const update = () => {
      raindrops.forEach((p) => {
        p.y += p.speed
        if (p.y > height) {
          p.y = -20
          p.x = random(0, width)
        }
      })
    }

    const render = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      const foregroundColor = getComputedStyle(document.body).getPropertyValue(
        "color"
      )
      ctx.fillStyle = foregroundColor
      ctx.globalAlpha = 0.5

      raindrops.forEach((p) => {
        ctx.fillRect(p.x, p.y, p.size, p.size * 4)
      })
    }

    let animationFrameId: number

    const gameLoop = () => {
      update()
      render()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
  )
}

export default PixelRain
