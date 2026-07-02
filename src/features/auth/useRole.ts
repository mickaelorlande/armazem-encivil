import { useAuth } from './AuthContext'
import type { RoleUtilizador } from '@/integrations/supabase/types'

// Módulos com escrita controlada por papel.
export type Modulo = 'armazem' | 'ferramentas' | 'combustivel' | 'obras' | 'subempreitadas'

// Fonte única da verdade no frontend — TEM de espelhar public.pode_escrever()
// no backend (migration 20260702000004_rbac_permissoes.sql). A segurança real
// é a RLS; isto serve só para mostrar/esconder ações na UI.
const MATRIZ_ESCRITA: Record<Modulo, RoleUtilizador[]> = {
  armazem:        ['admin', 'gestor', 'armazem'],
  ferramentas:    ['admin', 'gestor', 'armazem'],
  combustivel:    ['admin', 'gestor', 'armazem'],
  obras:          ['admin', 'gestor'],
  subempreitadas: ['admin', 'gestor', 'medicoes'],
}

export function useRole() {
  const { profile, loading } = useAuth()
  const role = (profile?.role ?? null) as RoleUtilizador | null

  const podeEscrever = (modulo: Modulo): boolean =>
    role != null && MATRIZ_ESCRITA[modulo].includes(role)

  return {
    role,
    loading,
    isAdmin:  role === 'admin',
    isGestor: role === 'gestor',
    nome:     profile?.nome ?? '',
    // Capacidades de escrita por módulo (espelham a RLS)
    podeEscrever,
    podeArmazem:        podeEscrever('armazem'),
    podeFerramentas:    podeEscrever('ferramentas'),
    podeObras:          podeEscrever('obras'),
    podeSubempreitadas: podeEscrever('subempreitadas'),
    // Só admin valida (rascunho -> validado)
    podeValidar: role === 'admin',
  }
}
