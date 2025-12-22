export default function RegionGrid({ items, selectedId, onSelect }) {
  // ✅ 방어: items가 배열이 아니면 빈 배열로 강제
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className='mt-3 grid grid-cols-3 gap-2'>
      {safeItems.map((item) => {
        const isActive = selectedId === item.id;
        const [firstLine, ...rest] = (item?.name ?? '').split(' ');
        const secondLine = rest.join(' ');

        return (
          <button
            key={item.id}
            type='button'
            onClick={() => onSelect(item)}
            className={`flex grid h-[68px] w-full flex-col items-center justify-center rounded-xl border px-3 py-2.5 text-center text-[13px] leading-snug transition-all ${
              isActive
                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                : 'border-slate-200 bg-white/90 text-slate-800 hover:border-sky-300 hover:bg-sky-50/70'
            } `}
          >
            {secondLine ? (
              <>
                <span className='block'>{firstLine}</span>
                <span className='block'>{secondLine}</span>
              </>
            ) : (
              <span className='block'>{firstLine}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
