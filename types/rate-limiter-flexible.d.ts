declare module 'rate-limiter-flexible' {
  export class RateLimiterMemory {
    constructor(options: {
      points: number;
      duration: number;
      blockDuration?: number;
      keyPrefix?: string;
    });
    
    consume(key: string, points?: number, options?: any): Promise<RateLimiterResponse>;
    get(key: string): Promise<RateLimiterResponse | null>;
    delete(key: string): Promise<void>;
  }

  export interface RateLimiterResponse {
    msBeforeNext: number;
    remainingPoints: number;
    consumedPoints: number;
    isFirstInDuration: boolean;
  }

  // Add other classes and interfaces as needed
}
