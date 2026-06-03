import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProjectByIdForUser } from '@/lib/db/queries';
import { parseAnalyticsRange, RangePeriod } from '@/lib/analytics-range';
import {
    getBrowserBreakdown,
    getCountryBreakdown,
    getDeviceBreakdown,
    getOsBreakdown,
    getPageviewsOverTime,
    getTopLineStats,
    getTopPages,
    getTopReferrers,
} from '@/lib/db/analytics';
import { fillTimeSeries } from '@/lib/time-series';
import TimeSeriesChart from '@/components/charts/time-series-chart';
import DateRangePicker from '@/components/dashboard/date-range-picker';
import { withCache } from '@/lib/cache';
import Link from 'next/link';
import BarList, { BarItems } from '@/components/charts/bar-list';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    DIRECT_REFERRER,
    type FilterKey,
    filtersCacheKey,
    parseAnalyticsFilters,
} from '@/lib/analytics-filters';
import ActiveFilters from '@/components/dashboard/active-filters';

type PageProps = {
    params: Promise<{ projectId: string }>;
    searchParams: Promise<
        { period?: RangePeriod; from?: string; to?: string } & Partial<
            Record<FilterKey, string>
        >
    >;
};

const CACHE_TTL = 60;

const Page = async ({ params, searchParams }: PageProps) => {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { projectId } = await params;
    const project = await getProjectByIdForUser(projectId, session.user.id);
    if (!project) notFound();

    const sp = await searchParams;
    const range = parseAnalyticsRange(sp);
    const filters = parseAnalyticsFilters(sp);

    const searchParamsObj = new URLSearchParams(
        Object.entries(sp).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
    );

    const rangeKey =
        range.period === 'custom'
            ? `custom:${range.from.toISOString()}:${range.to.toISOString()}`
            : range.period;

    const cacheKey = `stats:${projectId}:${rangeKey}:${filtersCacheKey(filters)}`;

    const [
        topLine,
        overTime,
        topPages,
        topReferrers,
        devices,
        browsers,
        os,
        countries,
    ] = await withCache(cacheKey, CACHE_TTL, async () => {
        return await Promise.all([
            getTopLineStats(projectId, range, filters),
            getPageviewsOverTime(projectId, range, filters),
            getTopPages(projectId, range, filters),
            getTopReferrers(projectId, range, filters),
            getDeviceBreakdown(projectId, range, filters),
            getBrowserBreakdown(projectId, range, filters),
            getOsBreakdown(projectId, range, filters),
            getCountryBreakdown(projectId, range, filters),
        ]);
    });

    const series = fillTimeSeries(overTime, range);

    return (
        <div className={'space-y-6'}>
            <div className={'flex items-start justify-between gap-4'}>
                <div>
                    <div className={'flex items-center gap-3'}>
                        <h1 className={'text-2xl font-semibold'}>
                            {project.name}
                        </h1>
                        <Link
                            href={`/dashboard/${project.id}/settings`}
                            className={
                                'text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline'
                            }
                        >
                            Settings
                        </Link>
                    </div>
                    <p className={'text-sm text-muted-foreground'}>
                        {project.domain} · {range.label}
                    </p>
                </div>
                <DateRangePicker activePeriod={range.period} />
            </div>

            <ActiveFilters filters={filters} searchParams={searchParamsObj} />

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
                    .
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
                    filter={{
                        key: 'url',
                        currentValue: filters.url,
                        searchParams: searchParamsObj,
                    }}
                />
                <BarList
                    title={'Top referrers'}
                    items={topReferrers.map((r) => ({
                        name: r.referrer ?? 'Direct',
                        filterValue: r.referrer ?? DIRECT_REFERRER,
                        views: r.views,
                    }))}
                    filter={{
                        key: 'referrer',
                        currentValue: filters.referrer,
                        searchParams: searchParamsObj,
                    }}
                />

                <div className={'rounded-lg border p-4'}>
                    <Tabs defaultValue={'browsers'}>
                        <TabsList>
                            <TabsTrigger value={'browsers'}>
                                Browsers
                            </TabsTrigger>
                            <TabsTrigger value={'os'}>
                                Operating systems
                            </TabsTrigger>
                            <TabsTrigger value={'devices'}>Devices</TabsTrigger>
                        </TabsList>
                        <TabsContent value={'browsers'}>
                            <BarItems
                                items={browsers}
                                filter={{
                                    key: 'browser',
                                    currentValue: filters.browser,
                                    searchParams: searchParamsObj,
                                }}
                            />
                        </TabsContent>
                        <TabsContent value={'os'}>
                            <BarItems
                                items={os}
                                filter={{
                                    key: 'os',
                                    currentValue: filters.os,
                                    searchParams: searchParamsObj,
                                }}
                            />
                        </TabsContent>
                        <TabsContent value={'devices'}>
                            <BarItems
                                items={devices}
                                filter={{
                                    key: 'device',
                                    currentValue: filters.device,
                                    searchParams: searchParamsObj,
                                }}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                <BarList
                    title={'Countries'}
                    items={countries}
                    filter={{
                        key: 'country',
                        currentValue: filters.country,
                        searchParams: searchParamsObj,
                    }}
                />
            </div>
        </div>
    );
};

export default Page;
