'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';
import { RangeBucket } from '@/lib/analytics-range';

type Point = { bucket: string; count: number };

type Props = {
    data: Point[];
    bucket: RangeBucket;
};

const formatBucket = (iso: string, bucket: RangeBucket) => {
    const d = new Date(iso);
    return bucket === 'hour'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const TimeSeriesChart = ({ data, bucket }: Props) => {
    const formatted = data.map((d) => ({
        label: formatBucket(d.bucket, bucket),
        count: d.count,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart
                data={formatted}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    width={48}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default TimeSeriesChart;
