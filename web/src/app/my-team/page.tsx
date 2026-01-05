'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trophy, Users, Plus, X, TrendingUp, Save, FolderOpen, Trash2, Copy, Check, Share2 } from 'lucide-react';
import { Player, SavedTeam, Formation, getPositionGroup } from '@/types';

const FORMATIONS: Record<Formation, { GK: number; DF: number; MF: number; FW: number }> = {
  '4-3-3': { GK: 1, DF: 4, MF: 3, FW: 3 },
  '4-4-2': { GK: 1, DF: 4, MF: 4, FW: 2 },
  '3-5-2': { GK: 1, DF: 3, MF: 5, FW: 2 },
};

const STORAGE_KEY = 'k-fantasy-saved-teams';

export default function MyTeamPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, Player | null>>({});
  const [showPicker, setShowPicker] = useState<string | null>(null);

  // 저장 관련 상태
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [copied, setCopied] = useState(false);

  // LocalStorage에서 저장된 팀 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedTeams(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved teams:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetch('/data/players.json')
      .then(r => r.json())
      .then(data => {
        setPlayers(data);
        setLoading(false);
      });
  }, []);

  // 슬롯 생성
  const slots = useMemo(() => {
    const config = FORMATIONS[formation];
    const result: { id: string; group: 'GK' | 'DF' | 'MF' | 'FW'; index: number }[] = [];

    (['GK', 'DF', 'MF', 'FW'] as const).forEach(group => {
      for (let i = 0; i < config[group]; i++) {
        result.push({ id: `${group}-${i}`, group, index: i });
      }
    });

    return result;
  }, [formation]);

  // 총점 계산
  const totalScore = useMemo(() => {
    return Object.values(selectedPlayers)
      .filter(Boolean)
      .reduce((sum, p) => sum + (p?.predictedScore || 0), 0);
  }, [selectedPlayers]);

  const selectedCount = Object.values(selectedPlayers).filter(Boolean).length;

  const handleSelectPlayer = (slotId: string, player: Player) => {
    setSelectedPlayers(prev => ({ ...prev, [slotId]: player }));
    setShowPicker(null);
  };

  const handleRemovePlayer = (slotId: string) => {
    setSelectedPlayers(prev => ({ ...prev, [slotId]: null }));
  };

  // 선택 가능한 선수 (이미 선택된 선수 제외)
  const getAvailablePlayers = (group: 'GK' | 'DF' | 'MF' | 'FW') => {
    const selectedIds = Object.values(selectedPlayers).filter(Boolean).map(p => p!.id);
    return players
      .filter(p => getPositionGroup(p.position) === group && !selectedIds.includes(p.id))
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, 20);
  };

  // 팀 저장
  const handleSaveTeam = () => {
    if (!teamName.trim()) return;

    const newTeam: SavedTeam = {
      id: Date.now().toString(),
      name: teamName.trim(),
      formation,
      players: selectedPlayers as Record<string, Player>,
      totalScore,
      createdAt: new Date().toISOString(),
    };

    const updatedTeams = [...savedTeams, newTeam];
    setSavedTeams(updatedTeams);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTeams));

    setShowSaveModal(false);
    setTeamName('');
  };

  // 팀 불러오기
  const handleLoadTeam = (team: SavedTeam) => {
    setFormation(team.formation);
    setSelectedPlayers(team.players);
    setShowLoadModal(false);
  };

  // 팀 삭제
  const handleDeleteTeam = (teamId: string) => {
    const updatedTeams = savedTeams.filter(t => t.id !== teamId);
    setSavedTeams(updatedTeams);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTeams));
  };

  // 팀 공유 (URL 복사)
  const handleShareTeam = () => {
    const selectedIds = Object.entries(selectedPlayers)
      .filter(([_, p]) => p)
      .map(([slotId, p]) => `${slotId}:${p!.id}`)
      .join(',');

    const shareUrl = `${window.location.origin}/my-team?f=${formation}&p=${encodeURIComponent(selectedIds)}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 팀 초기화
  const handleClearTeam = () => {
    setSelectedPlayers({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            팀 빌더
          </h1>
          <p className="text-zinc-400">나만의 드림팀을 구성하고 예상 총점을 확인하세요</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {/* Formation Selector */}
          {Object.keys(FORMATIONS).map(f => (
            <button
              key={f}
              onClick={() => {
                setFormation(f as Formation);
                setSelectedPlayers({});
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                formation === f
                  ? 'gradient-gold text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={selectedCount === 0}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          팀 저장
        </button>
        <button
          onClick={() => setShowLoadModal(true)}
          disabled={savedTeams.length === 0}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderOpen className="w-4 h-4" />
          불러오기 ({savedTeams.length})
        </button>
        <button
          onClick={handleShareTeam}
          disabled={selectedCount === 0}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          {copied ? '복사됨!' : '공유'}
        </button>
        <button
          onClick={handleClearTeam}
          disabled={selectedCount === 0}
          className="bg-zinc-800 text-zinc-400 hover:text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          초기화
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Formation View */}
        <div className="lg:col-span-2">
          <div className="glass-card p-8 relative" style={{ minHeight: '500px' }}>
            {/* 피치 배경 */}
            <div className="absolute inset-4 bg-gradient-to-b from-green-900/30 to-green-800/20 rounded-xl border border-green-500/20" />

            {/* 포지션별 슬롯 */}
            <div className="relative z-10 h-full flex flex-col justify-between py-8">
              {/* FW */}
              <div className="flex justify-center gap-8 flex-wrap">
                {slots.filter(s => s.group === 'FW').map(slot => (
                  <SlotButton
                    key={slot.id}
                    slot={slot}
                    player={selectedPlayers[slot.id]}
                    onAdd={() => setShowPicker(slot.id)}
                    onRemove={() => handleRemovePlayer(slot.id)}
                  />
                ))}
              </div>

              {/* MF */}
              <div className="flex justify-center gap-6 flex-wrap">
                {slots.filter(s => s.group === 'MF').map(slot => (
                  <SlotButton
                    key={slot.id}
                    slot={slot}
                    player={selectedPlayers[slot.id]}
                    onAdd={() => setShowPicker(slot.id)}
                    onRemove={() => handleRemovePlayer(slot.id)}
                  />
                ))}
              </div>

              {/* DF */}
              <div className="flex justify-center gap-6 flex-wrap">
                {slots.filter(s => s.group === 'DF').map(slot => (
                  <SlotButton
                    key={slot.id}
                    slot={slot}
                    player={selectedPlayers[slot.id]}
                    onAdd={() => setShowPicker(slot.id)}
                    onRemove={() => handleRemovePlayer(slot.id)}
                  />
                ))}
              </div>

              {/* GK */}
              <div className="flex justify-center">
                {slots.filter(s => s.group === 'GK').map(slot => (
                  <SlotButton
                    key={slot.id}
                    slot={slot}
                    player={selectedPlayers[slot.id]}
                    onAdd={() => setShowPicker(slot.id)}
                    onRemove={() => handleRemovePlayer(slot.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats & Picker */}
        <div className="space-y-6">
          {/* Team Stats */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              팀 현황
            </h3>

            <div className="space-y-4">
              <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
                <p className="text-4xl font-bold gradient-text">{totalScore.toFixed(1)}</p>
                <p className="text-sm text-zinc-500">예상 총점</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">선수 구성</span>
                <span className="text-white">{selectedCount} / 11명</span>
              </div>

              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${(selectedCount / 11) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">평균 점수</span>
                <span className="text-white">
                  {selectedCount > 0 ? (totalScore / selectedCount).toFixed(1) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Player Picker */}
          {showPicker && (
            <div className="glass-card p-4 max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">선수 선택</h3>
                <button
                  onClick={() => setShowPicker(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {getAvailablePlayers(showPicker.split('-')[0] as 'GK' | 'DF' | 'MF' | 'FW').map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(showPicker, player)}
                    className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{player.name}</p>
                        <p className="text-xs text-zinc-500">{player.team} / {player.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold gradient-text">{player.predictedScore.toFixed(1)}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {((player.formIndex - 1) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Players List */}
          {!showPicker && selectedCount > 0 && (
            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-4">선택된 선수</h3>
              <div className="space-y-2">
                {Object.entries(selectedPlayers)
                  .filter(([_, p]) => p)
                  .map(([slotId, player]) => (
                    <div key={slotId} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{player!.name}</p>
                        <p className="text-xs text-zinc-500">{player!.position}</p>
                      </div>
                      <p className="font-bold gradient-text">{player!.predictedScore.toFixed(1)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-card p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">팀 저장</h3>
            <input
              type="text"
              placeholder="팀 이름 입력..."
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="w-full mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveModal(false)} className="btn-secondary">
                취소
              </button>
              <button onClick={handleSaveTeam} disabled={!teamName.trim()} className="btn-primary disabled:opacity-50">
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLoadModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">저장된 팀</h3>
              <button onClick={() => setShowLoadModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {savedTeams.map(team => (
                <div key={team.id} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-white">{team.name}</h4>
                      <p className="text-xs text-zinc-500">
                        {team.formation} • {new Date(team.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <p className="text-xl font-bold gradient-text">{team.totalScore.toFixed(1)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadTeam(team)}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      불러오기
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-2 bg-zinc-700 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Slot Button Component
function SlotButton({
  slot,
  player,
  onAdd,
  onRemove,
}: {
  slot: { id: string; group: string };
  player: Player | null | undefined;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const groupColors: Record<string, string> = {
    GK: 'border-green-500 bg-green-500/10',
    DF: 'border-blue-500 bg-blue-500/10',
    MF: 'border-purple-500 bg-purple-500/10',
    FW: 'border-red-500 bg-red-500/10',
  };

  if (player) {
    return (
      <div className={`relative formation-slot filled ${groupColors[slot.group]}`}>
        <div className="text-center">
          <p className="text-xs font-bold text-white truncate max-w-[60px]">{player.name}</p>
          <p className="text-[10px] text-amber-400">{player.predictedScore.toFixed(1)}</p>
        </div>
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={onAdd} className={`formation-slot ${groupColors[slot.group]}`}>
      <Plus className="w-6 h-6 text-zinc-400" />
    </button>
  );
}
