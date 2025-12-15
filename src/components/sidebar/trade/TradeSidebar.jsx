import axiosInstance from '@axios/AxiosInstance';
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function TradeSidebar({ parcelId }) {
  const [tradeSummary, setTradeSummary] = useState(null);
  const [tradeChartAll, setTradeChartAll] = useState([]); // 전체 차트 포인트
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  // 실거래 조회
  useEffect(() => {
    if (!parcelId) return;

    const fetchTrades = async () => {
      try {
        setLoadingTrades(true);
        setTradeError(null);

        const res = await axiosInstance.get(`/api/v1/trade/${parcelId}`);
        const data = res.data || {};

        // 상단 요약
        setTradeSummary(
          data.avgPrice || data.minPrice || data.maxPrice
            ? {
                avgPrice: data.avgPrice,
                minPrice: data.minPrice,
                maxPrice: data.maxPrice,
                tradeCount: data.tradeCount,
              }
            : null,
        );

        // 거래 데이터를 날짜(dealDate) 기준으로 최신순으로 정렬
        const tradesList = Array.isArray(data.trades) ? data.trades : [];
        tradesList.sort((a, b) => new Date(b.dealDate) - new Date(a.dealDate));

        // 시계열 차트 데이터 생성 (X: dealDate, Y: dealAmount)
        const chartPoints = tradesList.map((trade) => ({
          date: new Date(trade.dealDate), // 날짜 형식으로 변환
          avgPrice: trade.dealAmount, // 가격
        }));

        setTradeChartAll(chartPoints);
      } catch (e) {
        console.error(`/api/v1/trade/${parcelId} 실패`, e);
        setTradeError('실거래 정보를 가져오지 못했습니다.');
        setTradeSummary(null);
        setTradeChartAll([]);
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchTrades();
  }, [parcelId]);

  // 시계열 데이터 준비
  const visibleChartData = useMemo(() => {
    if (!tradeChartAll || tradeChartAll.length === 0) return [];
    return tradeChartAll;
  }, [tradeChartAll]);

  return (
    <div className='flex-1'>
      {/* 차트 */}
      <div className='mt-3 h-40 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-2'>
        {loadingTrades ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            차트 불러오는 중...
          </div>
        ) : tradeError ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            실거래 데이터를 가져오지 못했습니다.
          </div>
        ) : visibleChartData.length === 0 ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            차트 데이터가 없습니다.
          </div>
        ) : (
          <TradePriceChart data={visibleChartData} />
        )}
      </div>

      {/* 실거래 요약 텍스트 */}
      <div className='mt-3 flex items-center justify-between text-[11px] text-slate-500'>
        <span>국토교통부 기준</span>
        {tradeSummary?.tradeCount != null && (
          <span>실거래 {tradeSummary.tradeCount}건</span>
        )}
      </div>
    </div>
  );
}

function TradePriceChart({ data }) {
  const reversedData = useMemo(() => {
    return data.slice().reverse(); // 데이터 복사 후 반전
  }, [data]);

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={reversedData}>
        <XAxis
          dataKey='date' // dealDate를 X축으로 사용
          tick={{ fontSize: 10 }}
          tickFormatter={(date) => new Date(date).toLocaleDateString()} // 날짜 형식화
          tickMargin={4}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => (v / 100_000_000).toFixed(1) + '억'} // 가격을 억 단위로 표시
          width={40}
        />
        <Tooltip
          formatter={(value) => formatPrice(value)}
          labelFormatter={(label) => new Date(label).toLocaleDateString()} // 날짜 형식화
        />
        <Line
          type='monotone'
          dataKey='avgPrice' // dealAmount를 Y축 값으로 사용
          stroke='#3fe9ff'
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatPrice(price) {
  if (price == null) return '-';
  const n = Number(price);
  if (!Number.isFinite(n)) return '-';

  const eok = Math.floor(n / 100_000_000);
  const man = Math.round((n % 100_000_000) / 10_000);

  if (eok > 0) {
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${man.toLocaleString()}만`;
}
