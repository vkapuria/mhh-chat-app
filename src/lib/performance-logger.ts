// Performance logging utilities for API routes
// Tracks timing, query counts, and identifies bottlenecks

export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
  }
  
  export interface PerformanceLog {
    route: string;
    totalDuration: number;
    metrics: PerformanceMetric[];
    timestamp: number;
    queryCount: number;
    warnings: string[];
  }
  
  class PerformanceLogger {
    private metrics: Map<string, PerformanceMetric[]> = new Map();
    private startTimes: Map<string, number> = new Map();
    private routeStart: number = 0;
    private currentRoute: string = '';
    private queryCount: number = 0;
  
    // Start tracking a route
    startRoute(route: string) {
      this.currentRoute = route;
      this.routeStart = Date.now();
      this.metrics.set(route, []);
      this.queryCount = 0;
    }
  
    // Start tracking a specific operation
    start(operationName: string) {
      const key = `${this.currentRoute}:${operationName}`;
      this.startTimes.set(key, Date.now());
    }
  
    // End tracking an operation
    end(operationName: string, metadata?: Record<string, any>) {
      const key = `${this.currentRoute}:${operationName}`;
      const startTime = this.startTimes.get(key);
      
      if (!startTime) {
        console.warn(`⚠️ No start time found for: ${operationName}`);
        return;
      }
  
      const duration = Date.now() - startTime;
      const metric: PerformanceMetric = {
        name: operationName,
        duration,
        timestamp: Date.now(),
        metadata,
      };
  
      const routeMetrics = this.metrics.get(this.currentRoute) || [];
      routeMetrics.push(metric);
      this.metrics.set(this.currentRoute, routeMetrics);
  
      this.startTimes.delete(key);
  
      // Track database queries
      if (operationName.includes('query') || operationName.includes('supabase')) {
        this.queryCount++;
      }
    }
  
    // Track a database query specifically
    trackQuery(queryName: string) {
      this.queryCount++;
      return {
        start: () => this.start(queryName),
        end: (metadata?: Record<string, any>) => this.end(queryName, metadata),
      };
    }
  
    // End route tracking and generate report
    endRoute(): PerformanceLog {
      const totalDuration = Date.now() - this.routeStart;
      const routeMetrics = this.metrics.get(this.currentRoute) || [];
      
      // Analyze for warnings
      const warnings: string[] = [];
      
      // Check for slow operations (>500ms)
      const slowOps = routeMetrics.filter(m => m.duration > 500);
      if (slowOps.length > 0) {
        warnings.push(`${slowOps.length} slow operation(s) detected (>500ms)`);
      }
  
      // Check for excessive queries
      if (this.queryCount > 10) {
        warnings.push(`High query count: ${this.queryCount} queries (possible N+1 problem)`);
      }
  
      // Check for total slow response
      if (totalDuration > 1000) {
        warnings.push(`Slow API response: ${totalDuration}ms (target: <1000ms)`);
      }
  
      const log: PerformanceLog = {
        route: this.currentRoute,
        totalDuration,
        metrics: routeMetrics,
        timestamp: Date.now(),
        queryCount: this.queryCount,
        warnings,
      };
  
      return log;
    }
  
    // Pretty print the performance log
    printLog(log: PerformanceLog) {
      const hasWarnings = log.warnings.length > 0;
      const emoji = hasWarnings ? '⚠️' : '✅';
      const color = hasWarnings ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
  
      console.log('\n' + '='.repeat(80));
      console.log(`${emoji} ${color}[PERFORMANCE]${reset} ${log.route}`);
      console.log(`${color}Total Duration: ${log.totalDuration}ms${reset}`);
      console.log(`Database Queries: ${log.queryCount}`);
      
      if (log.warnings.length > 0) {
        console.log(`\n⚠️  ${color}WARNINGS:${reset}`);
        log.warnings.forEach(w => console.log(`   • ${w}`));
      }
  
      console.log('\n📊 Operation Breakdown:');
      
      // Sort by duration (slowest first)
      const sortedMetrics = [...log.metrics].sort((a, b) => b.duration - a.duration);
      
      sortedMetrics.forEach(metric => {
        const isSlow = metric.duration > 500;
        const icon = isSlow ? '🔴' : metric.duration > 200 ? '🟡' : '🟢';
        const metaStr = metric.metadata ? ` (${JSON.stringify(metric.metadata)})` : '';
        console.log(`   ${icon} ${metric.name}: ${metric.duration}ms${metaStr}`);
      });
  
      console.log('='.repeat(80) + '\n');
    }
  }
  
  // Export singleton instance
  export const perfLogger = new PerformanceLogger();
  
  // Export helper function to wrap async operations with timing
  export async function trackAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    perfLogger.start(name);
    try {
      const result = await fn();
      perfLogger.end(name, metadata);
      return result;
    } catch (error) {
      perfLogger.end(name, { ...metadata, error: true });
      throw error;
    }
  }