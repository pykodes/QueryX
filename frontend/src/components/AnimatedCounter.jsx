import { useEffect, useState } from 'react'

function AnimatedCounter({ value, suffix = '', prefix = '', decimals = 0, duration = 1400 }) {
  const [currentValue, setCurrentValue] = useState(0)

  useEffect(() => {
    let animationFrame = 0
    const startTime = performance.now()

    const updateCount = (time) => {
      const progress = Math.min((time - startTime) / duration, 1)
      const easedProgress = 1 - (1 - progress) ** 3
      setCurrentValue(value * easedProgress)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount)
      }
    }

    animationFrame = requestAnimationFrame(updateCount)

    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  const formattedValue = Number(currentValue).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
