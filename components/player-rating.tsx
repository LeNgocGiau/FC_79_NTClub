"use client"

import { useState, useEffect } from "react"
import { Star, Trophy, X, Goal } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Player, Team, Match } from "@/lib/types"

interface PlayerRating {
  playerId: string
  score: number
  isMVP?: boolean
  comment?: string
  number?: number
  yellowCards?: number
  redCards?: number
}

interface PlayerRatingsData {
  matchId: string
  homeTeamRatings: PlayerRating[]
  awayTeamRatings: PlayerRating[]
  homeMVP?: string
  awayMVP?: string
}

interface PlayerRatingProps {
  match: Match
  homeTeam: Team
  awayTeam: Team
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveRatings: (ratings: PlayerRatingsData) => void
}

export default function PlayerRating({ match, homeTeam, awayTeam, open, onOpenChange, onSaveRatings }: PlayerRatingProps) {
  const [homeTeamRatings, setHomeTeamRatings] = useState<PlayerRating[]>([])
  const [awayTeamRatings, setAwayTeamRatings] = useState<PlayerRating[]>([])
  const [homeMVP, setHomeMVP] = useState<string | undefined>()
  const [awayMVP, setAwayMVP] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState("evaluate")

  // Initialize and synchronize ratings
  useEffect(() => {
    if (open) {
      // Check if match already has ratings
      if (match.playerRatings) {
        setHomeTeamRatings(match.playerRatings.homeTeamRatings || [])
        setAwayTeamRatings(match.playerRatings.awayTeamRatings || [])
        setHomeMVP(match.playerRatings.homeMVP)
        setAwayMVP(match.playerRatings.awayMVP)
      } else {
        // Initialize with players from current teams
      const initialHomeRatings = homeTeam.players
        .filter(player => !player.isSubstitute)
        .map(player => ({
          playerId: player.id,
            score: 0,
            comment: "",
            number: player.number,
            yellowCards: player.yellowCards,
            redCards: player.redCards
        }))

      const initialAwayRatings = awayTeam.players
        .filter(player => !player.isSubstitute)
        .map(player => ({
          playerId: player.id,
            score: 0,
            comment: "",
            number: player.number,
            yellowCards: player.yellowCards,
            redCards: player.redCards
        }))

      setHomeTeamRatings(initialHomeRatings)
      setAwayTeamRatings(initialAwayRatings)
      setHomeMVP(undefined)
      setAwayMVP(undefined)
    }
    }
  }, [open, match.playerRatings, homeTeam.players, awayTeam.players])
  
  // Function to synchronize player data without causing infinite loops
  // Can be called when needed (e.g., after player edits)
  const syncPlayerData = () => {
    // Check if any players were removed or added on either team
    const homePlayerIds = new Set(homeTeam.players.map(p => p.id))
    const awayPlayerIds = new Set(awayTeam.players.map(p => p.id))
    
    // Add ratings for new players
    const newHomePlayers = homeTeam.players
      .filter(p => !p.isSubstitute && !homeTeamRatings.some(r => r.playerId === p.id))
      .map(p => ({
        playerId: p.id,
        score: 0,
        comment: "",
        number: p.number,
        yellowCards: p.yellowCards,
        redCards: p.redCards
      }))
    
    const newAwayPlayers = awayTeam.players
      .filter(p => !p.isSubstitute && !awayTeamRatings.some(r => r.playerId === p.id))
      .map(p => ({
        playerId: p.id,
        score: 0,
        comment: "",
        number: p.number,
        yellowCards: p.yellowCards,
        redCards: p.redCards
      }))
    
    let updatedHomeRatings = [...homeTeamRatings]
    let updatedAwayRatings = [...awayTeamRatings]
    let updatedHomeMVP = homeMVP
    let updatedAwayMVP = awayMVP
    
    if (newHomePlayers.length > 0) {
      updatedHomeRatings = [...updatedHomeRatings, ...newHomePlayers]
    }
    
    if (newAwayPlayers.length > 0) {
      updatedAwayRatings = [...updatedAwayRatings, ...newAwayPlayers]
    }
    
    // Remove ratings for players that no longer exist
    updatedHomeRatings = updatedHomeRatings.filter(r => homePlayerIds.has(r.playerId))
    updatedAwayRatings = updatedAwayRatings.filter(r => awayPlayerIds.has(r.playerId))
    
    // Update MVP if the player was removed
    if (updatedHomeMVP && !homePlayerIds.has(updatedHomeMVP)) {
      updatedHomeMVP = undefined
    }
    
    if (updatedAwayMVP && !awayPlayerIds.has(updatedAwayMVP)) {
      updatedAwayMVP = undefined
    }
    
    // Set all states at once to minimize renders
    setHomeTeamRatings(updatedHomeRatings)
    setAwayTeamRatings(updatedAwayRatings)
    if (homeMVP !== updatedHomeMVP) setHomeMVP(updatedHomeMVP)
    if (awayMVP !== updatedAwayMVP) setAwayMVP(updatedAwayMVP)
  }

  const handleRating = (playerId: string, score: number, isHomeTeam: boolean) => {
    // Ensure score is between 0 and 10
    const validScore = Math.min(Math.max(score, 0), 10)
    
    if (isHomeTeam) {
      setHomeTeamRatings(ratings => 
        ratings.map(rating => 
          rating.playerId === playerId ? { ...rating, score: validScore } : rating
        )
      )
    } else {
      setAwayTeamRatings(ratings => 
        ratings.map(rating => 
          rating.playerId === playerId ? { ...rating, score: validScore } : rating
        )
      )
    }
  }

  const handleSetMVP = (playerId: string, isHomeTeam: boolean) => {
    if (isHomeTeam) {
      setHomeMVP(homeMVP === playerId ? undefined : playerId)
    } else {
      setAwayMVP(awayMVP === playerId ? undefined : playerId)
    }
  }
  
  const handleUpdateComment = (playerId: string, comment: string, isHomeTeam: boolean) => {
    if (isHomeTeam) {
      setHomeTeamRatings(ratings => 
        ratings.map(rating => 
          rating.playerId === playerId ? { ...rating, comment } : rating
        )
      )
    } else {
      setAwayTeamRatings(ratings => 
        ratings.map(rating => 
          rating.playerId === playerId ? { ...rating, comment } : rating
        )
      )
    }
  }

  const handleSave = () => {
    const ratings: PlayerRatingsData = {
      matchId: match.id,
      homeTeamRatings: homeTeamRatings.map(rating => ({
        ...rating,
        isMVP: rating.playerId === homeMVP
      })),
      awayTeamRatings: awayTeamRatings.map(rating => ({
        ...rating,
        isMVP: rating.playerId === awayMVP
      })),
      homeMVP,
      awayMVP
    }
    onSaveRatings(ratings)
    onOpenChange(false)
  }

  // Find player by ID
  const findPlayer = (id: string, isHomeTeam: boolean): Player | undefined => {
    return isHomeTeam 
      ? homeTeam.players.find(p => p.id === id)
      : awayTeam.players.find(p => p.id === id)
  }

  // Get rating status
  const getRatingStatus = (score: number): string => {
    if (score >= 7) return "Tốt";
    if (score >= 6) return "Khá";
    if (score >= 5) return "Tạm được"; 
    if (score >= 3.5) return "Kém";
    if (score > 0) return "Rất kém";
    return "";
  }
  
  // Get rating status class
  const getRatingStatusClass = (score: number): string => {
    if (score >= 7) return "bg-blue-500"; // Tốt
    if (score >= 6) return "bg-teal-500"; // Khá
    if (score >= 5) return "bg-gray-500"; // Tạm được
    if (score >= 3.5) return "bg-orange-500"; // Kém
    return "bg-red-500"; // Rất kém
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Helper function to get number of goals scored by a player
  const getPlayerGoals = (playerId: string): number => {
    if (!match.events?.goals) return 0;
    return match.events.goals.filter(
      goal => goal.playerId === playerId && !goal.isOwnGoal
    ).length;
  }

  // Helper function to get number of assists by a player
  const getPlayerAssists = (playerId: string): number => {
    if (!match.events?.goals) return 0;
    return match.events.goals.filter(
      goal => goal.assistPlayerId === playerId
    ).length;
  }

  // Helper function to get number of own goals by a player
  const getPlayerOwnGoals = (playerId: string): number => {
    if (!match.events?.goals) return 0;
    return match.events.goals.filter(
      goal => goal.playerId === playerId && goal.isOwnGoal
    ).length;
  }

  // Helper function to get number of penalty goals by a player
  const getPlayerPenaltyGoals = (playerId: string): number => {
    if (!match.events?.goals) return 0;
    return match.events.goals.filter(
      goal => goal.playerId === playerId && goal.isPenalty && !goal.isOwnGoal
    ).length;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="p-6 pb-0">
        <DialogHeader>
            <DialogTitle className="text-lg font-bold">Đánh giá cầu thủ</DialogTitle>
        </DialogHeader>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="evaluate" className="rounded-none py-3">
                Đánh giá
              </TabsTrigger>
              <TabsTrigger value="view" className="rounded-none py-3">
                Xem đánh giá
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="evaluate" className="mt-0 px-6 py-4 h-[500px] overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-2 gap-8">
                {/* Đội nhà */}
                <div className="space-y-4">
                  <h3 className="font-medium text-left pb-2">Đội nhà</h3>
                  {homeTeamRatings.map((rating) => {
                    const player = findPlayer(rating.playerId, true);
                    if (!player) return null;
                    
                    const isMVP = rating.playerId === homeMVP;
                
                return (
                      <div key={rating.playerId} className="mb-8 last:mb-0">
                        <div className="flex mb-2 items-center">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white ${isMVP ? 'bg-yellow-500' : 'bg-blue-500'} mr-3`}>
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
                            ) : player.number ? (
                              <span className="text-xs font-bold">{player.number}</span>
                            ) : (
                              <div className="text-xs">
                                {player.position.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-xs text-gray-500">{player.position}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {(player.yellowCards && player.yellowCards > 0) && (
                                <span className="inline-flex items-center bg-yellow-400 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.yellowCards}🟨
                                </span>
                              )}
                              {(player.redCards && player.redCards > 0) && (
                                <span className="inline-flex items-center bg-red-500 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.redCards}🟥
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-auto">
                            <Button 
                              size="sm"
                              variant={isMVP ? "default" : "outline"}
                              className={isMVP ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    onClick={() => handleSetMVP(rating.playerId, true)}
                  >
                              MVP
                            </Button>
                          </div>
                    </div>
                        
                        <div className="mb-2">
                          <div className="flex justify-between items-center">
                            <div className="text-sm">Điểm đánh giá: {rating.score.toFixed(1)}</div>
                            <div className={`px-2 py-0.5 rounded text-xs text-white ${getRatingStatusClass(rating.score)}`}>
                              {getRatingStatus(rating.score)}
                    </div>
                  </div>
                          
                          <div>
                            <Slider 
                              value={[rating.score]} 
                              onValueChange={(value) => handleRating(rating.playerId, value[0], true)}
                              max={10}
                              step={0.1}
                              className="mt-2"
                            />
            </div>
          </div>

                        <Textarea 
                          className="w-full h-20 resize-none text-sm"
                          placeholder="Nhận xét về cầu thủ..."
                          value={rating.comment || ""}
                          onChange={(e) => handleUpdateComment(rating.playerId, e.target.value, true)}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Đội khách */}
                <div className="space-y-4">
                  <h3 className="font-medium text-left pb-2">Đội khách</h3>
                  {awayTeamRatings.map((rating) => {
                    const player = findPlayer(rating.playerId, false);
                    if (!player) return null;
                    
                    const isMVP = rating.playerId === awayMVP;
                
                return (
                      <div key={rating.playerId} className="mb-8 last:mb-0">
                        <div className="flex mb-2 items-center">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white ${isMVP ? 'bg-purple-500' : 'bg-red-500'} mr-3`}>
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
                            ) : player.number ? (
                              <span className="text-xs font-bold">{player.number}</span>
                            ) : (
                              <div className="text-xs">
                                {player.position.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-xs text-gray-500">{player.position}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {(player.yellowCards && player.yellowCards > 0) && (
                                <span className="inline-flex items-center bg-yellow-400 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.yellowCards}🟨
                                </span>
                              )}
                              {(player.redCards && player.redCards > 0) && (
                                <span className="inline-flex items-center bg-red-500 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.redCards}🟥
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-auto">
                            <Button 
                              size="sm"
                              variant={isMVP ? "default" : "outline"}
                              className={isMVP ? "bg-purple-500 hover:bg-purple-600" : ""}
                    onClick={() => handleSetMVP(rating.playerId, false)}
                  >
                              MVP
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <div className="flex justify-between items-center">
                            <div className="text-sm">Điểm đánh giá: {rating.score.toFixed(1)}</div>
                            <div className={`px-2 py-0.5 rounded text-xs text-white ${getRatingStatusClass(rating.score)}`}>
                              {getRatingStatus(rating.score)}
                            </div>
                          </div>
                          
                          <div>
                            <Slider 
                              value={[rating.score]}
                              onValueChange={(value) => handleRating(rating.playerId, value[0], false)}
                              max={10}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>
                        </div>
                        
                        <Textarea 
                          className="w-full h-20 resize-none text-sm"
                          placeholder="Nhận xét về cầu thủ..."
                          value={rating.comment || ""}
                          onChange={(e) => handleUpdateComment(rating.playerId, e.target.value, false)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="view" className="mt-0 px-6 py-4 h-[500px] overflow-hidden">
            <ScrollArea className="h-full">
              <div className="py-2">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{match.homeTeam} vs {match.awayTeam}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-lg">{match.homeScore || 0}</div>
                        <div className="text-xs text-gray-500">Đội nhà</div>
                        {match.homeScore !== undefined && match.awayScore !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded ${match.homeScore > match.awayScore ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                            {match.homeScore > match.awayScore ? 'WIN' : 'LOSS'}
                          </span>
                        )}
                      </div>
                      <span>-</span>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-lg">{match.awayScore || 0}</div>
                        <div className="text-xs text-gray-500">Đội khách</div>
                        {match.homeScore !== undefined && match.awayScore !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded ${match.awayScore > match.homeScore ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                            {match.awayScore > match.homeScore ? 'WIN' : 'LOSS'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(match.date)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* MVP Home */}
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                      <h3 className="font-medium">MVP Đội nhà</h3>
                    </div>
                    {homeMVP && (() => {
                      const player = findPlayer(homeMVP, true);
                      const rating = homeTeamRatings.find(r => r.playerId === homeMVP);
                      if (!player || !rating) return (
                        <div className="text-sm text-gray-500">Chưa có MVP</div>
                      );
                      
                      const goals = getPlayerGoals(player.id);
                      const assists = getPlayerAssists(player.id);
                      
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
                            ) : player.number || player.position?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{player.name}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm ml-1">{rating.score.toFixed(1)}</span>
                              </div>
                              {goals > 0 && (
                                <div className="flex items-center">
                                  <Goal className="h-4 w-4 text-green-600" />
                                  <span className="text-sm ml-1">{goals}</span>
                                </div>
                              )}
                              {assists > 0 && (
                                <div className="flex items-center">
                                  <Badge variant="outline" className="text-xs py-0">A: {assists}</Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {(player.yellowCards && player.yellowCards > 0) && (
                                <span className="inline-flex items-center bg-yellow-400 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.yellowCards}🟨
                                </span>
                              )}
                              {(player.redCards && player.redCards > 0) && (
                                <span className="inline-flex items-center bg-red-500 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.redCards}🟥
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })() || (
                      <div className="text-sm text-gray-500">Chưa có MVP</div>
                    )}
                  </div>
                  
                  {/* MVP Away */}
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Trophy className="h-6 w-6 mr-2 text-purple-500" />
                      <h3 className="font-medium">MVP Đội khách</h3>
                    </div>
                    {awayMVP && (() => {
                      const player = findPlayer(awayMVP, false);
                      const rating = awayTeamRatings.find(r => r.playerId === awayMVP);
                      if (!player || !rating) return (
                        <div className="text-sm text-gray-500">Chưa có MVP</div>
                      );
                      
                      const goals = getPlayerGoals(player.id);
                      const assists = getPlayerAssists(player.id);
                      
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
                            ) : player.number || player.position?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{player.name}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm ml-1">{rating.score.toFixed(1)}</span>
                              </div>
                              {goals > 0 && (
                                <div className="flex items-center">
                                  <Goal className="h-4 w-4 text-green-600" />
                                  <span className="text-sm ml-1">{goals}</span>
                                </div>
                              )}
                              {assists > 0 && (
                                <div className="flex items-center">
                                  <Badge variant="outline" className="text-xs py-0">A: {assists}</Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {(player.yellowCards && player.yellowCards > 0) && (
                                <span className="inline-flex items-center bg-yellow-400 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.yellowCards}🟨
                                </span>
                              )}
                              {(player.redCards && player.redCards > 0) && (
                                <span className="inline-flex items-center bg-red-500 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                  {player.redCards}🟥
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })() || (
                      <div className="text-sm text-gray-500">Chưa có MVP</div>
                    )}
                  </div>
                </div>

                {/* Player ratings table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thứ hạng
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cầu thủ
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số áo
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vị trí
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thẻ
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bàn thắng
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Điểm
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đánh giá
                        </th>
                    </tr>
                  </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...homeTeamRatings, ...awayTeamRatings]
                        .filter(rating => rating.score > 0)
                      .sort((a, b) => b.score - a.score)
                        .map((rating, idx) => {
                          const isHomeTeam = homeTeamRatings.some(r => r.playerId === rating.playerId);
                          const player = findPlayer(rating.playerId, isHomeTeam);
                          
                          if (!player) return null;
                          
                          const goals = getPlayerGoals(player.id);
                          const assists = getPlayerAssists(player.id);
                          const ownGoals = getPlayerOwnGoals(player.id);
                          const penaltyGoals = getPlayerPenaltyGoals(player.id);
                        
                        return (
                            <tr key={rating.playerId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                {idx + 1}
                                {((isHomeTeam && rating.playerId === homeMVP) || 
                                  (!isHomeTeam && rating.playerId === awayMVP)) && (
                                  <span className="ml-1 text-yellow-500">🏆</span>
                                )}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs ${isHomeTeam ? 'bg-blue-500' : 'bg-red-500'}`}>
                                    {player.image ? (
                                      <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
                                    ) : player.position?.charAt(0) || "?"}
                              </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                              {player.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {isHomeTeam ? homeTeam.name : awayTeam.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                                {player.number || "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                {player.position}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {player.yellowCards && player.yellowCards > 0 && (
                                    <span className="inline-flex items-center bg-yellow-400 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                      {player.yellowCards}🟨
                                    </span>
                                  )}
                                  {player.redCards && player.redCards > 0 && (
                                    <span className="inline-flex items-center bg-red-500 px-1.5 py-0.5 rounded text-xs font-medium text-white">
                                      {player.redCards}🟥
                                    </span>
                                  )}
                                  {((!player.yellowCards || player.yellowCards <= 0) && (!player.redCards || player.redCards <= 0)) && "-"}
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  {goals > 0 || assists > 0 || ownGoals > 0 ? (
                                    <>
                                      {goals > 0 && (
                                        <div className="flex items-center justify-center">
                                          <Goal className="h-4 w-4 text-green-600 mr-1" />
                                          <span className="text-sm">{goals}</span>
                                          {penaltyGoals > 0 && <span className="text-xs ml-1 text-gray-500">({penaltyGoals}p)</span>}
                                        </div>
                                      )}
                                      {assists > 0 && (
                                        <div className="text-xs mt-1">
                                          <Badge variant="outline" className="py-0">A: {assists}</Badge>
                                        </div>
                                      )}
                                      {ownGoals > 0 && (
                                        <div className="text-xs mt-1 text-red-500">
                                          OG: {ownGoals}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center">
                                <span className={`text-sm font-medium ${rating.score >= 7 ? 'text-blue-600' : rating.score >= 5 ? 'text-gray-800' : 'text-red-600'}`}>
                                  {rating.score.toFixed(1)}
                                </span>
                            </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getRatingStatusClass(rating.score)}`}>
                                  {getRatingStatus(rating.score)}
                                </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
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
            Lưu đánh giá
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 