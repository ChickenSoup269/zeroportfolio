"use client"

import React, { useRef, useEffect, useCallback } from "react"
import { useAnimation } from "@/app/AnimationContext"

const PixelWar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { setIsBossActive, setIsGameOver, setGameController } = useAnimation()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const bossImage = new Image()
    bossImage.crossOrigin = "anonymous"
    bossImage.src = "https://avatars.githubusercontent.com/u/95624468?v=4"
    let isBossImageLoaded = false
    bossImage.onload = () => {
      isBossImageLoaded = true
    }

    // --- INTERFACES ---
    interface GameObject {
      x: number
      y: number
      width: number
      height: number
      color: string
    }
    interface Bullet extends GameObject {
      vy: number
    }
    interface Monster extends GameObject {
      vx: number
      vy: number
    }
    interface Star {
      x: number
      y: number
      vy: number
      size: number
      alpha: number
    }
    interface Boss extends GameObject {
      hp: number
      maxHp: number
      vx: number
    }

    // --- GAME STATE ---
    let player: GameObject
    let bullets: Bullet[]
    let enemyBullets: Bullet[]
    let monsters: Monster[]
    let stars: Star[]
    let boss: Boss | null
    let level: number
    let monsterDirection: number
    let fireCooldown: number
    let keysPressed: { [key: string]: boolean }
    let isGameActive = false

    const monsterSpeed = 0.5
    const monsterRows = 4
    const monsterCols = 10
    const playerMoveSpeed = 4

    // --- GAME LIFECYCLE ---
    const handleStartGame = () => {
      setIsBossActive(false)
      setIsGameOver(false)
      isGameActive = true
      player = {
        x: width / 2 - 25,
        y: height - 50,
        width: 50,
        height: 20,
        color: "var(--primary)",
      }
      bullets = []
      enemyBullets = []
      monsters = []
      boss = null
      level = 1
      monsterDirection = 1
      fireCooldown = 0
      keysPressed = {}
      createMonsters()
    }

    const createStars = () => {
      stars = []
      const starCount = 200
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: Math.random() * 1.5 + 0.5,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.8 + 0.2,
        })
      }
    }

    const createMonsters = () => {
      monsters = []
      const monsterWidth = 30
      const monsterHeight = 20
      const padding = 15
      const offsetX = (width - monsterCols * (monsterWidth + padding)) / 2
      const offsetY = 50
      const baseMonsterColor = "var(--foreground)"
      for (let r = 0; r < monsterRows; r++) {
        for (let c = 0; c < monsterCols; c++) {
          monsters.push({
            x: offsetX + c * (monsterWidth + padding),
            y: offsetY + r * (monsterHeight + padding),
            width: monsterWidth,
            height: monsterHeight,
            color: baseMonsterColor,
            vx: monsterSpeed * monsterDirection,
            vy: 0,
          })
        }
      }
    }

    const createBoss = () => {
      setIsBossActive(true)
      boss = {
        x: width / 2 - 100,
        y: 100,
        width: 200,
        height: 200,
        color: "var(--foreground)",
        hp: 100,
        maxHp: 100,
        vx: 2,
      }
    }

    // --- EVENT LISTENERS & CONTROLLER REGISTRATION ---
    setGameController({ startGame: handleStartGame })

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // --- UPDATE LOGIC ---
    const update = () => {
      if (!isGameActive) {
        // Still draw stars when game is not active
        stars.forEach((star) => {
          star.y += star.vy
          if (star.y > height) {
            star.y = 0
            star.x = Math.random() * width
          }
        })
        return
      }

      stars.forEach((star) => {
        star.y += star.vy
        if (star.y > height) {
          star.y = 0
          star.x = Math.random() * width
        }
      })

      if (keysPressed["a"]) player.x -= playerMoveSpeed
      if (keysPressed["d"]) player.x += playerMoveSpeed
      player.x = Math.max(0, Math.min(width - player.width, player.x))

      fireCooldown--
      if (fireCooldown <= 0) {
        bullets.push({
          x: player.x + player.width / 2 - 2.5,
          y: player.y,
          width: 5,
          height: 15,
          vy: -8,
          color: "var(--primary)",
        })
        fireCooldown = 20
      }

      bullets.forEach((b, i) => {
        b.y += b.vy
        if (b.y < 0) bullets.splice(i, 1)
      })
      enemyBullets.forEach((b, i) => {
        b.y += b.vy
        if (b.y > height) enemyBullets.splice(i, 1)
      })

      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i]
        if (
          eb.x < player.x + player.width &&
          eb.x + eb.width > player.x &&
          eb.y < player.y + player.height &&
          eb.y + eb.height > player.y
        ) {
          isGameActive = false
          setIsGameOver(true)
          return
        }
      }

      if (boss) {
        boss.x += boss.vx
        if (boss.x <= 0 || boss.x + boss.width >= width) boss.vx *= -1
        if (level >= 3 && Math.random() < 0.03) {
          enemyBullets.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            width: 10,
            height: 10,
            vy: 5,
            color: "var(--destructive)",
          })
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]
          if (
            b.x < boss.x + boss.width &&
            b.x + b.width > boss.x &&
            b.y < boss.y + boss.height &&
            b.y + b.height > boss.y
          ) {
            bullets.splice(i, 1)
            boss.hp--
            if (boss.hp <= 0) {
              setIsBossActive(false)
              boss = null
              level++
              createMonsters()
            }
            break
          }
        }
      } else {
        let wallHit = false
        monsters.forEach((m) => {
          m.x += m.vx
          if (m.x <= 0 || m.x + m.width >= width) wallHit = true
        })
        if (wallHit) {
          monsterDirection *= -1
          monsters.forEach((m) => {
            m.vx = monsterSpeed * monsterDirection
            m.y += 20
          })
        }
        if (level >= 3 && monsters.length > 0 && Math.random() < 0.005) {
          const shooter = monsters[Math.floor(Math.random() * monsters.length)]
          enemyBullets.push({
            x: shooter.x + shooter.width / 2,
            y: shooter.y + shooter.height,
            width: 4,
            height: 8,
            vy: 4,
            color: "var(--foreground)",
          })
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
          let hit = false
          for (let j = monsters.length - 1; j >= 0; j--) {
            const b = bullets[i]
            const m = monsters[j]
            if (
              b &&
              m &&
              b.x < m.x + m.width &&
              b.x + b.width > m.x &&
              b.y < m.y + m.height &&
              b.y + b.height > m.y
            ) {
              bullets.splice(i, 1)
              monsters.splice(j, 1)
              hit = true
              break
            }
          }
          if (hit) break
        }
        if (monsters.length === 0) {
          level++
          if (level === 3) createBoss()
          else createMonsters()
        }
        if (monsters.some((m) => m.y + m.height >= player.y)) {
          isGameActive = false
          setIsGameOver(true)
        }
      }
    }

    // --- RENDER LOGIC ---
    const render = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      const foregroundColor = getComputedStyle(document.body).getPropertyValue(
        "color"
      )
      ctx.fillStyle = foregroundColor
      stars.forEach((s) => {
        ctx.globalAlpha = s.alpha
        ctx.fillRect(s.x, s.y, s.size, s.size)
      })
      ctx.globalAlpha = 1

      if (isGameActive) {
        ;[player, ...bullets, ...enemyBullets].forEach((p) => {
          ctx.fillStyle = p.color
          ctx.fillRect(p.x, p.y, p.width, p.height)
        })
        if (boss) {
          ctx.fillStyle = "var(--destructive)"
          ctx.fillRect(boss.x, boss.y - 20, boss.width, 10)
          ctx.fillStyle = "var(--primary)"
          ctx.fillRect(
            boss.x,
            boss.y - 20,
            boss.width * (boss.hp / boss.maxHp),
            10
          )
          ctx.save()
          if (isBossImageLoaded) {
            ctx.beginPath()
            ctx.arc(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              boss.width / 2,
              0,
              Math.PI * 2
            )
            ctx.clip()
            ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height)
          } else {
            ctx.beginPath()
            ctx.arc(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              boss.width / 2,
              0,
              Math.PI * 2
            )
            ctx.fillStyle = boss.color
            ctx.fill()
          }
          ctx.restore()
        } else {
          monsters.forEach((m, i) => {
            ctx.fillStyle = m.color
            ctx.globalAlpha = 1 - (i % monsterRows) * 0.15
            ctx.fillRect(m.x, m.y, m.width, m.height)
          })
        }
        ctx.globalAlpha = 1
        ctx.fillStyle = foregroundColor
        ctx.font = "20px sans-serif"
        ctx.textAlign = "left"
        ctx.fillText(`Level: ${level}`, 10, 30)
      }
    }

    // --- MAIN LOOP & CLEANUP ---
    let animationFrameId: number
    const gameLoop = () => {
      update()
      render()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      createStars()
      if (isGameActive) handleStartGame()
    }
    window.addEventListener("resize", handleResize)

    handleStartGame()
    createStars()
    gameLoop()

    return () => {
      setIsBossActive(false)
      setIsGameOver(false)
      setGameController(null)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [setIsBossActive, setIsGameOver, setGameController])

  return (
    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
  )
}

export default PixelWar
