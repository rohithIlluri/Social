import { create } from 'zustand'
import type { NearbyUser, Encounter, Interaction } from '@/types'

interface EncounterState {
  nearbyUsers: NearbyUser[]
  activeEncounter: Encounter | null
  interactions: Interaction[]

  // Actions
  setNearbyUsers: (users: NearbyUser[]) => void
  addNearbyUser: (user: NearbyUser) => void
  removeNearbyUser: (userId: string) => void
  setActiveEncounter: (encounter: Encounter | null) => void
  addInteraction: (interaction: Interaction) => void
  clearInteractions: () => void
}

export const useEncounterStore = create<EncounterState>((set, get) => ({
  nearbyUsers: [],
  activeEncounter: null,
  interactions: [],

  setNearbyUsers: (nearbyUsers) => set({ nearbyUsers }),

  addNearbyUser: (user) => {
    const { nearbyUsers } = get()
    const exists = nearbyUsers.find((u) => u.id === user.id)
    if (!exists) {
      set({ nearbyUsers: [...nearbyUsers, user] })
    }
  },

  removeNearbyUser: (userId) => {
    const { nearbyUsers } = get()
    set({ nearbyUsers: nearbyUsers.filter((u) => u.id !== userId) })
  },

  setActiveEncounter: (activeEncounter) => set({ activeEncounter }),

  addInteraction: (interaction) => {
    const { interactions } = get()
    set({ interactions: [...interactions, interaction] })
  },

  clearInteractions: () => set({ interactions: [] }),
}))
