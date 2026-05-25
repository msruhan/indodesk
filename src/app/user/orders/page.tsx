'use client'

import { MyOrdersView } from '@/components/orders/my-orders-view'

export default function UserOrdersPage() {
  return <MyOrdersView basePath="/user/orders" />
}
