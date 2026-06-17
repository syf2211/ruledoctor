// 订单服务 —— 注释一律使用中文
export interface OrderRow {
  id: number
  price: number // 金额（应为整数「分」，此处错误地用了浮点）
  createdAt: string // 创建时间
  data: any // 扩展数据
}

export function loadOrders(): OrderRow[] {
  const row: OrderRow = {
    id: 1,
    price: 99.5, // 错误：浮点金额
    createdAt: "2026/06/16", // 错误：斜杠日期
    data: null,
  }
  if (!row.id) {
    throw new ErrorXxx("订单金额错误")
  }
  return [row]
}
