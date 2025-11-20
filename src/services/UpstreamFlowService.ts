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
     */
    calculateFlowBalance(wanapumData: DamData): FlowBalance {
        if (!wanapumData.available || !wanapumData.current) {
            return {
                netFlow: 0,
                prediction: 'stable',
                ratePerHour: 0,
                confidence: 'low'
            };
        }

        const inflow = wanapumData.current.inflow?.value || 0;
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
        const hasInflow = wanapumData.current.inflow !== null;
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
     */
    generatePrediction(upstreamData: UpstreamData): PredictionData {
        const flowBalance = this.calculateFlowBalance(upstreamData.wanapum);
        const reasons: string[] = [];

        // Factor in Chief Joseph trend (most important for short-term)
        const cjoTrend = upstreamData.chiefJoseph.trend?.direction || 'stable';
        if (cjoTrend === 'increasing') {
            reasons.push('Chief Joseph Dam releases increasing');
        } else if (cjoTrend === 'decreasing') {
            reasons.push('Chief Joseph Dam releases decreasing');
        }

        // Factor in current flow balance
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
     * Chief Joseph is ~15 miles upstream, water travels ~2-3 mph in Columbia River
     */
    getTimeToImpact(damCode: string): string {
        switch (damCode) {
            case 'CJO':
                return '4-6 hours';
            case 'GCL':
                return '24-36 hours';
            case 'RIS':
                return 'Downstream';
            default:
                return 'Unknown';
        }
    }
}

export const upstreamFlowService = new UpstreamFlowService();
