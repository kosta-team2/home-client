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

/**
 * ✅ dealAmount가 "만 단위"로 들어오는 경우:
 * 예) 14250  =>  14250만 원  =>  142,500,000원
 */
function toWonFromMan(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n * 10_000;
}

// 최근 실거래 기준 1개월 평균(선택 면적 기준) 계산
const getMonthlyAverage = (trades) => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const recentTrades = trades.filter((trade) => {
    const tradeDate = new Date(trade.dealDate);
    return tradeDate >= oneMonthAgo && tradeDate <= today;
  });

  if (recentTrades.length > 0) {
    const totalAmountWon = recentTrades.reduce((acc, trade) => {
      return acc + (toWonFromMan(trade.dealAmount) ?? 0);
    }, 0);
    return totalAmountWon / recentTrades.length; // ✅ 평균(원 단위)
  }

  return null;
};

export default function TradeSidebar({ parcelId }) {
  const [trades, setTrades] = useState([]); // 거래 목록(원본)
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  const [startDate, setStartDate] = useState('2006-01-01'); // 시작일 고정
  const [endDate, setEndDate] = useState(null); // 종료일(오늘)

  const [selectedExclArea, setSelectedExclArea] = useState(null); // 선택된 면적
  const [availableExclAreas, setAvailableExclAreas] = useState([]); // 가능 면적 목록
  const [showExclAreaList, setShowExclAreaList] = useState(false); // 면적 리스트 토글
  const [activeRange, setActiveRange] = useState('last3years'); // 'last3years' | 'all'

  // ✅ 월별 평균 차트 데이터 생성 (YY-MM 표시, 내부 date는 Date)
  // ✅ avgPrice는 "원" 단위로 만든다.
  const processChartData = (tradesList) => {
    const groupedData = {};

    tradesList.forEach((trade) => {
      const date = new Date(trade.dealDate);
      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          month: monthKey,
          totalPriceWon: 0,
          count: 0,
        };
      }

      groupedData[monthKey].totalPriceWon +=
        toWonFromMan(trade.dealAmount) ?? 0;
      groupedData[monthKey].count += 1;
    });

    const aggregatedData = Object.keys(groupedData)
      .sort() // 오래된 달 -> 최신 달
      .map((key) => {
        const [yyyy, mm] = key.split('-');
        const d = new Date(Number(yyyy), Number(mm) - 1, 1);
        return {
          date: d, // X축 date
          avgPrice: groupedData[key].totalPriceWon / groupedData[key].count, // ✅ 원 단위
        };
      });

    return aggregatedData;
  };

  useEffect(() => {
    if (!parcelId) return;

    const fetchTrades = async () => {
      try {
        setLoadingTrades(true);
        setTradeError(null);

        // ✅ parcelId 바뀌면 이전 데이터 흔적 제거
        setTrades([]);
        setAvailableExclAreas([]);
        setSelectedExclArea(null);
        setShowExclAreaList(false);

        const res = await axiosInstance.get(`/api/v1/trade/${parcelId}`);
        const data = res.data || {};

        const tradesList = Array.isArray(data.trades) ? data.trades : [];
        tradesList.sort((a, b) => new Date(b.dealDate) - new Date(a.dealDate));
        setTrades(tradesList);

        // 종료일은 오늘로 고정 세팅
        const today = new Date();
        setEndDate(formatDate(today));

        // 면적 목록 구성
        const distinctExclAreas = [
          ...new Set(tradesList.map((trade) => trade.exclArea)),
        ];
        setAvailableExclAreas(distinctExclAreas);

        // 기본 선택 면적: 최신 거래의 면적
        setSelectedExclArea(tradesList[0]?.exclArea ?? null);
      } catch (e) {
        console.error(`/api/v1/trade/${parcelId} 실패`, e);
        setTradeError('실거래 정보를 가져오지 못했습니다.');
        setTrades([]);
        setAvailableExclAreas([]);
        setSelectedExclArea(null);
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchTrades();
  }, [parcelId]);

  const handleDateRangeChange = (range) => {
    +setActiveRange(range);

    const today = new Date();
    let newStartDate;
    const newEndDate = today;

    if (range === 'all') {
      newStartDate = new Date('2006-01-01');
    } else if (range === 'last3years') {
      newStartDate = new Date(today);
      newStartDate.setFullYear(today.getFullYear() - 3);
    } else {
      newStartDate = new Date('2006-01-01');
    }

    setStartDate(formatDate(newStartDate));
    setEndDate(formatDate(newEndDate));
  };

  const handleExclAreaSelect = (area) => {
    setSelectedExclArea(area);
    setShowExclAreaList(false);
  };

  const handleExclAreaClick = () => {
    setShowExclAreaList((prev) => !prev);
  };

  // ✅ 거래목록/차트/1개월 평균에 공통으로 쓸 "선택 면적" 필터
  const chartSourceTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    if (selectedExclArea == null) return trades; // 선택 전이면 전체
    return trades.filter((t) => t.exclArea === selectedExclArea);
  }, [trades, selectedExclArea]);

  // ✅ 선택 면적 기준 월별 평균 차트 생성 (원 단위 avgPrice)
  const tradeChartAll = useMemo(() => {
    return processChartData(chartSourceTrades);
  }, [chartSourceTrades]);

  // ✅ 차트는 기간 필터 적용
  const filteredChartData = useMemo(() => {
    if (!tradeChartAll || tradeChartAll.length === 0) return [];
    if (!startDate || !endDate) return tradeChartAll;

    const s = new Date(startDate);
    const e = new Date(endDate);

    return tradeChartAll.filter((d) => d.date >= s && d.date <= e);
  }, [tradeChartAll, startDate, endDate]);

  // ✅ 거래목록은 선택면적 + 기간 필터 적용
  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    if (selectedExclArea == null) return [];

    const s = new Date(startDate);
    const e = new Date(endDate);

    return trades.filter(
      (trade) =>
        trade.exclArea === selectedExclArea &&
        new Date(trade.dealDate) >= s &&
        new Date(trade.dealDate) <= e,
    );
  }, [trades, selectedExclArea, startDate, endDate]);

  // ✅ “최근 1개월 평균”도 선택면적 기준으로 계산 (원 단위)
  const monthlyAvgPrice = useMemo(() => {
    if (!chartSourceTrades || chartSourceTrades.length === 0) return null;
    return getMonthlyAverage(chartSourceTrades);
  }, [chartSourceTrades]);

  return (
    <div className='flex-1'>
      {/* 상단 평균 */}
      <section className='border-b border-slate-100 px-4 pt-3 pb-4'>
        <div className='text-[11px] text-slate-400'>
          최근 실거래 기준 1개월 평균
        </div>
        <div className='mt-1 text-xl font-semibold text-[#3fc9ff]'>
          {monthlyAvgPrice ? formatPrice(monthlyAvgPrice) : '-'}
        </div>
      </section>

      {/* ✅ 사진처럼: 왼쪽 탭 + 오른쪽 드롭다운 */}
      <div className='mt-3 flex items-center justify-between px-1'>
        {/* 왼쪽: 기간 탭 */}
        <div className='flex items-end gap-5'>
          <button
            type='button'
            onClick={() => handleDateRangeChange('last3years')}
            className={[
              'relative pb-1 text-[12px] font-medium',
              activeRange === 'last3years'
                ? 'text-[#3b5cff]'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            최근 3년
            {activeRange === 'last3years' && (
              <span className='absolute right-0 -bottom-[1px] left-0 h-[2px] rounded bg-[#3b5cff]' />
            )}
          </button>

          <button
            type='button'
            onClick={() => handleDateRangeChange('all')}
            className={[
              'relative pb-1 text-[12px] font-medium',
              activeRange === 'all'
                ? 'text-[#3b5cff]'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            전체 기간
            {activeRange === 'all' && (
              <span className='absolute right-0 -bottom-[1px] left-0 h-[2px] rounded bg-[#3b5cff]' />
            )}
          </button>
        </div>

        {/* 오른쪽: 평수 드롭다운 */}
        <div className='relative'>
          <button
            type='button'
            onClick={handleExclAreaClick}
            className='flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3b5cff] shadow-sm hover:bg-slate-50'
          >
            {selectedExclArea ? `${selectedExclArea}평` : '평수 선택'}
            <svg
              className={`h-4 w-4 transition-transform ${
                showExclAreaList ? 'rotate-180' : ''
              }`}
              viewBox='0 0 20 20'
              fill='currentColor'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z'
                clipRule='evenodd'
              />
            </svg>
          </button>

          {showExclAreaList && (
            <ul className='absolute right-0 z-10 mt-2 max-h-48 w-32 overflow-auto rounded-md border border-slate-200 bg-white py-1 text-[12px] shadow-lg'>
              {availableExclAreas.map((area) => (
                <li key={String(area)}>
                  <button
                    type='button'
                    onClick={() => handleExclAreaSelect(area)}
                    className={[
                      'w-full px-3 py-2 text-left hover:bg-slate-50',
                      area === selectedExclArea
                        ? 'font-semibold text-[#3b5cff]'
                        : 'text-slate-700',
                    ].join(' ')}
                  >
                    {area}평
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
        ) : filteredChartData.length === 0 ? (
          <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
            차트 데이터가 없습니다.
          </div>
        ) : (
          <TradePriceChart data={filteredChartData} />
        )}
      </div>

      {/* 거래 목록 */}
      <section className='border-b border-slate-100 px-4 pt-2 pb-4'>
        <table className='w-full border-collapse text-[12px]'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-[11px] text-slate-400'>
              <th className='py-1 text-center text-[14px]'>일자</th>
              <th className='py-1 text-center text-[14px]'>가격</th>
              <th className='py-1 text-center text-[14px]'>면적</th>
              <th className='py-1 text-center text-[14px]'>동 / 층</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((trade, idx) => (
              <tr
                key={
                  trade.id ??
                  `${trade.dealDate}-${trade.dealAmount}-${trade.exclArea}-${trade.aptDong}-${trade.floor}-${idx}`
                }
                className='border-b border-slate-100 text-slate-700'
              >
                <td className='py-1 text-center text-[14px]'>
                  {formatDate(trade.dealDate)}
                </td>
                <td className='py-1 text-right text-[14px] font-semibold'>
                  {formatPrice(toWonFromMan(trade.dealAmount))}
                </td>
                <td className='py-1 text-right text-[14px] font-semibold'>
                  {trade.exclArea}㎡
                </td>
                <td className='py-1 text-right text-[14px]'>
                  {formatDongFloor(trade.aptDong, trade.floor)}
                </td>
              </tr>
            ))}

            {!loadingTrades && tradeError && (
              <tr>
                <td
                  colSpan={4}
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
                  colSpan={4}
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
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * ✅ formatPrice는 "원 단위" 숫자를 받아서
 * "14억 2,500만" 형태로 출력
 */
function formatPrice(priceWon) {
  if (priceWon == null) return '-';
  const n = Number(priceWon);
  if (!Number.isFinite(n)) return '-';

  const eok = Math.floor(n / 100_000_000);
  const man = Math.round((n % 100_000_000) / 10_000);

  if (eok > 0) {
    return man > 0 ? `${eok}억 ${man.toLocaleString()}` : `${eok}억`;
  }
  return `${man.toLocaleString()}`;
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
  const chartData = useMemo(() => data, [data]);

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={chartData}>
        <XAxis
          dataKey='date'
          tick={{ fontSize: 10 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            const yy = String(d.getFullYear()).slice(2);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${yy}-${mm}`;
          }}
          tickMargin={4}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${(v / 100_000_000).toFixed(1)}억`}
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
