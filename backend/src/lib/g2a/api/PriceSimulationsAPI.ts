/**
 * Price Simulations API wrapper for G2A Import API
 */

import { AxiosInstance } from 'axios';
import { PriceSimulationResponse } from '../types/index.js';
import { G2ALogger } from '../utils/logger.js';

export class PriceSimulationsAPI {
  constructor(
    private httpClient: AxiosInstance,
    private logger: G2ALogger,
    private executeRequest: <T>(endpoint: string, operation: string, requestFn: () => Promise<T>) => Promise<T>
  ) {}
  
  /**
   * Get price simulation for a product
   */
  async simulate(productId: string, price: number, country?: string): Promise<PriceSimulationResponse> {
    return this.executeRequest('/prices/simulations', 'PriceSimulationsAPI.simulate', async () => {
      this.logger.info('Simulating price', { productId, price, country });
      
      const params: Record<string, string | number> = {
        productId,
        price,
      };
      
      if (country) {
        params.country = country;
      }
      
      const response = await this.httpClient.get<PriceSimulationResponse>(
        '/prices/simulations',
        { params }
      );
      
      if (response.status !== 200) {
        throw new Error(`Failed to simulate price: ${response.status}`);
      }
      
      this.logger.info('Price simulation completed', {
        productId,
        price,
        income: response.data.income,
        finalPrice: response.data.finalPrice,
      });
      
      return response.data;
    });
  }
  
  /**
   * Batch simulate prices for multiple products
   */
  async batchSimulate(
    simulations: Array<{ productId: string; price: number; country?: string }>
  ): Promise<Array<{ productId: string; simulation: PriceSimulationResponse | null; error?: Error }>> {
    this.logger.info('Batch simulating prices', { count: simulations.length });
    
    const results: Array<{
      productId: string;
      simulation: PriceSimulationResponse | null;
      error?: Error;
    }> = [];
    
    for (const sim of simulations) {
      try {
        const simulation = await this.simulate(sim.productId, sim.price, sim.country);
        results.push({ productId: sim.productId, simulation });
      } catch (error) {
        results.push({
          productId: sim.productId,
          simulation: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
    
    const successCount = results.filter(r => r.simulation !== null).length;
    const errorCount = results.filter(r => r.error).length;
    
    this.logger.info('Batch price simulation completed', {
      totalRequested: simulations.length,
      successCount,
      errorCount,
    });
    
    return results;
  }
}
