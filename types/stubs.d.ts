declare module "@/lib/redis" {
  import { Redis as UpstashRedis } from "@upstash/redis";
  export type RedisClient = UpstashRedis;
  export const redis: RedisClient;
}
