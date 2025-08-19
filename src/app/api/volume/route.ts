import { NextRequest, NextResponse } from 'next/server'
import { volumeService } from '@/lib/volume-service'

/**
 * API Route xử lý dữ liệu khối lượng giao dịch
 * 
 * Endpoint này cung cấp:
 * - Lấy dữ liệu khối lượng lịch sử cho một tiền điện tử cụ thể
 * - Phân tích khối lượng với đường trung bình động 30 ngày
 * - Cập nhật dữ liệu khối lượng theo yêu cầu
 * 
 * Query parameters:
 * - cryptoId: ID của tiền điện tử (bắt buộc)
 * - days: Số ngày dữ liệu (mặc định: 90)
 * - action: Loại hành động ('history' hoặc 'analysis')
 * 
 * @author Crypto Analytics Team
 * @version 2.0
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cryptoId = searchParams.get('cryptoId')
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 90
    const action = searchParams.get('action') || 'history'

    if (!cryptoId) {
      return NextResponse.json(
        { error: 'Thiếu tham số cryptoId' },
        { status: 400 }
      )
    }

    console.log(`📊 Đang lấy dữ liệu khối lượng cho ${cryptoId} (${days} ngày, hành động: ${action})`)

    if (action === 'analysis') {
      const analysis = await volumeService.getVolumeAnalysis(cryptoId)
      return NextResponse.json(analysis)
    } else {
      const history = await volumeService.getVolumeHistory(cryptoId, days)
      return NextResponse.json({ history })
    }

  } catch (error) {
    console.error('Lỗi trong API volume:', error)
    return NextResponse.json(
      { 
        error: 'Lỗi máy chủ nội bộ', 
        chi_tiet: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cryptoId, action } = body

    if (!cryptoId) {
      return NextResponse.json(
        { error: 'cryptoId là bắt buộc' },
        { status: 400 }
      )
    }

    if (action === 'update') {
      console.log(`🔄 Đang cập nhật dữ liệu khối lượng cho ${cryptoId}`)
      await volumeService.getVolumeAnalysis(cryptoId)
      return NextResponse.json({ message: 'Cập nhật dữ liệu khối lượng thành công' })
    }

    return NextResponse.json({ error: 'Hành động không xác định' }, { status: 400 })

  } catch (error) {
    console.error('Lỗi trong API volume POST:', error)
    return NextResponse.json(
      { 
        error: 'Lỗi máy chủ nội bộ', 
        chi_tiet: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}