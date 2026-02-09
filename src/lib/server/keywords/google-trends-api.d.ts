declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
  }

  function interestOverTime(options: TrendsOptions): Promise<string>;
  function interestByRegion(options: TrendsOptions): Promise<string>;
  function relatedQueries(options: TrendsOptions): Promise<string>;
  function relatedTopics(options: TrendsOptions): Promise<string>;
  function dailyTrends(options: { geo: string; trendDate?: Date }): Promise<string>;
  function realTimeTrends(options: { geo: string; category?: string }): Promise<string>;

  export { interestOverTime, interestByRegion, relatedQueries, relatedTopics, dailyTrends, realTimeTrends };
}
