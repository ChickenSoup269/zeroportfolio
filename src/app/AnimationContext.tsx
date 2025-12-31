/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react"

export type AnimationType = "none" | "rain" | "war"

interface GameController {
  startGame: () => void
}

interface AnimationContextValue {
  animation: AnimationType
  setAnimation: (value: AnimationType) => void
  isBossActive: boolean
  setIsBossActive: (value: boolean) => void
  isGameOver: boolean
  setIsGameOver: (value: boolean) => void
  gameController: GameController | null
  setGameController: (controller: GameController | null) => void
}

const AnimationContext = createContext<AnimationContextValue | undefined>(
  undefined
)

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const [animation, setAnimation] = useState<AnimationType>("rain")
  const [isBossActive, setIsBossActive] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameController, setGameController] = useState<GameController | null>(null)

  useEffect(() => {
    const savedState = localStorage.getItem(
      "animation-type"
    ) as AnimationType | null
    if (savedState && ["none", "rain", "war"].includes(savedState)) {
      setAnimation(savedState)
    } else {
      setAnimation("rain") // Default value
    }
  }, [])

  const handleSetAnimation = (value: AnimationType) => {
    setAnimation(value)
    localStorage.setItem("animation-type", value)
  }

  return (
    <AnimationContext.Provider
      value={{
        animation,
        setAnimation: handleSetAnimation,
        isBossActive,
        setIsBossActive,
        isGameOver,
        setIsGameOver,
        gameController,
        setGameController,
      }}
    >
      {children}
    </AnimationContext.Provider>
  )
}

export const useAnimation = (): AnimationContextValue => {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error("useAnimation must be used within an AnimationProvider")
  }
  return context
}
