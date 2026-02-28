export interface AllTimeRecords {
    allTimeHigh: {
        elevation: number;
        date: string;
        timestamp: string;
    } | null;
    allTimeLow: {
        elevation: number;
        date: string;
        timestamp: string;
    } | null;
}

export interface YearlyStats {
    yearly_low: number;
    yearly_high: number;
    yearly_avg: number;
    yearly_low_timestamp: string;
    yearly_high_timestamp: string;
    yearly_low_date: string;
    yearly_high_date: string;
}

export interface MonthlyStats {
    monthly_low: number;
    monthly_high: number;
    monthly_avg: number;
    monthly_range: number;
}
