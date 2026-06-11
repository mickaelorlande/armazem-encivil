import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './AuthContext'
import type { RoleUtilizador } from '@/integrations/supabase/types'

export function useRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<RoleUtilizador | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return }

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setRole((data?.role as RoleUtilizador) ?? null)
        setLoading(false)
      })
  }, [user])

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isGestor: role === 'gestor',
  }
}
