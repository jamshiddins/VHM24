import { Redis } from 'ioredis';

export declare const redis: Redis;

export declare class CacheManager {
  constructor(prefix?: string);
  prefix: string;
  defaultTTL: number;
  
  getKey(key: string): string;
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  deletePattern(pattern: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  flush(): Promise<boolean>;
  cache<T = any>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
  invalidate(patterns: string[]): Promise<boolean>;
}

export declare const cacheManagers: {
  auth: CacheManager;
  machines: CacheManager;
  inventory: CacheManager;
  tasks: CacheManager;
  reports: CacheManager;
  telegram: CacheManager;
};

export declare function cacheable(
  keyGenerator: string | ((this: any, ...args: any[]) => string),
  ttl?: number
): MethodDecorator;

export interface CacheMiddlewareOptions {
  keyGenerator?: (req: any) => string;
  ttl?: number;
  serviceName?: string;
  condition?: (req: any) => boolean;
}

export declare function cacheMiddleware(options?: CacheMiddlewareOptions): (req: any, reply: any) => Promise<void>;
