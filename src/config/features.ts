// Feature flags configuration
export const FEATURE_FLAGS = {
  // Enable detailed bridge flow chart
  DETAILED_BRIDGE_FLOW_CHART: process.env.NEXT_PUBLIC_DETAILED_BRIDGE_FLOW_CHART !== 'false',
  
  // Enable rollback mode
  ENABLE_ROLLBACK: process.env.NEXT_PUBLIC_ENABLE_ROLLBACK === 'true',
  
  // Enable performance monitoring
  PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
};