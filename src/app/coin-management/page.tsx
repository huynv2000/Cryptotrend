'use client'

import { CoinManagementPanel } from '@/components/CoinManagementPanel'

export default function CoinManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚙️ Quản lý Coin
              </h1>
              <p className="text-gray-600 mt-1">
                Thêm, xóa và quản lý các đồng coin trong hệ thống phân tích
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <CoinManagementPanel />
      </div>
    </div>
  )
}