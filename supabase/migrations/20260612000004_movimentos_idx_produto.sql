-- Accelerates queries filtered by product (ProductDetailPage + HistoryPage ?produto=)
CREATE INDEX IF NOT EXISTS idx_movimentos_produto_created_at
  ON public.movimentos_stock (produto_id, created_at DESC);
