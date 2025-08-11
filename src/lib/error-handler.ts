/**
 * Error Handler Utility
 * 
 * Utility này cung cấp các hàm xử lý lỗi chung cho ứng dụng,
 * bao gồm xử lý lỗi từ API, lỗi mạng, và lỗi runtime.
 * 
 * @author Crypto Analytics Team
 * @version 1.0
 */

/**
 * Interface cho cấu hình lỗi
 */
interface ErrorConfig {
  message: string
  code?: string
  details?: any
  timestamp: string
}

/**
 * Xử lý lỗi Clipboard API một cách an toàn
 */
export const handleClipboardError = (error: Error): void => {
  console.warn('Clipboard API error:', error.message)
  
  // Không hiển thị lỗi cho người dùng vì đây là tính năng không quan trọng
  // Chỉ log để debug
}

/**
 * Xử lý lỗi runtime một cách an toàn
 */
export const handleRuntimeError = (error: Error, context?: string): void => {
  console.error(`Runtime error${context ? ` in ${context}` : ''}:`, error)
  
  // Gửi lỗi đến dịch vụ monitoring nếu có
  if (typeof window !== 'undefined' && window.navigator) {
    // Có thể tích hợp với dịch vụ monitoring như Sentry, LogRocket, etc.
    // Hiện tại chỉ log ra console
  }
}

/**
 * Tạo thông báo lỗi thân thiện với người dùng
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  if (!error) return 'Đã xảy ra lỗi không xác định'
  
  // Xử lý các loại lỗi cụ thể
  if (error.name === 'NotAllowedError' && error.message.includes('clipboard')) {
    return 'Không thể sao chép vào clipboard. Vui lòng sử dụng tính năng này trong môi trường bảo mật hơn.'
  }
  
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.'
  }
  
  if (error.code === 'ETIMEDOUT') {
    return 'Yêu cầu đã hết hạn. Vui lòng thử lại sau.'
  }
  
  if (error.status === 429) {
    return 'Quá nhiều yêu cầu. Vui lòng đợi một chút trước khi thử lại.'
  }
  
  if (error.status === 401) {
    return 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.'
  }
  
  if (error.status === 403) {
    return 'Truy cập bị từ chối. Vui lòng liên hệ quản trị viên.'
  }
  
  if (error.status === 404) {
    return 'Không tìm thấy tài nguyên được yêu cầu.'
  }
  
  if (error.status >= 500) {
    return 'Lỗi máy chủ. Vui lòng thử lại sau.'
  }
  
  // Trả về message mặc định nếu không match trường hợp nào
  return error.message || 'Đã xảy ra lỗi không xác định'
}

/**
 * Wrapper cho các hàm có thể gây ra lỗi Clipboard API
 */
export const safeClipboardOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    handleClipboardError(error as Error)
    return fallback
  }
}

/**
 * Wrapper cho các hàm có thể gây ra lỗi runtime
 */
export const safeRuntimeOperation = <T>(
  operation: () => T,
  fallback: T,
  context?: string
): T => {
  try {
    return operation()
  } catch (error) {
    handleRuntimeError(error as Error, context)
    return fallback
  }
}

/**
 * Global error handler
 */
export const setupGlobalErrorHandlers = (): void => {
  if (typeof window === 'undefined') return
  
  // Xử lý unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    event.preventDefault()
  })
  
  // Xử lý uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error)
    
    // Nếu là lỗi Clipboard API, không hiển thị cho người dùng
    if (event.error?.message?.includes('clipboard')) {
      event.preventDefault()
    }
  })
}

// Khởi tạo global error handlers khi module được import
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers()
}