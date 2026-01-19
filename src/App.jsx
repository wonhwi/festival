import { useState, useMemo, useEffect } from 'react';
import { festivals, getRegions } from './data/festivals';
import { isActiveOrUpcoming, isOngoing, getDaysUntil } from './utils/dateUtils';
import FestivalCard from './components/FestivalCard';
import RegionFilter from './components/RegionFilter';
import Pagination from './components/Pagination';
import './App.css';

function App() {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [maxCount, setMaxCount] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // 오늘 이후 시작하는 축제만 필터링하고, 시작일이 빠른 순으로 정렬
  const filteredFestivals = useMemo(() => {
    // 진행중/예정 축제만 (종료일 기준)
    let filtered = festivals.filter((festival) => isActiveOrUpcoming(festival.endDate));

    // 지역 필터링
    if (selectedRegion && selectedRegion.trim() !== '') {
      filtered = filtered.filter((festival) => festival.location === selectedRegion);
    }

    // 정렬: 진행중 우선, 이후 시작일이 빠른 순
    filtered.sort((a, b) => {
      // 지금으로부터 "가장 빨리 시작하는" 순 (진행중은 0으로 취급)
      const keyA = Math.max(0, getDaysUntil(a.startDate));
      const keyB = Math.max(0, getDaysUntil(b.startDate));
      if (keyA !== keyB) return keyA - keyB;

      // 동률이면 시작일 오름차순
      return String(a.startDate || '').localeCompare(String(b.startDate || ''));
    });

    return filtered;
  }, [selectedRegion]);

  // 페이지네이션 계산
  const totalPages = useMemo(() => {
    return Math.ceil(filteredFestivals.length / maxCount);
  }, [filteredFestivals.length, maxCount]);

  // 현재 페이지에 표시할 축제들
  const paginatedFestivals = useMemo(() => {
    const startIndex = (currentPage - 1) * maxCount;
    const endIndex = startIndex + maxCount;
    return filteredFestivals.slice(startIndex, endIndex);
  }, [filteredFestivals, currentPage, maxCount]);

  // 필터나 최대 개수가 변경되면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegion, maxCount]);

  // 오늘 이후 시작하는 축제에서만 지역 목록 추출
  const availableRegions = useMemo(() => {
    const activeOrUpcoming = festivals.filter((festival) => isActiveOrUpcoming(festival.endDate));
    const regions = [...new Set(activeOrUpcoming.map(festival => festival.location))];
    return regions.sort();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">대한민국 축제 일정</h1>
        <p className="app-subtitle">곧 다가오는 축제들을 확인해보세요</p>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="filters-container">
            <RegionFilter
              regions={availableRegions}
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
            />
            <div className="count-filter">
              <label htmlFor="count-select" className="filter-label">
                최대 표시 개수:
              </label>
              <select
                id="count-select"
                className="count-select"
                value={maxCount}
                onChange={(e) => setMaxCount(Number(e.target.value))}
              >
                <option value={5}>5개</option>
                <option value={10}>10개</option>
                <option value={15}>15개</option>
                <option value={20}>20개</option>
              </select>
            </div>
          </div>

          {filteredFestivals.length === 0 ? (
            <div className="no-results">
              <p>선택한 조건에 맞는 축제가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="festivals-list">
                {paginatedFestivals.map((festival) => (
                  <FestivalCard key={festival.id} festival={festival} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
