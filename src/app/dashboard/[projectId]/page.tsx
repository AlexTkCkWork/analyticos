import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProjectByIdForUser } from '@/lib/db/queries';
import { parseAnalyticsRange, RangePeriod } from '@/lib/analytics-range';
import {
    fillTimeSeries,
    getBrowserBreakdown,
    getCountryBreakdown,
    getDeviceBreakdown,
    getOsBreakdown,
    getPageviewsOverTime,
    getTopLineStats,
    getTopPages,
    getTopReferrers,
} from '@/lib/db/analytics';
import TimeSeriesChart from '@/components/charts/time-series-chart';
import BarList from '@/components/charts/bar-list';
import DateRangePicker from '@/components/dashboard/date-range-picker';

type PageProps = {
    params: Promise<{ projectId: string }>;
    searchParams: Promise<{ period?: RangePeriod; from?: string; to?: string }>;
};

const Page = async ({ params, searchParams }: PageProps) => {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { projectId } = await params;
    const project = await getProjectByIdForUser(projectId, session.user.id);
    if (!project) notFound();

    const range = parseAnalyticsRange(await searchParams);

    const [
        topLine,
        overTime,
        topPages,
        topReferrers,
        devices,
        browsers,
        os,
        countries,
    ] = await Promise.all([
        getTopLineStats(projectId, range),
        getPageviewsOverTime(projectId, range),
        getTopPages(projectId, range),
        getTopReferrers(projectId, range),
        getDeviceBreakdown(projectId, range),
        getBrowserBreakdown(projectId, range),
        getOsBreakdown(projectId, range),
        getCountryBreakdown(projectId, range),
    ]);

    const series = fillTimeSeries(overTime, range);

    return (
        <div className={'space-y-6'}>
            <div className={'flex items-start justify-between gap-4'}>
                <div>
                    <h1 className={'text-2xl font-semibold'}>{project.name}</h1>
                    <p className={'text-sm text-muted-foreground'}>
                        {project.domain} · {range.label}
                    </p>
                </div>
                <DateRangePicker activePeriod={range.period} />
            </div>

            <div className={'grid grid-cols-2 gap-4 sm:max-w-md'}>
                <div className={'rounded-lg border p-4'}>
                    <p className={'text-sm text-muted-foreground'}>Pageviews</p>
                    <p className={'text-2xl font-semibold tabular-nums'}>
                        {topLine.pageviews}
                    </p>
                </div>
                <div className={'rounded-lg border p-4'}>
                    <p className={'text-sm text-muted-foreground'}>
                        Unique visitors
                    </p>
                    <p className={'text-2xl font-semibold tabular-nums'}>
                        {topLine.visitors}
                    </p>
                </div>
            </div>

            <div className={'rounded-lg border p-4'}>
                <h3 className={'text-sm font-semibold mb-3'}>
                    Pageviews over time
                </h3>
                <TimeSeriesChart data={series} bucket={range.bucket} />
            </div>

            <div className={'grid gap-4 md:grid-cols-2'}>
                <BarList
                    title={'Top pages'}
                    items={topPages.map((p) => ({
                        name: p.url,
                        views: p.views,
                    }))}
                />
                <BarList
                    title={'Top referrers'}
                    items={topReferrers.map((r) => ({
                        name: r.referrer ?? 'Direct',
                        views: r.views,
                    }))}
                />
                <BarList title={'Browsers'} items={browsers} />
                <BarList title={'Operating systems'} items={os} />
                <BarList title={'Devices'} items={devices} />
                <BarList title={'Countries'} items={countries} />
            </div>
        </div>
    );
};

export default Page;
