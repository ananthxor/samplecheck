import { useCallback, useRef, useState } from 'react'
import type { TemplateConfig } from '@/features/templates/formats/registry'

interface EditorState {
  config: TemplateConfig
  setConfig: (config: TemplateConfig) => void
  updateConfig: (partial: Partial<TemplateConfig>) => void
  isDirty: boolean
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
  selectedSize: { width: number; height: number }
  setSelectedSize: (size: { width: number; height: number }) => void
  resetDirty: () => void
}

/**
 * Page-scoped hook managing the editor's mutable state.
 * Tracks config changes, dirty state, save status, and selected creative size.
 */
export function useEditorState(
  initialConfig: TemplateConfig,
  _creativeId?: string
): EditorState {
  const [config, setConfigState] = useState<TemplateConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedSize, setSelectedSize] = useState<{
    width: number
    height: number
  }>({ width: 300, height: 250 })

  // Track last saved config for dirty comparison
  const savedConfigRef = useRef<string>(JSON.stringify(initialConfig))

  const isDirty = JSON.stringify(config) !== savedConfigRef.current

  const setConfig = useCallback((newConfig: TemplateConfig) => {
    setConfigState(newConfig)
  }, [])

  const updateConfig = useCallback(
    (partial: Partial<TemplateConfig>) => {
      setConfigState((prev) => ({ ...prev, ...partial }) as TemplateConfig)
    },
    []
  )

  const resetDirty = useCallback(() => {
    savedConfigRef.current = JSON.stringify(config)
    // Force a re-render by setting config to the same value
    setConfigState((prev) => ({ ...prev }))
  }, [config])

  return {
    config,
    setConfig,
    updateConfig,
    isDirty,
    isSaving,
    setIsSaving,
    selectedSize,
    setSelectedSize,
    resetDirty,
  }
}
