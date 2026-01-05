import { useUserStore } from '@/store/userStore'

export function useAuth() {
  const { user, isAuthenticated, isLoading, createGuestUser, logout } = useUserStore()

  const signOut = () => {
    logout()
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    createGuestUser,
    signOut,
  }
}
