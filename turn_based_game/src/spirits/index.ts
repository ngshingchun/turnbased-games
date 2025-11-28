/**
 * 精靈數據導出
 */

export { solensen } from './solensen';
export { kingGaia } from './kingGaia';

// 精靈註冊表
import { solensen } from './solensen';
import { kingGaia } from './kingGaia';
import { SpiritData } from '../types';

export const SpiritRegistry: Record<string, SpiritData> = {
  solensen,
  kingGaia,
};

export function getSpiritData(key: string): SpiritData | null {
  return SpiritRegistry[key] || null;
}
