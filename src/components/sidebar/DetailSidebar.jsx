// src/components/sidebar/DetailSidebar.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import axiosInstance from '../../axiosInstance/AxiosInstance';

export default function DetailSidebar({ complexId, onBack }) {
  // /detail 데이터
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // /trade 데이터
  const [tradeSummary, setTradeSummary] = useState(null);
  const [tradeChartAll, setTradeChartAll] = useState([]); // 전체 차트 포인트
  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  // 차트 슬라이더: 최근 N개 포인트를 보여줄지
  const [chartRange, setChartRange] = useState(12); // 기본: 최근 12개

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // ✅ 단지 기본 정보 조회 (/api/v1/detail/{id})
  useEffect(() => {
    if (!complexId) return;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);

        const res = await axiosInstance.get(`/api/v1/detail/${complexId}`);
        // DetailResponse:
        // { id, address, tradeName, name, latitude, longitude, dongCnt, unitCnt,
        //   platArea, archArea, totArea, bcRat, vlRat, buildYear }
        setDetail(res.data);
      } catch (e) {
        console.error(`/api/v1/detail/${complexId} 실패`, e);
        setDetailError('단지 정보를 불러오는데 실패했습니다.');
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [complexId]);

  // ✅ 실거래 / 차트 조회 (/api/v1/trade/{id})
  useEffect(() => {
    if (!complexId) return;

    const fetchTrades = async () => {
      try {
        setLoadingTrades(true);
        setTradeError(null);

        // 여기서는 전체 기간 데이터를 한 번에 가져온다고 가정
        const res = await axiosInstance.get(`/api/v1/trade/${complexId}`);

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

        // 차트 포인트
        const chartPoints = Array.isArray(data.chartPoints)
          ? data.chartPoints
          : [];
        setTradeChartAll(chartPoints);

        // 슬라이더 기본값 설정
        if (chartPoints.length > 0) {
          setChartRange(Math.min(12, chartPoints.length));
        } else {
          setChartRange(0);
        }

        // 거래 리스트
        const tradesList = Array.isArray(data.trades) ? data.trades : [];
        setTrades(tradesList);
      } catch (e) {
        console.error(`/api/v1/trade/${complexId} 실패`, e);

        setTradeError('실거래 정보를 가져오지 못했습니다.');
        setTradeSummary(null);
        setTradeChartAll([]);
        setTrades([]);
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchTrades();
  }, [complexId]);

  // 슬라이더 값에 따라 최근 N개만 자른 차트 데이터
  const visibleChartData = useMemo(() => {
    if (!tradeChartAll || tradeChartAll.length === 0) return [];
    const n = Math.max(1, Math.min(chartRange, tradeChartAll.length));
    return tradeChartAll.slice(-n);
  }, [tradeChartAll, chartRange]);

  const formattedAvgPrice = useMemo(() => {
    if (!tradeSummary?.avgPrice) return '-';
    return formatPrice(tradeSummary.avgPrice);
  }, [tradeSummary]);

  const formattedAddress = useMemo(() => {
    if (!detail) return '';
    return detail.address || '';
  }, [detail]);

  const handleChangeChartRange = (e) => {
    const v = Number(e.target.value);
    setChartRange(v);
  };

  return (
    <div className='flex h-full flex-col bg-white'>
      {/* 헤더 */}
      <header className='flex items-center justify-between bg-[#5D3FFF] px-4 py-3 text-white'>
        <button
          type='button'
          onClick={handleBack}
          className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-sm backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-md active:translate-y-0'
        >
          ←
        </button>

        <div className='flex flex-1 flex-col items-center px-2'>
          <div className='max-w-[220px] truncate text-[11px] opacity-80'>
            {formattedAddress || '주소 정보 없음'}
          </div>
          <div className='mt-0.5 max-w-[220px] truncate text-sm font-semibold'>
            {detail?.tradeName || detail?.name || '단지명'}
          </div>
        </div>

        <div className='w-6' />
      </header>

      {/* 내용 */}
      <div className='flex-1 overflow-y-auto'>
        {/* 실거래 요약 / 차트 */}
        <section className='border-b border-slate-100 px-4 pt-3 pb-4'>
          <div className='text-[11px] text-slate-400'>
            최근 실거래 기준 평균 가격
          </div>
          <div className='mt-1 text-xl font-semibold text-[#5D3FFF]'>
            {formattedAvgPrice}
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
            ) : visibleChartData.length === 0 ? (
              <div className='flex h-full items-center justify-center text-[12px] text-slate-400'>
                차트 데이터가 없습니다.
              </div>
            ) : (
              <TradePriceChart data={visibleChartData} />
            )}
          </div>

          {/* 차트 기간 슬라이더 */}
          {!tradeError && tradeChartAll.length > 1 && (
            <div className='mt-3 flex flex-col gap-1'>
              <div className='flex items-center justify-between text-[11px] text-slate-500'>
                <span>표시 기간 조절</span>
                <span>
                  최근 <strong className='font-semibold'>{chartRange}</strong>개
                  데이터
                </span>
              </div>
              <input
                type='range'
                min={1}
                max={tradeChartAll.length}
                step={1}
                value={Math.min(chartRange, tradeChartAll.length || 1)}
                onChange={handleChangeChartRange}
                className='w-full accent-[#5D3FFF]'
              />
            </div>
          )}

          {/* 실거래 요약 텍스트 */}
          <div className='mt-3 flex items-center justify-between text-[11px] text-slate-500'>
            <span>국토교통부 기준</span>
            {tradeSummary?.tradeCount != null && (
              <span>실거래 {tradeSummary.tradeCount}건</span>
            )}
          </div>
        </section>

        {/* 실거래 내역: 일자 / 가격 / 동·층 */}
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
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className='border-b border-slate-100 text-slate-700'
                >
                  <td className='py-1'>
                    {formatContractDate(trade.contractDate)}
                  </td>
                  <td className='py-1 text-right font-semibold'>
                    {formatPrice(trade.price)}
                  </td>
                  <td className='py-1 text-right'>
                    {formatDongFloor(trade.dong, trade.floor)}
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

        {/* 단지 기본정보 */}
        <section className='px-4 pt-4 pb-6'>
          <h3 className='mb-2 text-[13px] font-semibold text-slate-800'>
            단지 기본정보
          </h3>

          {loadingDetail && (
            <p className='text-[12px] text-slate-400'>
              단지 정보를 불러오는 중...
            </p>
          )}

          {detailError && (
            <p className='mb-2 text-[12px] text-red-500'>{detailError}</p>
          )}

          {detail && (
            <dl className='space-y-1 text-[12px] text-slate-700'>
              <DetailRow label='주소' value={detail.address} />
              <DetailRow label='아파트명' value={detail.tradeName} />
              <DetailRow label='단지명' value={detail.name} />
              <DetailRow
                label='건축년도'
                value={detail.buildYear ? `${detail.buildYear}년` : '-'}
              />
              <DetailRow
                label='세대수'
                value={
                  detail.unitCnt
                    ? `${detail.unitCnt.toLocaleString()}세대`
                    : '-'
                }
              />
              <DetailRow
                label='동수'
                value={detail.dongCnt ? `${detail.dongCnt}개동` : '-'}
              />
              <DetailRow
                label='대지면적'
                value={
                  detail.platArea
                    ? `${detail.platArea.toLocaleString()}㎡`
                    : '-'
                }
              />
              <DetailRow
                label='건축면적'
                value={
                  detail.archArea
                    ? `${detail.archArea.toLocaleString()}㎡`
                    : '-'
                }
              />
              <DetailRow
                label='연면적'
                value={
                  detail.totArea ? `${detail.totArea.toLocaleString()}㎡` : '-'
                }
              />
              <DetailRow
                label='건폐율'
                value={detail.bcRat ? `${detail.bcRat}%` : '-'}
              />
              <DetailRow
                label='용적률'
                value={detail.vlRat ? `${detail.vlRat}%` : '-'}
              />
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}

/* ----------------- 서브 컴포넌트 & 유틸 ------------------ */

function DetailRow({ label, value }) {
  return (
    <div className='flex text-[12px]'>
      <dt className='w-20 shrink-0 text-slate-400'>{label}</dt>
      <dd className='flex-1 text-slate-700'>{value ?? '-'}</dd>
    </div>
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

function formatContractDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
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
  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={data}>
        <XAxis dataKey='date' tick={{ fontSize: 10 }} tickMargin={4} />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => (v / 10_000_000).toFixed(1) + '억'}
          width={40}
        />
        <Tooltip
          formatter={(value) => formatPrice(value)}
          labelFormatter={(label) => label}
        />
        <Line
          type='monotone'
          dataKey='avgPrice'
          stroke='#5D3FFF'
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
