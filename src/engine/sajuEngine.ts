import { buildLocalManseReport } from './localManseEngine';
import { FortuneReport, UserProfile } from '../types/saju';

export interface SajuCalculationEngine {
  calculate(profile: UserProfile): Promise<FortuneReport>;
}

class ApiSajuEngine implements SajuCalculationEngine {
  async calculate(profile: UserProfile): Promise<FortuneReport> {
    await new Promise((resolve) => window.setTimeout(resolve, 2300));

    try {
      const response = await fetch('/api/saju/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error(`Saju API failed with ${response.status}`);
      }

      return (await response.json()) as FortuneReport;
    } catch (error) {
      console.warn('Falling back to browser local manse engine.', error);
      return buildLocalManseReport(profile);
    }
  }
}

export const sajuEngine = new ApiSajuEngine();
