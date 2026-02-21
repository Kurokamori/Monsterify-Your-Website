import { useState, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { ConfirmModal, useConfirmModal, LoadingSpinner } from '@components/common'
import antiqueService, { type AntiqueSetting, type AntiqueSettingSaveInput, type OverrideParameters } from '@services/antiqueService'

// ============================================================================
// Constants
// ============================================================================

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
]

const CATEGORIES = [
  'American Holidays',
  'Jewish Holidays',
  'Russian Holidays',
  'Indian Holidays',
  'Chinese Holidays',
]

const HOLIDAYS: Record<string, string[]> = {
  'American Holidays': ["New Year's", "Valentine's Day", "St. Patrick's Day", "April Fool's Day", 'Easter', 'Independence Day', 'Halloween', 'Thanksgiving', 'Christmas'],
  'Jewish Holidays': ['Rosh Hashanah', 'Yom Kippur', 'Sukkot', 'Hanukkah', 'Purim', 'Passover'],
  'Russian Holidays': ["New Year's", 'Old New Year', 'Defender of the Fatherland Day', 'Victory Day', 'Maslenitsa'],
  'Indian Holidays': ['Diwali', 'Holi', 'Raksha Bandhan', 'Ganesh Chaturthi', 'Independence Day'],
  'Chinese Holidays': ['Lunar New Year'],
}

const FUSION_MODES = [
  { value: 'default', label: 'Default' },
  { value: 'force_fusion', label: 'Force Fusion' },
  { value: 'force_no_fusion', label: 'Force No Fusion' },
  { value: 'allow_fusion', label: 'Allow Fusion' },
] as const

type FusionMode = typeof FUSION_MODES[number]['value']

// ============================================================================
// Helpers
// ============================================================================

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    if (resp?.data?.message) return resp.data.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

function getFusionMode(setting: AntiqueSetting): FusionMode {
  if (setting.forceFusion) return 'force_fusion'
  if (setting.forceNoFusion) return 'force_no_fusion'
  if (setting.allowFusion === false) return 'allow_fusion'
  return 'default'
}

function buildSaveInput(form: FormState): AntiqueSettingSaveInput {
  const params: OverrideParameters = {}

  // Species
  if (form.species.length > 0) params.species = form.species
  if (form.speciesAll.length > 0) params.species_all = form.speciesAll
  if (form.species1.length > 0) params.species1 = form.species1
  if (form.species2.length > 0) params.species2 = form.species2
  if (form.species3.length > 0) params.species3 = form.species3

  // Types
  if (form.typeGlobal.length > 0) params.type = form.typeGlobal
  if (form.type1.length > 0) params.type1 = form.type1
  if (form.type2.length > 0) params.type2 = form.type2
  if (form.type3.length > 0) params.type3 = form.type3
  if (form.type4.length > 0) params.type4 = form.type4
  if (form.type5.length > 0) params.type5 = form.type5
  if (form.maxTypes !== 5) params.max_types = form.maxTypes

  // Attributes
  if (form.attributes.length > 0) params.attribute = form.attributes

  return {
    category: form.category,
    holiday: form.holiday,
    rollCount: form.rollCount,
    forceFusion: form.fusionMode === 'force_fusion' ? true : null,
    forceNoFusion: form.fusionMode === 'force_no_fusion' ? true : null,
    allowFusion: form.fusionMode === 'allow_fusion' ? false : null,
    forceMinTypes: form.forceMinTypes > 0 ? form.forceMinTypes : null,
    overrideParameters: params,
  }
}

// ============================================================================
// Form State
// ============================================================================

interface FormState {
  category: string
  holiday: string
  rollCount: number
  fusionMode: FusionMode
  forceMinTypes: number
  species: string[]
  speciesAll: string[]
  species1: string[]
  species2: string[]
  species3: string[]
  typeGlobal: string[]
  type1: string[]
  type2: string[]
  type3: string[]
  type4: string[]
  type5: string[]
  maxTypes: number
  attributes: string[]
}

