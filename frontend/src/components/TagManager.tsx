import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { getTags, createTag, Tag } from '@/services/document.service'
import { useToast } from '@/contexts/ToastContext'

interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
  selectedTags: number[]
  onTagsSelected: (tagIds: number[]) => void
}

export default function TagManager({ 
  isOpen, 
  onClose, 
  selectedTags, 
  onTagsSelected 
}: TagManagerProps) {
  const { showSuccess, showError } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [localSelectedTags, setLocalSelectedTags] = useState<number[]>(selectedTags)

  // Load tags when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTags()
      setLocalSelectedTags(selectedTags)
    }
  }, [isOpen, selectedTags])

  const loadTags = async () => {
    try {
      setLoading(true)
      const tagsData = await getTags()
      setTags(tagsData)
    } catch (error) {
      console.error('Error loading tags:', error)
      showError('Erreur', 'Impossible de charger les tags')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      showError('Erreur', 'Le nom du tag est requis')
      return
    }

    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      showError('Erreur', 'Ce tag existe déjà')
      return
    }

    try {
      setCreatingTag(true)
      const newTag = await createTag({ name: newTagName.trim() })
      setTags(prev => [...prev, newTag])
      setNewTagName('')
      showSuccess('Succès', 'Tag créé avec succès')
    } catch (error) {
      console.error('Error creating tag:', error)
      showError('Erreur', 'Impossible de créer le tag')
    } finally {
      setCreatingTag(false)
    }
  }

  const handleTagToggle = (tagId: number) => {
    setLocalSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSave = () => {
    onTagsSelected(localSelectedTags)
    onClose()
  }

  const handleCancel = () => {
    setLocalSelectedTags(selectedTags)
    onClose()
  }

  // Filter tags based on search term
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Gérer les tags
                </Dialog.Title>

                {/* Create new tag */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Créer un nouveau tag
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nom du tag"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTag()
                        }
                      }}
                    />
                    <button
                      onClick={handleCreateTag}
                      disabled={creatingTag || !newTagName.trim()}
                      className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingTag ? '...' : '+'}
                    </button>
                  </div>
                </div>

                {/* Search tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher des tags
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                {/* Tags list */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner des tags ({localSelectedTags.length})
                  </label>
                  
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {filteredTags.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          {searchTerm ? 'Aucun tag trouvé' : 'Aucun tag disponible'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {filteredTags.map((tag) => (
                            <label
                              key={tag.id}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={localSelectedTags.includes(tag.id!)}
                                onChange={() => handleTagToggle(tag.id!)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected tags preview */}
                {localSelectedTags.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags sélectionnés
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {localSelectedTags.map((tagId) => {
                        const tag = tags.find(t => t.id === tagId)
                        if (!tag) return null
                        return (
                          <span
                            key={tagId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {tag.name}
                            <button
                              onClick={() => handleTagToggle(tagId)}
                              className="ml-1 hover:text-primary-600"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Appliquer ({localSelectedTags.length})
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
