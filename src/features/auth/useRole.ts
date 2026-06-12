import { useAuth } from './AuthContext'
import type { RoleUtilizador } from '@/integrations/supabase/types'

export function useRole() {
  const { profile, loading } = useAuth()
  return {
    role:     profile?.role ?? (null as RoleUtilizador | null),
    loading,
    isAdmin:  profile?.role === 'admin',
    isGestor: profile?.role === 'gestor',
    nome:     profile?.nome ?? '',
  }
}
