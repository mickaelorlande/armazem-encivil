export type MovementType = 'entrada' | 'saida' | 'ajuste';

export type ProductCategory =
  | 'cimento'
  | 'areia-brita'
  | 'tijolo-bloco'
  | 'tinta'
  | 'tubagem'
  | 'ferragem'
  | 'ferramenta'
  | 'madeira'
  | 'outro';

export type Unit = 'saco' | 'unidade' | 'kg' | 'litro' | 'caixa' | 'metro' | 'm2' | 'm3';

export type StockStatus = 'normal' | 'baixo' | 'sem-stock';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: Unit;
  currentStock: number;
  minStock: number;
  status: StockStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  unit: Unit;
  responsible: string;
  destination?: string;
  obra?: string;
  notes?: string;
  date: Date;
  previousStock: number;
  newStock: number;
}

export type LowStockItem = Pick<Product, 'id' | 'name' | 'unit' | 'currentStock' | 'minStock' | 'status'>;

export type ToolCategory =
  | 'manual'
  | 'eletrica'
  | 'medicao'
  | 'seguranca'
  | 'outro';

export type ToolStatus = 'disponivel' | 'emprestada' | 'manutencao' | 'inativa';

export interface Tool {
  id: string;
  code: string;
  name: string;
  category: ToolCategory;
  serialNumber?: string;
  estimatedValue?: number;
  status: ToolStatus;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LoanStatus = 'ativo' | 'devolvido';
export type ReturnCondition = 'bom_estado' | 'danificada' | 'perdida';

export interface ToolLoan {
  id: string;
  toolId: string;
  toolName: string;
  toolCode: string;
  employeeName: string;
  employeeDocument?: string;
  destination?: string;
  loanDate: Date;
  expectedReturnDate?: Date;
  returnDate?: Date;
  status: LoanStatus;
  deliveryCondition?: string;
  returnCondition?: ReturnCondition;
  notes?: string;
  returnNotes?: string;
  deliveredBy: string;
  receivedBy?: string;
  deliverySignature?: string;
  returnSignature?: string;
}

export interface DashboardStats {
  totalProducts: number;
  todayEntries: number;
  todayExits: number;
  lowStockProducts: number;
  recentMovements: Movement[];
  lowStockItems: LowStockItem[];
}
