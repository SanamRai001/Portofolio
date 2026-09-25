import { useEffect } from 'react'
import { observeSectionReveals } from './sectionReveals.js'
import './sectionReveals.css'

export default function useSectionReveals(rootRef, suspended) {
  useEffect(() => {
    if (suspended) return undefined
    return observeSectionReveals(rootRef.current)
  }, [rootRef, suspended])
}
