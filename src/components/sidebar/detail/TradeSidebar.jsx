import axiosInstance from '@axios/AxiosInstance';
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

// ✅ m² -> 평 변환 (1평 = 3.305785 m²)
function m2ToPyeong(m2) {
  const n = Number(m2);
  if (!Number.isFinite(n)) return null;
  return n / 3.305785;
}

// ✅ 평 표시 포맷 (기본: 소수 1자리, 정수면 0자리)
function formatPyeongFromM2(m2) {
  const py = m2ToPyeong(m2);
  if (py == null) return '-';
  const rounded = Math.round(py * 10) / 10; // 0.1평 단위
  const text = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(1);
  return `${text}`;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatPrice(priceWon) {
  if (priceWon == null) return '-';
  const n = Number(priceWon);
  if (!Number.isFinite(n)) return '-';

  const eok = Math.floor(n / 100_000_000);
  const man = Math.round((n % 100_000_000) / 10_000);

  if (eok > 0) {
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${man.toLocaleString()}만`;
}

function formatDongFloor(dong, floor) {
  const hasDong =
    dong !== null && dong !== undefined && String(dong).trim() !== '';
  const hasFloor =
    floor !== null && floor !== undefined && String(floor).trim() !== '';

  const dongText = hasDong ? `${String(dong).trim()}동` : '';
  const floorText = hasFloor ? `${String(floor).trim()}층` : '';

  if (hasDong && hasFloor) return `${dongText} / ${floorText}`;
  if (hasDong) return dongText;
  if (hasFloor) return floorText;
  return '-';
}

function getScrollParent(el) {
  if (!el) return null;
  let parent = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const oy = style.overflowY;
    if (oy === 'auto' || oy === 'scroll') return parent;
    parent = parent.parentElement;
  }
  return window; // fallback
}

export default function TradeSidebar({ parcelId }) {
  const [trades, setTrades] = useState([]); // 거래 목록(원본)
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  const [startDate, setStartDate] = useState('2006-01-01'); // 시작일 고정
  const [endDate, setEndDate] = useState(null); // 종료일(오늘)

  const [selectedExclArea, setSelectedExclArea] = useState(null); // 선택된 면적(m²)
  const [availableExclAreas, setAvailableExclAreas] = useState([]); // 가능 면적 목록(m²)
  const [showExclAreaList, setShowExclAreaList] = useState(false); // 면적 리스트 토글
  const [activeRange, setActiveRange] = useState('last3years'); // 'last3years' | 'all'

  // ✅ "처음 10개만" + "더보기" 상태
  const INITIAL_TRADE_LIMIT = 10;
  const [showAllTrades, setShowAllTrades] = useState(false);

  // ✅ 더보기 버튼 위치 기준 스크롤 유지(보정)용
  const moreBtnRef = useRef(null);
  const scrollAnchorRef = useRef(null);

  // ✅ dealAmount를 원단위로 만들고 월별 평균 데이터 생성 + 거래건수
  const processChartData = (tradesList) => {
    const groupedData = {};

    tradesList.forEach((trade) => {
      const date = new Date(trade.dealDate);
      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groupedData[monthKey]) {
        groupedData[monthKey] = { month: monthKey, totalPriceWon: 0, count: 0 };
      }

      groupedData[monthKey].totalPriceWon +=
        toWonFromMan(trade.dealAmount) ?? 0;
      groupedData[monthKey].count += 1;
    });

    return Object.keys(groupedData)
      .sort()
      .map((key) => {
        const [yyyy, mm] = key.split('-');
        const d = new Date(Number(yyyy), Number(mm) - 1, 1);
        return {
          date: d,
          avgPrice: groupedData[key].totalPriceWon / groupedData[key].count,
          count: groupedData[key].count,
        };
      });
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

        // ✅ 더보기 상태도 초기화
        setShowAllTrades(false);
        scrollAnchorRef.current = null;

        const res = await axiosInstance.get(`/api/v1/trade/${parcelId}`);
        const data = res.data || {};

        const tradesList = Array.isArray(data.trades) ? data.trades : [];
        tradesList.sort((a, b) => new Date(b.dealDate) - new Date(a.dealDate));
        setTrades(tradesList);

        // 종료일은 오늘로 고정 세팅
        const today = new Date();
        setEndDate(formatDate(today));

        // 면적 목록 구성 (원본 m² 유지)
        const distinctExclAreas = [
          ...new Set(tradesList.map((trade) => trade.exclArea)),
        ]
          .filter(
            (v) => v !== null && v !== undefined && String(v).trim() !== '',
          )
          .sort((a, b) => Number(a) - Number(b));

        setAvailableExclAreas(distinctExclAreas);

        // 기본 선택 면적: 최신 거래의 면적(m²)
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

  useEffect(() => {
    setShowAllTrades(false);
    scrollAnchorRef.current = null;
  }, [parcelId, selectedExclArea, activeRange, startDate, endDate]);

  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    if (!anchor || !moreBtnRef.current) return;

    const { scrollParent, prevOffset } = anchor;

    const btn = moreBtnRef.current;

    if (scrollParent === window) {
      const nextOffset = btn.getBoundingClientRect().top; // viewport 기준
      const delta = nextOffset - prevOffset;
      if (delta !== 0) window.scrollBy(0, delta);
    } else if (scrollParent && scrollParent.getBoundingClientRect) {
      const parentRect = scrollParent.getBoundingClientRect();
      const nextOffset = btn.getBoundingClientRect().top - parentRect.top;
      const delta = nextOffset - prevOffset;
      if (delta !== 0) scrollParent.scrollTop += delta;
    }

    scrollAnchorRef.current = null;
  }, [showAllTrades]);

  const handleDateRangeChange = (range) => {
    setActiveRange(range);

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

  const handleExclAreaSelect = (areaM2) => {
    setSelectedExclArea(areaM2);
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

  const visibleTrades = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) return [];
    return showAllTrades
      ? filteredTrades
      : filteredTrades.slice(0, INITIAL_TRADE_LIMIT);
  }, [filteredTrades, showAllTrades]);

  const handleToggleMore = () => {
    const btn = moreBtnRef.current;
    if (btn) {
      const scrollParent = getScrollParent(btn);

      if (scrollParent === window) {
        scrollAnchorRef.current = {
          scrollParent,
          prevOffset: btn.getBoundingClientRect().top,
        };
      } else if (scrollParent && scrollParent.getBoundingClientRect) {
        const parentRect = scrollParent.getBoundingClientRect();
        scrollAnchorRef.current = {
          scrollParent,
          prevOffset: btn.getBoundingClientRect().top - parentRect.top,
        };
      }
    }

    setShowAllTrades((p) => !p);
  };

  return (
    <div className='flex-1'>
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
            {selectedExclArea != null
              ? formatPyeongFromM2(selectedExclArea) + '평'
              : '평수 선택'}
            <svg
              className={`h-4 w-4 transition-transform ${showExclAreaList ? 'rotate-180' : ''}`}
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
              {availableExclAreas.map((areaM2) => (
                <li key={String(areaM2)}>
                  <button
                    type='button'
                    onClick={() => handleExclAreaSelect(areaM2)}
                    className={[
                      'w-full px-3 py-2 text-left hover:bg-slate-50',
                      areaM2 === selectedExclArea
                        ? 'font-semibold text-[#3b5cff]'
                        : 'text-slate-700',
                    ].join(' ')}
                  >
                    {formatPyeongFromM2(areaM2) + '평'}
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
            {visibleTrades.map((trade, idx) => (
              <tr
                key={
                  trade.id ??
                  `${trade.dealDate}-${trade.dealAmount}-${trade.exclArea}-${trade.aptDong}-${trade.floor}-${idx}`
                }
                className='border-b border-slate-100 text-slate-700'
              >
                <td className='py-1 text-left text-[14px]'>
                  {formatDate(trade.dealDate)}
                </td>
                <td className='py-1 text-left text-[14px] font-semibold'>
                  {formatPrice(toWonFromMan(trade.dealAmount))}
                </td>
                <td className='py-1 text-left text-[14px] font-semibold'>
                  {formatPyeongFromM2(trade.exclArea)}
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

        {/* ✅ 더보기/접기 (버튼 ref로 scroll anchoring) */}
        {!loadingTrades &&
          !tradeError &&
          filteredTrades.length > INITIAL_TRADE_LIMIT && (
            <div className='mt-3 flex justify-center'>
              <button
                ref={moreBtnRef}
                type='button'
                onClick={handleToggleMore}
                className='rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50'
              >
                {showAllTrades
                  ? '접기'
                  : `더보기 (+${filteredTrades.length - INITIAL_TRADE_LIMIT}개)`}
              </button>
            </div>
          )}
      </section>
    </div>
  );
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

        <Tooltip content={(props) => <TradeChartTooltip {...props} />} />

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

function TradeChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload; // { date, avgPrice, count }
  const d = new Date(label);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const monthText = `${yy}-${mm}`;

  return (
    <div className='rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] shadow-lg'>
      <div className='font-semibold text-slate-800'>{monthText}</div>

      <div className='mt-1 flex items-center justify-between gap-6'>
        <span className='text-slate-500'>월 평균</span>
        <span className='font-semibold text-slate-800'>
          {formatPrice(point?.avgPrice)}
        </span>
      </div>

      <div className='mt-1 flex items-center justify-between gap-6'>
        <span className='text-slate-500'>거래건수</span>
        <span className='font-semibold text-slate-800'>
          {point?.count ?? '-'}건
        </span>
      </div>
    </div>
  );
}
