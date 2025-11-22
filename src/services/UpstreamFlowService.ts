import axios from 'axios';

// TypeScript interfaces for upstream dam data
export interface DamFlow {
    value: number;
    timestamp: string;
    unit: string;
}

export interface DamCurrent {
    outflow: DamFlow | null;
    inflow: DamFlow | null;
}

export interface DamTrend {
    percentChange: number;
    direction: 'increasing' | 'decreasing' | 'stable';
}

export interface DamData {
    name: string;
    code: string;
    available: boolean;
    current?: DamCurrent;
    trend?: DamTrend;
    history?: {
        outflow: [string, number, number][];
        inflow: [string, number, number][];
    };
    error?: string;
}

export interface UpstreamData {
    rockyReach: DamData;
    wells: DamData;
    chiefJoseph: DamData;
    grandCoulee: DamData;
    rockIsland: DamData;
    wanapum: DamData;
    fetchedAt: string;
}

export interface FlowBalance {
    netFlow: number; // inflow - outflow (cfs)
    prediction: 'rising' | 'falling' | 'stable';
    ratePerHour: number; // estimated ft/hour change
    confidence: 'high' | 'medium' | 'low';
}

export interface PredictionData {
    direction: 'rising' | 'falling' | 'stable';
    confidence: 'high' | 'medium' | 'low';
    estimatedChange6h: number; // feet
    estimatedChange12h: number; // feet
    reasons: string[];
}

class UpstreamFlowService {
    private readonly API_URL = '/api/upstream-dams';

    // Wanapum Reservoir surface area at normal pool elevation (approximate)
    private readonly WANAPUM_SURFACE_AREA_ACRES = 15000;
    private readonly SQ_FT_PER_ACRE = 43560;

