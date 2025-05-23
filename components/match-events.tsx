"use client"

import { useState, useEffect } from "react"
import { Goal, Flag, Clock, Star, Award, Check, X, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Match, Team, Player } from "@/lib/types"

// Match events interfaces
export interface MatchGoal {
  id: string
  playerId: string
  teamId: string
  minute: number
  assistPlayerId?: string
  isOwnGoal?: boolean
  isPenalty?: boolean
  note?: string
}

export interface MatchCard {
  id: string
  playerId: string
  teamId: string
  minute: number
  type: 'yellow' | 'red'
  reason?: string
}

export interface MatchEvents {
  goals: MatchGoal[]
  cards: MatchCard[]
}

interface MatchEventsProps {
  match: Match
  homeTeam: Team
  awayTeam: Team
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveEvents: (events: MatchEvents, updatedPlayers?: {player: Player, teamId: string}[]) => void
}

export default function MatchEvents({ match, homeTeam, awayTeam, open, onOpenChange, onSaveEvents }: MatchEventsProps) {
  const [activeTab, setActiveTab] = useState("add")
  const [goals, setGoals] = useState<MatchGoal[]>([])
  const [cards, setCards] = useState<MatchCard[]>([])
  
  // New goal form state
  const [newGoal, setNewGoal] = useState<{
    teamId: string;
    playerId: string;
    minute: number;
    assistPlayerId?: string;
    isOwnGoal: boolean;
    isPenalty: boolean;
    note: string;
  }>({
    teamId: homeTeam.id,
    playerId: "",
    minute: 1,
    assistPlayerId: "",
    isOwnGoal: false,
    isPenalty: false,
    note: ""
  })
  
  // New card form state
  const [newCard, setNewCard] = useState<{
    teamId: string;
    playerId: string;
    minute: number;
    type: 'yellow' | 'red';
    reason: string;
  }>({
    teamId: homeTeam.id,
    playerId: "",
    minute: 1,
    type: 'yellow',
    reason: ""
  })
  
  // Effect to load existing events when the component opens
  useEffect(() => {
    if (open && match.events) {
      setGoals(match.events.goals || [])
      setCards(match.events.cards || [])
    } else if (open) {
      // Initialize with empty arrays if no events exist
      setGoals([])
      setCards([])
    }
  }, [open, match])
  
  // Helper to count effective goals for a team considering own goals
  const countEffectiveGoals = (teamId: string): number => {
    const regularGoals = goals.filter(g => g.teamId === teamId && !g.isOwnGoal).length;
    const ownGoalsFromOpponent = goals.filter(g => 
      g.teamId !== teamId && g.isOwnGoal
    ).length;
    
    return regularGoals + ownGoalsFromOpponent;
  }
  
  // Check if team has reached its goal limit
  const hasReachedGoalLimit = (teamId: string): boolean => {
    if (!match.completed || match.homeScore === undefined || match.awayScore === undefined) {
      return false; // No limit if the match is not completed or scores aren't set
    }
    
    const isHomeTeam = teamId === homeTeam.id;
    const allowedGoals = isHomeTeam ? match.homeScore : match.awayScore;
    const currentGoals = countEffectiveGoals(teamId);
    
    return currentGoals >= allowedGoals;
  }
  
  // Get remaining goals allowed for a team
  const getRemainingGoals = (teamId: string): number => {
    if (!match.completed || match.homeScore === undefined || match.awayScore === undefined) {
      return Infinity; // No limit if the match is not completed
    }
    
    const isHomeTeam = teamId === homeTeam.id;
    const allowedGoals = isHomeTeam ? match.homeScore : match.awayScore;
    const currentGoals = countEffectiveGoals(teamId);
    
    return Math.max(0, allowedGoals - currentGoals);
  }
  
  const handleSave = () => {
    const events: MatchEvents = {
      goals,
      cards
    }
    
    // Tạo danh sách cầu thủ cần cập nhật
    const updatedPlayers: {player: Player, teamId: string}[] = [];
    
    // Cập nhật thông tin thẻ phạt cho cầu thủ
    if (cards.length > 0) {
      // Tạo map để đếm số thẻ mới của mỗi cầu thủ trong trận đấu này
      const playerCardCounts = new Map<string, {yellow: number, red: number}>();
      
      // Group cards by player
      cards.forEach(card => {
        const playerKey = card.playerId;
        const currentCounts = playerCardCounts.get(playerKey) || {yellow: 0, red: 0};
        
        if (card.type === 'yellow') {
          currentCounts.yellow++;
        } else {
          currentCounts.red++;
        }
        
        playerCardCounts.set(playerKey, currentCounts);
      });
      
      // Process home team players
      homeTeam.players.forEach(player => {
        const cardCounts = playerCardCounts.get(player.id);
        
        if (cardCounts) {
          // Get the original values, accounting for undefined
          const originalYellow = player.yellowCards || 0;
          const originalRed = player.redCards || 0;
          
          // Only update the player if there are new cards to add
          // We're resetting the values for this match instead of adding to any existing totals
          // This prevents double-counting when editing match events
          const updatedPlayer = { 
            ...player,
            yellowCards: cardCounts.yellow,
            redCards: cardCounts.red
          };
          
          // Check for existing data from previous matches if needed
          if (match.events) {
            // Count cards from previous matches (not current match)
            // by looking at all players' cards across all matches except this one
            const previousMatchYellow = originalYellow - (
              match.events.cards
                .filter(c => c.playerId === player.id && c.type === 'yellow')
                .length || 0
            );
            
            const previousMatchRed = originalRed - (
              match.events.cards
                .filter(c => c.playerId === player.id && c.type === 'red')
                .length || 0
            );
            
            // Add previous match counts to new counts
            updatedPlayer.yellowCards = Math.max(0, previousMatchYellow + cardCounts.yellow);
            updatedPlayer.redCards = Math.max(0, previousMatchRed + cardCounts.red);
          }
          
          updatedPlayers.push({
            player: updatedPlayer,
            teamId: homeTeam.id
          });
        }
      });
      
      // Process away team players - same logic as above
      awayTeam.players.forEach(player => {
        const cardCounts = playerCardCounts.get(player.id);
        
        if (cardCounts) {
          const originalYellow = player.yellowCards || 0;
          const originalRed = player.redCards || 0;
          
          const updatedPlayer = {
            ...player,
            yellowCards: cardCounts.yellow,
            redCards: cardCounts.red
          };
          
          if (match.events) {
            const previousMatchYellow = originalYellow - (
              match.events.cards
                .filter(c => c.playerId === player.id && c.type === 'yellow')
                .length || 0
            );
            
            const previousMatchRed = originalRed - (
              match.events.cards
                .filter(c => c.playerId === player.id && c.type === 'red')
                .length || 0
            );
            
            updatedPlayer.yellowCards = Math.max(0, previousMatchYellow + cardCounts.yellow);
            updatedPlayer.redCards = Math.max(0, previousMatchRed + cardCounts.red);
          }
          
          updatedPlayers.push({
            player: updatedPlayer,
            teamId: awayTeam.id
          });
        }
      });
    }
    
    // Gọi callback với thông tin sự kiện và cầu thủ đã cập nhật
    onSaveEvents(events, updatedPlayers);
    onOpenChange(false);
  }
  
  const handleAddGoal = () => {
    // Validate if the goal would exceed the match score limit
    const scoringTeam = newGoal.isOwnGoal ? 
      (newGoal.teamId === homeTeam.id ? awayTeam.id : homeTeam.id) : 
      newGoal.teamId;
    
    if (hasReachedGoalLimit(scoringTeam)) {
      // Goal would exceed the limit, do not add
      alert(`Không thể thêm bàn thắng vì đội đã đạt giới hạn ${
        scoringTeam === homeTeam.id ? match.homeScore : match.awayScore
      } bàn thắng trong trận đấu này.`);
      return;
    }
    
    const newGoalItem: MatchGoal = {
      id: `goal-${Date.now()}`,
      playerId: newGoal.playerId,
      teamId: newGoal.teamId,
      minute: newGoal.minute,
      assistPlayerId: newGoal.assistPlayerId === "none" ? undefined : newGoal.assistPlayerId,
      isOwnGoal: newGoal.isOwnGoal,
      isPenalty: newGoal.isPenalty,
      note: newGoal.note
    }
    
    setGoals([...goals, newGoalItem])
    
    // Reset form
    setNewGoal({
      teamId: newGoal.teamId, // keep the same team selected
      playerId: "",
      minute: 1,
      assistPlayerId: undefined,
      isOwnGoal: false,
      isPenalty: false,
      note: ""
    })
  }
  
  const handleAddCard = () => {
    const newCardItem: MatchCard = {
      id: `card-${Date.now()}`,
      playerId: newCard.playerId,
      teamId: newCard.teamId,
      minute: newCard.minute,
      type: newCard.type,
      reason: newCard.reason
    }
    
    setCards([...cards, newCardItem])
    
    // Reset form
    setNewCard({
      teamId: newCard.teamId, // keep the same team selected
      playerId: "",
      minute: 1,
      type: 'yellow',
      reason: ""
    })
  }
  
  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id))
  }
  
  const handleDeleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id))
  }
  
  // Helper to get player by ID
  const getPlayer = (playerId: string): Player | undefined => {
    const homePlayer = homeTeam.players.find(p => p.id === playerId)
    if (homePlayer) return homePlayer
    
    return awayTeam.players.find(p => p.id === playerId)
  }
  
  // Helper to get team by ID
  const getTeam = (teamId: string): Team | undefined => {
    if (teamId === homeTeam.id) return homeTeam
    if (teamId === awayTeam.id) return awayTeam
    return undefined
  }
  
  // Format minute for display (e.g., 45+2)
  const formatMinute = (minute: number): string => {
    if (minute <= 45) return minute.toString()
    if (minute > 45 && minute <= 90) return minute.toString()
    if (minute > 90) return `90+${minute - 90}`
    return minute.toString()
  }
  
  // Helper to determine if Add Goal button should be disabled
  const isAddGoalDisabled = (): boolean => {
    if (!newGoal.playerId) return true;
    
    // Determine effective scoring team (accounting for own goals)
    const scoringTeam = newGoal.isOwnGoal ? 
      (newGoal.teamId === homeTeam.id ? awayTeam.id : homeTeam.id) : 
      newGoal.teamId;
    
    return hasReachedGoalLimit(scoringTeam);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Goal className="h-5 w-5" /> 
              Sự kiện trận đấu: {match.homeTeam} vs {match.awayTeam}
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="add" className="rounded-none py-3">
                Thêm sự kiện
              </TabsTrigger>
              <TabsTrigger value="view" className="rounded-none py-3">
                Xem sự kiện
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Thêm sự kiện tab */}
          <TabsContent value="add" className="mt-0 px-6 py-4 h-[500px] overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-8">
                {/* Bàn thắng form */}
                <div>
                  <h3 className="font-medium text-left pb-2 flex items-center">
                    <Goal className="h-4 w-4 mr-2" />
                    Thêm bàn thắng
                  </h3>
                  
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teamSelect">Đội</Label>
                        <Select 
                          value={newGoal.teamId}
                          onValueChange={(value) => setNewGoal({...newGoal, teamId: value})}
                        >
                          <SelectTrigger id="teamSelect">
                            <SelectValue placeholder="Chọn đội" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={homeTeam.id}>
                              {homeTeam.name} (Đội nhà)
                            </SelectItem>
                            <SelectItem value={awayTeam.id}>
                              {awayTeam.name} (Đội khách)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="minuteInput">Phút</Label>
                        <Input 
                          id="minuteInput"
                          type="number"
                          min="1"
                          max="120"
                          value={newGoal.minute}
                          onChange={e => setNewGoal({...newGoal, minute: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="playerSelect">Người ghi bàn</Label>
                      <Select 
                        value={newGoal.playerId}
                        onValueChange={(value) => setNewGoal({...newGoal, playerId: value})}
                      >
                        <SelectTrigger id="playerSelect">
                          <SelectValue placeholder="Chọn cầu thủ ghi bàn" />
                        </SelectTrigger>
                        <SelectContent>
                          {(newGoal.teamId === homeTeam.id ? homeTeam.players : awayTeam.players)
                            .map(player => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.number && `#${player.number} `}{player.name} - {player.position}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="assistSelect">Kiến tạo (không bắt buộc)</Label>
                      <Select 
                        value={newGoal.assistPlayerId || "none"}
                        onValueChange={(value) => setNewGoal({...newGoal, assistPlayerId: value === "none" ? undefined : value})}
                      >
                        <SelectTrigger id="assistSelect">
                          <SelectValue placeholder="Chọn cầu thủ kiến tạo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không có kiến tạo</SelectItem>
                          {(newGoal.teamId === homeTeam.id ? homeTeam.players : awayTeam.players)
                            .filter(player => player.id !== newGoal.playerId) // Exclude the goal scorer
                            .map(player => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.number && `#${player.number} `}{player.name} - {player.position}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="ownGoal"
                          checked={newGoal.isOwnGoal}
                          onChange={e => setNewGoal({...newGoal, isOwnGoal: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="ownGoal">Phản lưới nhà</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="penalty"
                          checked={newGoal.isPenalty}
                          onChange={e => setNewGoal({...newGoal, isPenalty: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="penalty">Phạt đền</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="goalNote">Ghi chú (không bắt buộc)</Label>
                      <Textarea 
                        id="goalNote"
                        placeholder="Mô tả chi tiết về bàn thắng..."
                        value={newGoal.note}
                        onChange={e => setNewGoal({...newGoal, note: e.target.value})}
                      />
                    </div>
                    
                    {/* Display remaining goals information */}
                    <div className="text-sm text-gray-600">
                      {match.completed && match.homeScore !== undefined && match.awayScore !== undefined && (
                        <div className="flex justify-between border-t pt-2">
                          <span>
                            {homeTeam.name}: {getRemainingGoals(homeTeam.id)} bàn còn lại
                          </span>
                          <span>
                            {awayTeam.name}: {getRemainingGoals(awayTeam.id)} bàn còn lại
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddGoal} 
                        disabled={isAddGoalDisabled()}
                        title={isAddGoalDisabled() && newGoal.playerId ? "Đã đạt giới hạn bàn thắng cho đội này" : ""}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Thêm bàn thắng
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Thẻ phạt form */}
                <div>
                  <h3 className="font-medium text-left pb-2 flex items-center">
                    <Flag className="h-4 w-4 mr-2" />
                    Thêm thẻ phạt
                  </h3>
                  
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardTeamSelect">Đội</Label>
                        <Select 
                          value={newCard.teamId}
                          onValueChange={(value) => setNewCard({...newCard, teamId: value})}
                        >
                          <SelectTrigger id="cardTeamSelect">
                            <SelectValue placeholder="Chọn đội" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={homeTeam.id}>
                              {homeTeam.name} (Đội nhà)
                            </SelectItem>
                            <SelectItem value={awayTeam.id}>
                              {awayTeam.name} (Đội khách)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cardMinuteInput">Phút</Label>
                        <Input 
                          id="cardMinuteInput"
                          type="number"
                          min="1"
                          max="120"
                          value={newCard.minute}
                          onChange={e => setNewCard({...newCard, minute: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardPlayerSelect">Cầu thủ nhận thẻ</Label>
                        <Select 
                          value={newCard.playerId}
                          onValueChange={(value) => setNewCard({...newCard, playerId: value})}
                        >
                          <SelectTrigger id="cardPlayerSelect">
                            <SelectValue placeholder="Chọn cầu thủ" />
                          </SelectTrigger>
                          <SelectContent>
                            {(newCard.teamId === homeTeam.id ? homeTeam.players : awayTeam.players)
                              .map(player => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.number && `#${player.number} `}{player.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cardTypeSelect">Loại thẻ</Label>
                        <Select 
                          value={newCard.type}
                          onValueChange={(value: 'yellow' | 'red') => setNewCard({...newCard, type: value})}
                        >
                          <SelectTrigger id="cardTypeSelect" className={newCard.type === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}>
                            <SelectValue placeholder="Chọn loại thẻ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yellow" className="bg-yellow-50">
                              <div className="flex items-center">
                                <div className="w-4 h-6 bg-yellow-400 mr-2"></div>
                                Thẻ vàng
                              </div>
                            </SelectItem>
                            <SelectItem value="red" className="bg-red-50">
                              <div className="flex items-center">
                                <div className="w-4 h-6 bg-red-500 mr-2"></div>
                                Thẻ đỏ
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cardReason">Lý do phạt thẻ</Label>
                      <Textarea 
                        id="cardReason"
                        placeholder="Lý do nhận thẻ..."
                        value={newCard.reason}
                        onChange={e => setNewCard({...newCard, reason: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddCard} 
                        disabled={!newCard.playerId}
                        className={newCard.type === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Thêm thẻ {newCard.type === 'yellow' ? 'vàng' : 'đỏ'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Danh sách sự kiện hiện tại */}
                {(goals.length > 0 || cards.length > 0) && (
                  <div>
                    <h3 className="font-medium text-left pb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Sự kiện đã thêm
                    </h3>
                    
                    <div className="space-y-3 border rounded-lg p-4">
                      {/* Timeline items sorted by minute */}
                      {[...goals, ...cards]
                        .sort((a, b) => a.minute - b.minute)
                        .map((event) => {
                          const isGoal = 'isOwnGoal' in event
                          const player = getPlayer(event.playerId)
                          const team = getTeam(event.teamId)
                          
                          if (!player || !team) return null
                          
                          return (
                            <div 
                              key={event.id} 
                              className={`flex items-center p-2 rounded-lg border ${
                                isGoal 
                                  ? 'bg-green-50 border-green-200' 
                                  : (event as MatchCard).type === 'yellow'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-red-50 border-red-200'
                              }`}
                            >
                              {/* Minute */}
                              <div className="flex-shrink-0 min-w-[45px] text-center bg-gray-100 rounded-md py-1 mr-2 text-sm font-medium">
                                {formatMinute(event.minute)}'
                              </div>
                              
                              {/* Icon */}
                              <div className="flex-shrink-0 mx-2">
                                {isGoal ? (
                                  <Goal className="h-5 w-5 text-green-600" />
                                ) : (
                                  <div className={`w-3 h-5 ${(event as MatchCard).type === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-grow">
                                <div className="font-medium">
                                  {player.name}
                                  {isGoal && (event as MatchGoal).assistPlayerId && (
                                    <span className="text-sm text-gray-600">
                                      {' '} (Kiến Tạo Bởi {getPlayer((event as MatchGoal).assistPlayerId!)?.name})
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-600">
                                  {team.name}
                                  {isGoal && (
                                    <>
                                      {(event as MatchGoal).isOwnGoal && <span className="ml-1">(phản lưới nhà)</span>}
                                      {(event as MatchGoal).isPenalty && <span className="ml-1">(phạt đền)</span>}
                                    </>
                                  )}
                                </div>
                                
                                {((isGoal && (event as MatchGoal).note) || 
                                  (!isGoal && (event as MatchCard).reason)) && (
                                  <div className="text-sm mt-1">
                                    {isGoal ? (event as MatchGoal).note : (event as MatchCard).reason}
                                  </div>
                                )}
                              </div>
                              
                              {/* Delete button */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex-shrink-0 text-gray-500 hover:text-red-500" 
                                onClick={() => isGoal ? handleDeleteGoal(event.id) : handleDeleteCard(event.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Xem sự kiện tab */}
          <TabsContent value="view" className="mt-0 px-6 py-4 h-[500px] overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-8">
                {/* Match info */}
                <div className="mb-4 border-b pb-4">
                  <h2 className="text-xl font-bold mb-1">{match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}</h2>
                  <p className="text-gray-500 text-sm">{new Date(match.date).toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="outline">{match.competition}</Badge>
                    <Badge variant="outline">{match.venue}</Badge>
                  </div>
                </div>
                
                {/* Timeline of events */}
                <div className="relative space-y-8">
                  {/* Filter and sort events by minute */}
                  {[...goals, ...cards]
                    .sort((a, b) => a.minute - b.minute)
                    .map((event, index) => {
                      const isGoal = 'isOwnGoal' in event
                      const player = getPlayer(event.playerId)
                      const team = getTeam(event.teamId)
                      
                      if (!player || !team) return null
                      
                      const assistPlayer = isGoal && (event as MatchGoal).assistPlayerId 
                        ? getPlayer((event as MatchGoal).assistPlayerId!) 
                        : undefined
                      
                      return (
                        <div key={event.id} className="flex items-start">
                          {/* Minute column */}
                          <div className="flex-shrink-0 w-16 pr-4 text-right">
                            <span className="inline-flex items-center justify-center h-7 min-w-[45px] rounded-full bg-gray-100 text-sm font-medium">
                              {formatMinute(event.minute)}'
                            </span>
                          </div>
                          
                          {/* Icon column */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div 
                              className={`flex items-center justify-center w-7 h-7 rounded-full ${
                                isGoal 
                                  ? 'bg-green-500' 
                                  : (event as MatchCard).type === 'yellow'
                                    ? 'bg-yellow-400'
                                    : 'bg-red-500'
                              }`}
                            >
                              {isGoal ? (
                                <Goal className="h-3.5 w-3.5 text-white" />
                              ) : (
                                <div className="w-2.5 h-4 bg-white"></div>
                              )}
                            </div>
                          </div>
                          
                          {/* Content column */}
                          <div className="flex-grow pl-4">
                            <div className={`p-3 rounded-lg border ${
                              isGoal 
                                ? 'bg-green-50 border-green-100' 
                                : (event as MatchCard).type === 'yellow'
                                  ? 'bg-yellow-50 border-yellow-100'
                                  : 'bg-red-50 border-red-100'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                      {player.number || '?'}
                                    </span>
                                    {player.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {team.name === homeTeam.name ? 'Đội nhà' : 'Đội khách'}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div>
                                    {isGoal ? (
                                      <Badge className="bg-green-500">
                                        {(event as MatchGoal).isOwnGoal ? 'Phản lưới nhà' : 'Bàn thắng'}
                                      </Badge>
                                    ) : (
                                      <Badge className={(event as MatchCard).type === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}>
                                        Thẻ {(event as MatchCard).type === 'yellow' ? 'vàng' : 'đỏ'}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {isGoal && (event as MatchGoal).isPenalty && (
                                    <Badge variant="outline" className="mt-1 text-xs">Phạt đền</Badge>
                                  )}
                                </div>
                              </div>
                              
                              {isGoal && assistPlayer && (
                                <div className="mt-2 flex items-center text-sm text-gray-700">
                                  <Award className="h-4 w-4 mr-1 text-blue-500" />
                                  Kiến tạo: {assistPlayer.name}
                                </div>
                              )}
                              
                              {((isGoal && (event as MatchGoal).note) || (!isGoal && (event as MatchCard).reason)) && (
                                <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border">
                                  {isGoal ? (event as MatchGoal).note : (event as MatchCard).reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  
                  {goals.length === 0 && cards.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có sự kiện nào được thêm vào trận đấu này
                    </div>
                  )}
                </div>
                
                {/* Match statistics */}
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Thống kê</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        {/* Bàn thắng của đội nhà = bàn thắng thông thường + phản lưới của đối phương */}
                        <span>{
                          goals.filter(g => 
                            (g.teamId === homeTeam.id && !g.isOwnGoal) || 
                            (g.teamId === awayTeam.id && g.isOwnGoal)
                          ).length
                        }</span>
                        <span>Bàn thắng</span>
                        {/* Bàn thắng của đội khách = bàn thắng thông thường + phản lưới của đội nhà */}
                        <span>{
                          goals.filter(g => 
                            (g.teamId === awayTeam.id && !g.isOwnGoal) || 
                            (g.teamId === homeTeam.id && g.isOwnGoal)
                          ).length
                        }</span>
                      </div>
                      <div className="flex h-2 bg-gray-200 rounded overflow-hidden">
                        {/* Tính tỷ lệ bàn thắng đội nhà */}
                        <div 
                          className="bg-blue-500" 
                          style={{ 
                            width: `${(goals.filter(g => 
                              (g.teamId === homeTeam.id && !g.isOwnGoal) || 
                              (g.teamId === awayTeam.id && g.isOwnGoal)
                            ).length / Math.max(1, goals.length)) * 100}%` 
                          }}
                        ></div>
                        {/* Tính tỷ lệ bàn thắng đội khách */}
                        <div 
                          className="bg-red-500" 
                          style={{ 
                            width: `${(goals.filter(g => 
                              (g.teamId === awayTeam.id && !g.isOwnGoal) || 
                              (g.teamId === homeTeam.id && g.isOwnGoal)
                            ).length / Math.max(1, goals.length)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{cards.filter(c => c.teamId === homeTeam.id && c.type === 'yellow').length}</span>
                        <span>Thẻ vàng</span>
                        <span>{cards.filter(c => c.teamId === awayTeam.id && c.type === 'yellow').length}</span>
                      </div>
                      <div className="flex h-2 bg-gray-200 rounded overflow-hidden">
                        <div 
                          className="bg-yellow-400" 
                          style={{ 
                            width: `${(cards.filter(c => c.teamId === homeTeam.id && c.type === 'yellow').length / Math.max(1, cards.filter(c => c.type === 'yellow').length)) * 100}%` 
                          }}
                        ></div>
                        <div 
                          className="bg-yellow-400" 
                          style={{ 
                            width: `${(cards.filter(c => c.teamId === awayTeam.id && c.type === 'yellow').length / Math.max(1, cards.filter(c => c.type === 'yellow').length)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{cards.filter(c => c.teamId === homeTeam.id && c.type === 'red').length}</span>
                        <span>Thẻ đỏ</span>
                        <span>{cards.filter(c => c.teamId === awayTeam.id && c.type === 'red').length}</span>
                      </div>
                      <div className="flex h-2 bg-gray-200 rounded overflow-hidden">
                        <div 
                          className="bg-red-500" 
                          style={{ 
                            width: `${(cards.filter(c => c.teamId === homeTeam.id && c.type === 'red').length / Math.max(1, cards.filter(c => c.type === 'red').length)) * 100}%` 
                          }}
                        ></div>
                        <div 
                          className="bg-red-500" 
                          style={{ 
                            width: `${(cards.filter(c => c.teamId === awayTeam.id && c.type === 'red').length / Math.max(1, cards.filter(c => c.type === 'red').length)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="px-6 py-4 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave}>
            Lưu sự kiện
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 