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

// 최근 실거래 기준 1개월 평균을 계산하는 함수
const getMonthlyAverage = (trades) => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const recentTrades = trades.filter((trade) => {
    const tradeDate = new Date(trade.dealDate);
    return tradeDate >= oneMonthAgo && tradeDate <= today;
  });

  if (recentTrades.length > 0) {
    const totalAmount = recentTrades.reduce(
      (acc, trade) => acc + trade.dealAmount,
      0,
    );
    return totalAmount / recentTrades.length; // 평균 가격
  }

  return null; // 최근 1개월 거래가 없으면 null 반환
};

export default function TradeSidebar({ parcelId }) {
  const [tradeChartAll, setTradeChartAll] = useState([]); // 전체 차트 포인트
  const [trades, setTrades] = useState([]); // 거래 목록
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState(null);
  const [startDate, setStartDate] = useState('2006-01-01'); // 시작일을 고정
  const [endDate, setEndDate] = useState(null); // 종료일
  const [selectedExclArea, setSelectedExclArea] = useState(null); // 선택된 면적
  const [availableExclAreas, setAvailableExclAreas] = useState([]); // 가능 면적 목록
  const [showExclAreaList, setShowExclAreaList] = useState(false); // 면적 리스트 토글

  useEffect(() => {
    if (!parcelId) return;

    const fetchTrades = async () => {
      try {
        setLoadingTrades(true);
        setTradeError(null);

        const res = await axiosInstance.get(`/api/v1/trade/${parcelId}`);
        const data = res.data || {};

        const tradesList = Array.isArray(data.trades) ? data.trades : [];
        tradesList.sort((a, b) => new Date(b.dealDate) - new Date(a.dealDate));
        setTrades(tradesList);

        const chartPoints = processChartData(tradesList);
        setTradeChartAll(chartPoints);

        const today = new Date();
        setEndDate(formatDate(today));

        const distinctExclAreas = [
          ...new Set(tradesList.map((trade) => trade.exclArea)),
        ];
        setAvailableExclAreas(distinctExclAreas);
        setSelectedExclArea(tradesList[0]?.exclArea);
      } catch (e) {
        console.error(`/api/v1/trade/${parcelId} 실패`, e);

        setTradeError('실거래 정보를 가져오지 못했습니다.');
        setTradeChartAll([]);
        setTrades([]);
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchTrades();
  }, [parcelId]);

  const processChartData = (tradesList) => {
    const groupedData = {};

    tradesList.forEach((trade) => {
      const date = new Date(trade.dealDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          month: monthKey,
          totalPrice: 0,
          count: 0,
        };
      }

      groupedData[monthKey].totalPrice += Number(trade.dealAmount);
      groupedData[monthKey].count += 1;
    });

    const aggregatedData = Object.keys(groupedData).map((key) => ({
      date: new Date(key),
      avgPrice: groupedData[key].totalPrice / groupedData[key].count,
    }));

    return aggregatedData;
  };

  const handleDateRangeChange = (range) => {
    const today = new Date();
    let newStartDate;
    let newEndDate = today;

    if (range === 'all') {
      newStartDate = new Date('2006-01-01');
    } else if (range === 'last3years') {
      newStartDate = new Date(today);
      newStartDate.setFullYear(today.getFullYear() - 3);
    }

    setStartDate(formatDate(newStartDate));
    setEndDate(formatDate(newEndDate));
  };

  const filteredChartData = useMemo(() => {
    if (!tradeChartAll || tradeChartAll.length === 0) return [];
    return tradeChartAll.filter(
      (data) =>
        data.date >= new Date(startDate) && data.date <= new Date(endDate),
    );
  }, [tradeChartAll, startDate, endDate]);

  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return trades.filter(
      (trade) =>
        trade.exclArea === selectedExclArea &&
        new Date(trade.dealDate) >= new Date(startDate) &&
        new Date(trade.dealDate) <= new Date(endDate),
    );
  }, [trades, selectedExclArea, startDate, endDate]);

  const handleExclAreaSelect = (area) => {
    setSelectedExclArea(area);
    setShowExclAreaList(false);
  };

  const handleExclAreaClick = () => {
    setShowExclAreaList((prev) => !prev);
  };

  const monthlyAvgPrice = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    return getMonthlyAverage(trades);
  }, [trades]);

  return (
    <div className='flex-1'>
      <section className='border-b border-slate-100 px-4 pt-3 pb-4'>
        <div className='text-[11px] text-slate-400'>
          최근 실거래 기준 1개월 평균
        </div>
        <div className='mt-1 text-xl font-semibold text-[#3fc9ff]'>
          {monthlyAvgPrice ? formatPrice(monthlyAvgPrice) : '-'}
        </div>
      </section>

      <div className='mt-3 h-40 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-2'>
        {loadingTrades ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            차트 불러오는 중...
          </div>
        ) : tradeError ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            실거래 데이터를 가져오지 못했습니다.
          </div>
        ) : filteredChartData.length === 0 ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            차트 데이터가 없습니다.
          </div>
        ) : (
          <TradePriceChart data={filteredChartData} />
        )}
      </div>

      <div className='mt-3 flex justify-between gap-4'>
        <button
          onClick={handleExclAreaClick}
          className='rounded bg-blue-500 px-4 py-2 text-white'
        >
          {selectedExclArea ? `${selectedExclArea}평` : '평수 선택'}
        </button>
        <button
          onClick={() => handleDateRangeChange('all')}
          className='rounded bg-blue-500 px-4 py-2 text-white'
        >
          전체 기간
        </button>
        <button
          onClick={() => handleDateRangeChange('last3years')}
          className='rounded bg-blue-500 px-4 py-2 text-white'
        >
          최근 3년
        </button>
      </div>

      {showExclAreaList && (
        <ul className='mt-2 space-y-2'>
          {availableExclAreas.map((area) => (
            <li
              key={area}
              onClick={() => handleExclAreaSelect(area)}
              className='cursor-pointer text-blue-500'
            >
              {area}평
            </li>
          ))}
        </ul>
      )}

      <section className='border-b border-slate-100 px-4 pt-2 pb-4'>
        <table className='w-full border-collapse text-[12px]'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-[11px] text-slate-400'>
              <th className='py-1'>일자</th>
              <th className='py-1 text-right'>가격</th>
              <th className='py-1 text-right'>동 / 층</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((trade) => (
              <tr
                key={trade.dealDate}
                className='border-b border-slate-100 text-slate-700'
              >
                <td className='py-1'>{formatDate(trade.dealDate)}</td>
                <td className='py-1 text-right font-semibold'>
                  {formatPrice(trade.dealAmount)}
                </td>
                <td className='py-1 text-right'>
                  {formatDongFloor(trade.aptDong, trade.floor)}
                </td>
              </tr>
            ))}
            {!loadingTrades && tradeError && (
              <tr>
                <td
                  colSpan={3}
                  className='py-3 text-center text-[12px] text-slate-400'
                >
                  실거래 데이터를 가져오지 못했습니다. 잠시 후 다시
                  시도해주세요.
                </td>
              </tr>
            )}
            {!loadingTrades && !tradeError && trades.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className='py-3 text-center text-[12px] text-slate-400'
                >
                  실거래 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// 날짜 형식 변환: YYYY-MM-DD
function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

function formatDongFloor(dong, floor) {
  const dongText = dong ? `${dong}동` : '';
  const floorText = floor ? `${floor}층` : '';
  if (dongText && floorText) return `${dongText} / ${floorText}`;
  if (dongText) return dongText;
  if (floorText) return floorText;
  return '-';
}

function TradePriceChart({ data }) {
  const reversedData = useMemo(() => {
    return data.slice().reverse();
  }, [data]);

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={reversedData}>
        <XAxis
          dataKey='date' // dealDate를 X축으로 사용
          tick={{ fontSize: 10 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            const yy = String(d.getFullYear()).slice(2);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${yy}-${mm}`; // 'yy-mm' 형식으로 반환
          }}
          tickMargin={4}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => (v / 100_000_000).toFixed(1) + '억'}
          width={40}
        />
        <Tooltip
          formatter={(value) => formatPrice(value)}
          labelFormatter={(label) => {
            const d = new Date(label);
            const yy = String(d.getFullYear()).slice(2);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${yy}-${mm}`;
          }}
        />
        <Line
          type='monotone'
          dataKey='avgPrice'
          stroke='#3fe9ff'
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
