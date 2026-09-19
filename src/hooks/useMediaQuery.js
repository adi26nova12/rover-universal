import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const MOBILE_QUERY = '(max-width: 768px)'
export const DESKTOP_QUERY = '(min-width: 769px)'
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

export const useIsMobile = () => useMediaQuery(MOBILE_QUERY)
export const useReducedMotion = () => useMediaQuery(REDUCED_QUERY)