function settingToFormState(s: AntiqueSetting): FormState {
  const p = s.overrideParameters ?? {}
  return {
    category: s.category,
    holiday: s.holiday,
    rollCount: s.rollCount,
    fusionMode: getFusionMode(s),
    forceMinTypes: s.forceMinTypes ?? 0,
    species: (p.species as string[]) ?? [],
    speciesAll: (p.species_all as string[]) ?? [],
    species1: (p.species1 as string[]) ?? [],
    species2: (p.species2 as string[]) ?? [],
    species3: (p.species3 as string[]) ?? [],
    typeGlobal: (p.type as string[]) ?? [],
    type1: (p.type1 as string[]) ?? [],
    type2: (p.type2 as string[]) ?? [],
    type3: (p.type3 as string[]) ?? [],
    type4: (p.type4 as string[]) ?? [],
    type5: (p.type5 as string[]) ?? [],
    maxTypes: (p.max_types as number) ?? 5,
    attributes: (p.attribute as string[]) ?? [],
  }
}

// ============================================================================
// Tag Input Sub-Component
// ============================================================================

function TagInput({
  tags,
  onChange,
  placeholder = 'Add value...',
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const addTag = useCallback(() => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }, [input, tags, onChange])

  const removeTag = useCallback((index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }, [tags, onChange])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }, [addTag])

  return (
    <div className="appraisal-editor__tag-input">
      {tags.length > 0 && (
        <div className="appraisal-editor__tags">
          {tags.map((tag, i) => (
            <span key={`${tag}-${i}`} className="appraisal-editor__tag">
              {tag}
              <button type="button" onClick={() => removeTag(i)}>&times;</button>
            </span>
          ))}
        </div>
      )}
      <div className="appraisal-editor__tag-add">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button type="button" onClick={addTag}>Add</button>
      </div>
    </div>
  )
}

// ============================================================================
// Type Toggle Grid Sub-Component
// ============================================================================