    async getUpstreamData(): Promise<UpstreamData> {
        try {
            const response = await axios.get<UpstreamData>(this.API_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching upstream data:', error);
            throw error;
        }
    }

    /**
     * Calculate flow balance at Wanapum Dam
     * Positive net flow = level rising
     * Negative net flow = level falling
     * Uses Rock Island Dam outflow as Wanapum inflow (Rock Island is directly upstream)
     */
    calculateFlowBalance(wanapumData: DamData, rockIslandData?: DamData): FlowBalance {
        if (!wanapumData.available || !wanapumData.current) {
            return {
                netFlow: 0,
                prediction: 'stable',
                ratePerHour: 0,
                confidence: 'low'
            };
        }

        // Wanapum basin inflow should be Rock Island dam outflow (Rock Island is directly upstream)
        // Fall back to Wanapum's reported inflow if Rock Island data is unavailable
        let inflow = 0;
        let hasInflow = false;
        
        if (rockIslandData?.available && rockIslandData.current?.outflow) {
            inflow = rockIslandData.current.outflow.value;
            hasInflow = true;
        } else if (wanapumData.current.inflow) {
            inflow = wanapumData.current.inflow.value;
            hasInflow = true;
        }

        const outflow = wanapumData.current.outflow?.value || 0;
        const netFlow = inflow - outflow;

        // Calculate rate of change in feet per hour
        // Formula: (net flow in ft³/s * 3600 s/hr) / surface area in ft²
        const surfaceAreaSqFt = this.WANAPUM_SURFACE_AREA_ACRES * this.SQ_FT_PER_ACRE;
        const ratePerHour = (netFlow * 3600) / surfaceAreaSqFt;

        // Determine prediction
        let prediction: 'rising' | 'falling' | 'stable' = 'stable';
        if (ratePerHour > 0.05) prediction = 'rising';
        else if (ratePerHour < -0.05) prediction = 'falling';

        // Determine confidence based on data quality
        const hasOutflow = wanapumData.current.outflow !== null;
        const confidence: 'high' | 'medium' | 'low' =
            hasInflow && hasOutflow ? 'high' :
                hasOutflow ? 'medium' : 'low';

        return {
            netFlow,
            prediction,
            ratePerHour,
            confidence
        };
    }

    /**
     * Generate prediction based on upstream conditions
     * Prioritizes closer dams (Rock Island, Rocky Reach, Wells) over distant ones (Chief Joseph, Grand Coulee)
     */
    generatePrediction(upstreamData: UpstreamData): PredictionData {
        const flowBalance = this.calculateFlowBalance(upstreamData.wanapum, upstreamData.rockIsland);
        const reasons: string[] = [];

        // Prioritize closer dams for short-term predictions
        // Rock Island is directly upstream (~1-2 hour impact)
        // Rocky Reach is next upstream (~2-4 hour impact)
        // Wells is next (~4-8 hour impact)
        // Chief Joseph is further (~6-12 hour impact)
        
        let primaryDam = null;
        let primaryDamName = '';
        
        // Try Rock Island first (closest, best for 1-2 hour prediction)
        if (upstreamData.rockIsland.available && upstreamData.rockIsland.trend) {
            primaryDam = upstreamData.rockIsland;
            primaryDamName = 'Rock Island';
        }
        // Try Rocky Reach next (good for 2-6 hour prediction)
        else if (upstreamData.rockyReach.available && upstreamData.rockyReach.trend) {
            primaryDam = upstreamData.rockyReach;
            primaryDamName = 'Rocky Reach';
        }
        // Try Wells next (good for 4-8 hour prediction)
        else if (upstreamData.wells.available && upstreamData.wells.trend) {
            primaryDam = upstreamData.wells;
            primaryDamName = 'Wells';
        }
        // Fall back to Chief Joseph (6-12 hour prediction)
        else if (upstreamData.chiefJoseph.available && upstreamData.chiefJoseph.trend) {
            primaryDam = upstreamData.chiefJoseph;
            primaryDamName = 'Chief Joseph';
        }
        // Finally Grand Coulee (12+ hour prediction)
        else if (upstreamData.grandCoulee.available && upstreamData.grandCoulee.trend) {
            primaryDam = upstreamData.grandCoulee;
            primaryDamName = 'Grand Coulee';
        }

        // Add trend information from the primary dam
        if (primaryDam) {
            const trend = primaryDam.trend?.direction || 'stable';
            if (trend === 'increasing') {
                reasons.push(`${primaryDamName} Dam releases increasing`);
            } else if (trend === 'decreasing') {
                reasons.push(`${primaryDamName} Dam releases decreasing`);
            }
        }

        // Factor in current flow balance at Wanapum
        if (flowBalance.netFlow > 1000) {
            reasons.push(`Wanapum inflow exceeds outflow by ${Math.round(flowBalance.netFlow).toLocaleString()} cfs`);
        } else if (flowBalance.netFlow < -1000) {
            reasons.push(`Wanapum outflow exceeds inflow by ${Math.round(Math.abs(flowBalance.netFlow)).toLocaleString()} cfs`);
        } else {
            reasons.push('Flow balance approximately neutral');
        }

        // Estimate change over next 6 and 12 hours
        // Simple linear projection (will be improved with historical patterns in Phase 2)
        const estimatedChange6h = flowBalance.ratePerHour * 6;
        const estimatedChange12h = flowBalance.ratePerHour * 12;

        return {
            direction: flowBalance.prediction,
            confidence: flowBalance.confidence,
            estimatedChange6h,
            estimatedChange12h,
            reasons
        };
    }

    /**
     * Format flow value for display
     */
    formatFlow(cfs: number): string {
        if (cfs >= 1000) {
            return `${(cfs / 1000).toFixed(1)} kcfs`;
        }
        return `${Math.round(cfs).toLocaleString()} cfs`;
    }

    /**
     * Get time-to-impact estimate for upstream releases
     * Water travels approximately 2-3 mph in the Columbia River
     * Rock Island: ~5 miles upstream (directly upstream)
     * Rocky Reach: ~20 miles upstream
     * Wells: ~35 miles upstream  
     * Chief Joseph: ~50 miles upstream
     * Grand Coulee: ~100 miles upstream
     */
    getTimeToImpact(damCode: string): string {
        switch (damCode) {
            case 'RIS':
                return '1-2 hours';
            case 'RRH':
                return '2-4 hours';
            case 'WEL':
                return '4-8 hours';
            case 'CJO':
                return '6-12 hours';
            case 'GCL':
                return '24-36 hours';
            default:
                return 'Unknown';
        }
    }
}

export const upstreamFlowService = new UpstreamFlowService();
