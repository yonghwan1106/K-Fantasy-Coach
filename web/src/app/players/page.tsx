'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Users, DollarSign } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import PlayerModal from '@/components/PlayerModal';
import { AvailableOnlyToggle } from '@/components/AvailabilityFilter';
import { Player, K_LEAGUE_TEAMS, AvailabilityStatus } from '@/types';
import { enrichPlayersData } from '@/lib/dataEnricher';
import { SkeletonPlayerCard } from '@/components/SkeletonLoader';

const POSITIONS = ['전체', 'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'CF', 'LWF', 'RWF', 'LW', 'RW', 'SS'];
const ITEMS_PER_PAGE = 20;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('전체');
  const [teamFilter, setTeamFilter] = useState('전체');
  const [sortBy, setSortBy] = useState<'predictedScore' | 'recentAvg' | 'seasonAvg' | 'formIndex' | 'price' | 'valueRating'>('predictedScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [availableOnly, setAvailableOnly] = useState(false);

  // 모달 상태
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/data/players.json')
      .then(r => r.json())
      .then(data => {
        // 선수 데이터 보강 (가격, 출전정보 등)
        const enrichedPlayers = enrichPlayersData(Array.isArray(data) ? data : data.players || []);
        setPlayers(enrichedPlayers);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 팀 목록 추출
  const teams = useMemo(() => {
    const teamSet = new Set(players.map(p => p.team));
    return ['전체', ...Array.from(teamSet).sort()];
  }, [players]);

  // 출전불가 선수 수 계산
  const unavailableCount = useMemo(() => {
    return players.filter(p => p.availability && p.availability.status !== 'available').length;
  }, [players]);

  const filteredPlayers = useMemo(() => {
    let result = players;

    // 검색 필터
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.team.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 포지션 필터
    if (positionFilter !== '전체') {
      result = result.filter(p => p.position === positionFilter);
    }

    // 팀 필터
    if (teamFilter !== '전체') {
      result = result.filter(p => p.team === teamFilter);
    }

    // 출전가능 필터
    if (availableOnly) {
      result = result.filter(p => !p.availability || p.availability.status === 'available');
    }

    // 정렬
    result = [...result].sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return ((aVal as number) - (bVal as number)) * multiplier;
    });

    return result;
  }, [players, search, positionFilter, teamFilter, sortBy, sortOrder, availableOnly]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [search, positionFilter, teamFilter, sortBy, sortOrder, availableOnly]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">선수 검색</h1>
          <p className="text-zinc-400">K리그 전체 선수의 판타지 점수를 확인하세요</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonPlayerCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">선수 검색</h1>
        <p className="text-zinc-400">K리그 전체 선수의 판타지 점수를 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="선수 또는 팀 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4"
            />
          </div>

          {/* Position Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-zinc-500" />
            <select
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
              className="min-w-[100px]"
            >
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-500" />
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="min-w-[140px]"
            >
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'predictedScore', label: '예상점수' },
            { key: 'recentAvg', label: '최근성적' },
            { key: 'seasonAvg', label: '시즌평균' },
            { key: 'formIndex', label: '폼지수' },
            { key: 'price', label: '가격' },
            { key: 'valueRating', label: '가성비' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key as typeof sortBy)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                sortBy === key
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {label}
              {sortBy === key && (
                <ArrowUpDown className="w-4 h-4" />
              )}
            </button>
          ))}

          {/* 구분선 */}
          <div className="w-px h-6 bg-zinc-700 mx-1" />

          {/* 출전가능 필터 */}
          <AvailableOnlyToggle
            value={availableOnly}
            onChange={setAvailableOnly}
            unavailableCount={unavailableCount}
          />
        </div>
      </div>

      {/* Results Count & Pagination Info */}
      <div className="flex items-center justify-between">
        <p className="text-zinc-500">
          {filteredPlayers.length}명의 선수 중 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}명 표시
        </p>
        {totalPages > 1 && (
          <p className="text-zinc-500 text-sm">
            페이지 {currentPage} / {totalPages}
          </p>
        )}
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedPlayers.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={{ ...player, rank: (currentPage - 1) * ITEMS_PER_PAGE + index + 1 }}
            showRank={sortBy === 'predictedScore' && !search && positionFilter === '전체' && teamFilter === '전체'}
            onClick={() => handlePlayerClick(player)}
          />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500">검색 결과가 없습니다</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'gradient-gold text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        allPlayers={players}
        onSelectPlayer={(p) => {
          setSelectedPlayer(p);
        }}
      />
    </div>
  );
}
