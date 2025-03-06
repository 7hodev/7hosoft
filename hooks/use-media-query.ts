"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Función para actualizar el estado
    const updateMatches = () => {
      setMatches(media.matches)
    }
    
    // Establecer valor inicial
    updateMatches()
    
    // Agregar listener para los cambios
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', updateMatches)
      return () => media.removeEventListener('change', updateMatches)
    } else {
      // Fallback para navegadores más antiguos
      media.addListener(updateMatches)
      return () => media.removeListener(updateMatches)
    }
  }, [query])

  return matches
}