function TypeToggleGrid({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (types: string[]) => void
}) {
  const toggle = useCallback((type: string) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type))
    } else {
      onChange([...selected, type])
    }
  }, [selected, onChange])

  return (
    <div className="appraisal-editor__type-grid">
      {ALL_TYPES.map(type => (
        <button
          key={type}
          type="button"
          className={`appraisal-editor__type-toggle${selected.includes(type) ? ' appraisal-editor__type-toggle--active' : ''}`}
          onClick={() => toggle(type)}
        >
          {type}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function AntiqueAppraisalEditorPage() {
  useDocumentTitle('Antique Appraisal Editor')

  const [antiques, setAntiques] = useState<AntiqueSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const confirmModal = useConfirmModal()

  // --- Load data ---

  const loadAntiques = useCallback(async () => {
    try {
      const res = await antiqueService.getAntiqueSettings()
      setAntiques(res.data)
    } catch (err) {
      console.error('Failed to load antique settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAntiques()
  }, [loadAntiques])

  // --- Select antique ---

  const selectAntique = useCallback((name: string) => {
    setSelected(name)
    setStatusMsg(null)
    const antique = antiques.find(a => a.itemName === name)
    if (antique) {
      setForm(settingToFormState(antique))
    }
  }, [antiques])

  // --- Form handlers ---

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])

  const handleNumberChange = useCallback((key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    updateField(key, parseInt(e.target.value, 10) || 0)
  }, [updateField])

  // When category changes, reset holiday to first option in that category
  const handleCategoryChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value
    updateField('category', cat)
    const holidays = HOLIDAYS[cat] ?? []
    updateField('holiday', holidays[0] ?? '')
  }, [updateField])

  // --- Save ---

  const handleSave = useCallback(async () => {
    if (!selected || !form) return
    setSaving(true)
    setStatusMsg(null)
    try {
      const input = buildSaveInput(form)
      await antiqueService.saveAntiqueSetting(selected, input)
      setStatusMsg({ type: 'success', text: 'Saved successfully' })
      await loadAntiques()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save') })
    } finally {
      setSaving(false)
    }
  }, [selected, form, loadAntiques])

  // --- Delete ---

  const handleDelete = useCallback(() => {
    if (!selected) return
    confirmModal.confirmDanger(
      `Delete "${selected}" from the database? This cannot be undone.`,
      async () => {
        setSaving(true)
        setStatusMsg(null)
        try {
          await antiqueService.deleteAntiqueSetting(selected)
          setStatusMsg({ type: 'success', text: 'Deleted successfully' })
          setSelected(null)
          setForm(null)
          await loadAntiques()
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete') })
        } finally {
          setSaving(false)
        }
      },
    )
  }, [selected, confirmModal, loadAntiques])

  // --- Filter & group ---

  const filteredAntiques = antiques.filter(a =>
    a.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(antiques.map(a => a.category))]
  const groupedAntiques = categories.map(cat => ({
    category: cat,
    items: filteredAntiques.filter(a => a.category === cat),
  })).filter(g => g.items.length > 0)

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const availableHolidays = form ? (HOLIDAYS[form.category] ?? []) : []

  // --- Render ---

  if (loading) {
    return (
      <div className="main-container">
        <h1>Antique Appraisal Editor</h1>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="main-container">
      <h1>Antique Appraisal Editor</h1>

      <div className="appraisal-editor">
        {/* Sidebar */}
        <div className="appraisal-editor__sidebar">
          <div className="appraisal-editor__search">
            <input
              type="text"
              placeholder="Search antiques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="appraisal-editor__list">
            {groupedAntiques.map(group => (
              <div key={group.category} className="appraisal-editor__category">
                <button
                  type="button"
                  className={`appraisal-editor__category-header${collapsedCategories.has(group.category) ? ' appraisal-editor__category-header--collapsed' : ''}`}
                  onClick={() => toggleCategory(group.category)}
                >
                  <span>
                    {group.category}
                    <span className="appraisal-editor__category-count">({group.items.length})</span>
                  </span>
                  <i className="fas fa-chevron-down" />
                </button>
                {!collapsedCategories.has(group.category) && (
                  <div className="appraisal-editor__category-items">
                    {group.items.map(item => (
                      <button
                        key={item.itemName}
                        type="button"
                        className={`appraisal-editor__item${selected === item.itemName ? ' appraisal-editor__item--selected' : ''}`}
                        onClick={() => selectAntique(item.itemName)}
                      >
                        <div className="appraisal-editor__item-info">
                          <div className="appraisal-editor__item-name">{item.itemName}</div>
                          <div className="appraisal-editor__item-holiday">{item.holiday}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="appraisal-editor__panel">
          {!selected || !form ? (
            <div className="appraisal-editor__empty">
              Select an antique from the list to edit its settings
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="appraisal-editor__header">
                <h2 className="appraisal-editor__title">{selected}</h2>
              </div>

              {/* Form */}
              <div className="appraisal-editor__form">
                {statusMsg && (
                  <div className={`appraisal-editor__status appraisal-editor__status--${statusMsg.type}`}>
                    {statusMsg.text}
                  </div>
                )}

                {/* Category & Holiday */}
                <div className="appraisal-editor__section">
                  <h3 className="appraisal-editor__section-title">
                    <i className="fas fa-tag" /> Category &amp; Holiday
                  </h3>
                  <div className="appraisal-editor__section-body">
                    <div className="appraisal-editor__row">
                      <div className="appraisal-editor__field">
                        <label>Category</label>
                        <select value={form.category} onChange={handleCategoryChange}>
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="appraisal-editor__field">
                        <label>Holiday</label>
                        <select value={form.holiday} onChange={(e) => updateField('holiday', e.target.value)}>
                          {availableHolidays.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Settings */}
                <div className="appraisal-editor__section">
                  <h3 className="appraisal-editor__section-title">
                    <i className="fas fa-cog" /> Basic Settings
                  </h3>
                  <div className="appraisal-editor__section-body">
                    <div className="appraisal-editor__row">
                      <div className="appraisal-editor__field">
                        <label>Roll Count</label>
                        <input
                          type="number"
                          min={1}
                          max={3}
                          value={form.rollCount}
                          onChange={handleNumberChange('rollCount')}
                        />
                      </div>
                      <div className="appraisal-editor__field">
                        <label>Force Min Types</label>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={form.forceMinTypes}
                          onChange={handleNumberChange('forceMinTypes')}
                        />
                      </div>
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Fusion Mode</label>
                      <div className="appraisal-editor__radio-group">
                        {FUSION_MODES.map(mode => (
                          <button
                            key={mode.value}
                            type="button"
                            className={`appraisal-editor__radio-option${form.fusionMode === mode.value ? ' appraisal-editor__radio-option--selected' : ''}`}
                            onClick={() => updateField('fusionMode', mode.value)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Species Overrides */}
                <div className="appraisal-editor__section">
                  <h3 className="appraisal-editor__section-title">
                    <i className="fas fa-paw" /> Species Overrides
                  </h3>
                  <div className="appraisal-editor__section-body">
                    <div className="appraisal-editor__field">
                      <label>Species (general pool)</label>
                      <TagInput tags={form.species} onChange={(v) => updateField('species', v)} placeholder="Add species..." />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Species All (set all slots)</label>
                      <TagInput tags={form.speciesAll} onChange={(v) => updateField('speciesAll', v)} placeholder="Add species..." />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Species 1</label>
                      <TagInput tags={form.species1} onChange={(v) => updateField('species1', v)} placeholder="Add species..." />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Species 2</label>
                      <TagInput tags={form.species2} onChange={(v) => updateField('species2', v)} placeholder="Add species..." />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Species 3</label>
                      <TagInput tags={form.species3} onChange={(v) => updateField('species3', v)} placeholder="Add species..." />
                    </div>
                  </div>
                </div>

                {/* Type Restrictions */}
                <div className="appraisal-editor__section">
                  <h3 className="appraisal-editor__section-title">
                    <i className="fas fa-shield-alt" /> Type Restrictions
                  </h3>
                  <div className="appraisal-editor__section-body">
                    <div className="appraisal-editor__field">
                      <label>Max Types</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={form.maxTypes}
                        onChange={handleNumberChange('maxTypes')}
                      />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Type (global restriction)</label>
                      <TypeToggleGrid selected={form.typeGlobal} onChange={(v) => updateField('typeGlobal', v)} />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Type 1</label>
                      <TypeToggleGrid selected={form.type1} onChange={(v) => updateField('type1', v)} />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Type 2</label>
                      <TypeToggleGrid selected={form.type2} onChange={(v) => updateField('type2', v)} />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Type 3</label>
                      <TypeToggleGrid selected={form.type3} onChange={(v) => updateField('type3', v)} />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Type 4</label>
                      <TypeToggleGrid selected={form.type4} onChange={(v) => updateField('type4', v)} />
                    </div>
                    <div className="appraisal-editor__field">
                      <label>Type 5</label>
                      <TypeToggleGrid selected={form.type5} onChange={(v) => updateField('type5', v)} />
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div className="appraisal-editor__section">
                  <h3 className="appraisal-editor__section-title">
                    <i className="fas fa-star" /> Attributes
                  </h3>
                  <div className="appraisal-editor__section-body">
                    <div className="appraisal-editor__field">
                      <label>Attribute (random pick from list)</label>
                      <TagInput tags={form.attributes} onChange={(v) => updateField('attributes', v)} placeholder="Add attribute..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="appraisal-editor__actions">
                <button
                  type="button"
                  className="appraisal-editor__btn appraisal-editor__btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="appraisal-editor__btn appraisal-editor__btn--danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete Antique
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  )
}
