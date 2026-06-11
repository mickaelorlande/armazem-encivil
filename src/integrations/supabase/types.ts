export type TipoMovimento = 'entrada' | 'saida' | 'ajuste'
export type RoleUtilizador = 'admin' | 'gestor'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          role: RoleUtilizador
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          role?: RoleUtilizador
          created_at?: string
        }
        Update: {
          nome?: string
          email?: string
          role?: RoleUtilizador
        }
      }
      produtos: {
        Row: {
          id: string
          codigo: string
          nome: string
          categoria: string
          unidade: string
          stock_atual: number
          stock_minimo: number
          ativo: boolean
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          nome: string
          categoria: string
          unidade: string
          stock_atual?: number
          stock_minimo?: number
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          nome?: string
          categoria?: string
          unidade?: string
          stock_atual?: number
          stock_minimo?: number
          ativo?: boolean
          observacoes?: string | null
          updated_at?: string
        }
      }
      movimentos_stock: {
        Row: {
          id: string
          produto_id: string
          tipo: TipoMovimento
          quantidade: number
          stock_antes: number
          stock_depois: number
          responsavel: string
          destino_obra: string | null
          observacoes: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          produto_id: string
          tipo: TipoMovimento
          quantidade: number
          stock_antes: number
          stock_depois: number
          responsavel: string
          destino_obra?: string | null
          observacoes?: string | null
          created_at?: string
          created_by: string
        }
        Update: never
      }
      configuracoes_empresa: {
        Row: {
          id: string
          nome_empresa: string
          logo_url: string | null
          responsavel_armazem: string | null
          stock_minimo_padrao: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_empresa?: string
          logo_url?: string | null
          responsavel_armazem?: string | null
          stock_minimo_padrao?: number
        }
        Update: {
          nome_empresa?: string
          logo_url?: string | null
          responsavel_armazem?: string | null
          stock_minimo_padrao?: number
          updated_at?: string
        }
      }
    }
    Enums: {
      tipo_movimento: TipoMovimento
      role_utilizador: RoleUtilizador
    }
  }
}
