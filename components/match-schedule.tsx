"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, Clock, MapPin, Trophy, Plus, Edit, Trash2, Send, Bot, X, Upload, Image, Sparkles, Volume2, VolumeX, Smile, Star, Goal, Flag, List, Settings, Globe, Mic, Timer, ArrowUpDown, Volume, Languages, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Match, Team, Player } from "@/lib/types"
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import PlayerRating from "@/components/player-rating"
import MatchEvents, { MatchEvents as MatchEventsType } from "@/components/match-events"
import { Slider } from "@/components/ui/slider"
import { Bookmark } from "lucide-react"

// Define Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// Extend Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// Define the PlayerRatingsData interface here to match the one from player-rating.tsx
interface PlayerRating {
  playerId: string
  score: number
  isMVP?: boolean
  comment?: string
}

interface PlayerRatingsData {
  matchId: string
  homeTeamRatings: PlayerRating[]
  awayTeamRatings: PlayerRating[]
  homeMVP?: string
  awayMVP?: string
}

interface MatchScheduleProps {
  matches: Match[]
  onAddMatch: (match: Match) => void
  onUpdateMatch: (match: Match) => void
  onDeleteMatch: (id: string) => void
  homeTeam: Team
  awayTeam: Team
  onUpdateHomeTeam?: (team: Team) => void
  onUpdateAwayTeam?: (team: Team) => void
}

// Types for AI Agent
type AgentAction =
  | { type: 'ADD_MATCH', match: Partial<Match> }
  | { type: 'FILTER_MATCHES', filter: string }
  | { type: 'FIND_MATCH', criteria: string }
  | { type: 'NONE' };

// Types for reactions
type Reaction = {
  emoji: string;
  count: number;
  users: string[];
  timestamp: number;
}

// Types for messages with reactions
type ChatMessage = {
  role: 'user' | 'ai' | 'agent';
  content: string;
  id: string;
  reactions?: Record<string, Reaction>;
}

// Types for translation
type TranslationLanguage = {
  code: string;
  name: string;
  flag: string;
}

type TranslationResult = {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

// Match events interfaces
interface MatchGoal {
  id: string
  playerId: string
  teamId: string
  minute: number
  assistPlayerId?: string
  isOwnGoal?: boolean
  isPenalty?: boolean
  note?: string
}

interface MatchCard {
  id: string
  playerId: string
  teamId: string
  minute: number
  type: 'yellow' | 'red'
  reason?: string
}

interface MatchEvents {
  goals: MatchGoal[]
  cards: MatchCard[]
}

// Define keyframes animation for notifications
const fadeInOutKeyframes = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
`;

export default function MatchSchedule({
  matches,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
  homeTeam,
  awayTeam,
  onUpdateHomeTeam,
  onUpdateAwayTeam
}: MatchScheduleProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [matchIdToDelete, setMatchIdToDelete] = useState<string | null>(null)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [ratingMatch, setRatingMatch] = useState<Match | null>(null)
  const [isEventsDialogOpen, setIsEventsDialogOpen] = useState(false)
  const [eventsMatch, setEventsMatch] = useState<Match | null>(null)

  // AI chat states
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiSidebar, setShowAiSidebar] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingAgentAction, setPendingAgentAction] = useState<AgentAction | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false)
  const [customApiKey, setCustomApiKey] = useState("")
  const [useCustomApiKey, setUseCustomApiKey] = useState(false)
  const [chatDialogQuestion, setChatDialogQuestion] = useState("")
  const [showingEmojiFor, setShowingEmojiFor] = useState<string | null>(null)

  // Translation states
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslationPanel, setShowTranslationPanel] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("auto")
  const [targetLanguage, setTargetLanguage] = useState("en-US")
  const [translatedText, setTranslatedText] = useState("")
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [currentInputType, setCurrentInputType] = useState<'ai' | 'chat'>('ai')

  // List of available emojis
  const availableEmojis = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "��", "🤔", "⭐"]

  // Gemini API key
  const GEMINI_API_KEY = "AIzaSyCb2qpQWEHsmNQSOoM3re6yweTfxdJ8VFs"

  // Mẫu trận đấu mới
  const newMatchTemplate: Match = {
    id: "",
    homeTeam: "",
    awayTeam: "",
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    venue: "",
    competition: "",
    completed: false,
  }

  // Speech synthesis state
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speechPitch, setSpeechPitch] = useState(1.0)
  const [speechVolume, setSpeechVolume] = useState(1.0)
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("vi-VN")
  const [useGoogleTTS, setUseGoogleTTS] = useState(true)
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true)
  const [lastDetectedLanguage, setLastDetectedLanguage] = useState<string | null>(null)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  // Voice input (speech recognition) states
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [recognitionLang, setRecognitionLang] = useState("vi-VN")
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [recognitionNotification, setRecognitionNotification] = useState<string | null>(null)
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null)

  // Kiểm tra hoạt động của microphone
  const checkMicrophone = async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');

      if (!hasMicrophone) {
        setRecognitionError("Không tìm thấy microphone. Vui lòng kết nối microphone.");
        return false;
      }

      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone check failed:", err);
      setRecognitionError("Không thể truy cập microphone. Vui lòng cấp quyền truy cập.");
      return false;
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if the browser supports SpeechRecognition
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        // Create a recognition instance
        const recognition = new SpeechRecognitionAPI()

        // Cấu hình để nhận dạng chính xác hơn
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = recognitionLang
        recognition.maxAlternatives = 3  // Tăng lên để có nhiều phương án

        // Tắt nhận dạng tự động để chờ người dùng nói
        // @ts-ignore - Thuộc tính không tiêu chuẩn nhưng hữu ích trong Chrome
        if (typeof recognition.continuous !== 'undefined') {
          // @ts-ignore
          recognition.interimResults = true;
        }

        // Tăng độ nhạy để phát hiện giọng nói tốt hơn
        try {
          // @ts-ignore - Config không tiêu chuẩn
          if (typeof recognition.audioThreshold !== 'undefined') {
            // @ts-ignore
            recognition.audioThreshold = 0.2; // Hạ ngưỡng phát hiện âm thanh
          }
        } catch (e) {
          console.log('Advanced audio config not available');
        }

        // Set up event handlers
        recognition.onstart = () => {
          console.log('Speech recognition started')
          setIsListening(true)
          setRecognitionError(null)
          // Clear any existing transcript when starting new session
          setInterimTranscript('')
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error)

          // Xử lý các lỗi cụ thể
          if (event.error === 'no-speech') {
            setRecognitionError("Không phát hiện giọng nói. Hãy nói to và rõ ràng hơn.")

            // Không tự động dừng khi gặp lỗi no-speech, thay vào đó thử lại
            if (isListening) {
              // Hiển thị thông báo hướng dẫn
              setInterimTranscript("Xin vui lòng nói to hơn... hệ thống đang lắng nghe");

              // Thử lại sau 1 giây
              setTimeout(() => {
                if (recognitionRef.current && isListening) {
                  try {
                    // Khởi động lại recognition engine
                    recognitionRef.current.stop();
                    setTimeout(async () => {
                      if (recognitionRef.current && isListening) {
                        try {
                          // Kiểm tra microphone trước khi khởi động lại
                          const micOk = await checkMicrophone();
                          if (micOk && isListening) {
                            recognitionRef.current.start();
                            // Làm mới trạng thái lỗi
                            setRecognitionError(null);
                          }
                        } catch (e) {
                          console.error('Mic check failed during restart', e);
                        }
                      }
                    }, 500);
                  } catch (e) {
                    console.error('Error restarting recognition', e);
                  }
                }
              }, 1500);
            }
            // Không đặt isListening = false ở đây để tránh kết thúc quá trình ghi âm
            return;
          } else if (event.error === 'audio-capture') {
            setRecognitionError("Không tìm thấy microphone. Vui lòng kiểm tra thiết bị và cấp quyền.");

            // Thử kiểm tra microphone
            checkMicrophone().then(available => {
              if (available) {
                // Mic ok nhưng vẫn có lỗi, có thể là vấn đề khác
                setRecognitionError("Microphone hoạt động nhưng có lỗi khi thu âm. Vui lòng thử lại.");
              }
            });
          } else if (event.error === 'not-allowed') {
            setRecognitionError("Trình duyệt không được cấp quyền truy cập microphone. Xin cấp quyền và thử lại.");
          } else if (event.error === 'network') {
            setRecognitionError("Lỗi kết nối mạng khi nhận dạng giọng nói. Kiểm tra kết nối internet.");
          } else if (event.error === 'aborted') {
            // Người dùng hoặc hệ thống hủy bỏ, không cần thông báo lỗi
            console.log('Recognition aborted');
          } else {
            setRecognitionError(`Lỗi nhận dạng giọng nói: ${event.error}. Vui lòng thử lại.`);
          }

          // Dừng quá trình ghi âm nếu lỗi nghiêm trọng (không phải no-speech)
          setIsListening(false)
        }

        recognition.onend = () => {
          console.log('Speech recognition ended')
          setIsListening(false)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Làm mới lỗi khi nhận được kết quả
          setRecognitionError(null)

          let interimText = ''
          let finalText = ''

          // Reset silence detector - user is speaking
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            setSilenceTimeout(null);
          }

          // Khôi phục khi có người nói
          if (interimTranscript.includes("Xin vui lòng nói to hơn")) {
            setInterimTranscript("");
          }

          // Process each result - lấy kết quả có độ tin cậy cao nhất
          for (let i = event.resultIndex; i < event.results.length; i++) {
            // Tìm kết quả có độ tin cậy cao nhất từ các lựa chọn
            let bestTranscript = "";
            let bestConfidence = 0;

            for (let j = 0; j < event.results[i].length; j++) {
              const currentTranscript = event.results[i][j].transcript;
              const currentConfidence = event.results[i][j].confidence;

              // Chọn kết quả có độ tin cậy cao nhất
              if (currentConfidence > bestConfidence) {
                bestTranscript = currentTranscript;
                bestConfidence = currentConfidence;
              }
            }

            // Lọc kết quả có độ tin cậy thấp
            if (bestConfidence < 0.1) {
              console.log(`Skipping very low confidence (${bestConfidence}) result: ${bestTranscript}`);
              continue;
            }

            // Lọc nhiễu
            const cleaned = filterNoise(bestTranscript);

            if (event.results[i].isFinal) {
              // Xử lý kết quả cuối cùng - đây là khi người dùng đã nói xong một câu
              finalText += cleaned + ' ';

              // Cập nhật transcript ngay lập tức trong input
              // Điều này đảm bảo văn bản luôn được đưa vào input để kiểm tra
              if (showAiSidebar) {
                setAiQuestion(prev => {
                  const newText = prev + cleaned + ' ';
                  console.log("Updating aiQuestion with:", cleaned);
                  return newText;
                });
              } else if (isChatDialogOpen) {
                setChatDialogQuestion(prev => {
                  const newText = prev + cleaned + ' ';
                  console.log("Updating chatDialogQuestion with:", cleaned);
                  return newText;
                });
              }

              // Giữ bản ghi cho phiên làm việc
              setTranscript(prev => prev + cleaned + ' ');

              // Đặt timeout để phát hiện người dùng ngừng nói
              const timeout = setTimeout(() => {
                if (recognitionRef.current && isListening) {
                  console.log("Silence detected, stopping recognition");
                  // Tạm dừng nhận dạng khi phát hiện im lặng
                  recognitionRef.current.stop();
                }
              }, 2000); // Giảm thời gian chờ xuống 2s để phản ứng nhanh hơn
              setSilenceTimeout(timeout);
            } else {
              // Kết quả tạm thời - người dùng đang nói
              interimText += cleaned;
            }
          }

          // Cập nhật transcript tạm thời để hiển thị
          setInterimTranscript(interimText);
        }

        // Save reference
        recognitionRef.current = recognition
      } else {
        console.warn('Speech recognition not supported in this browser')
        setRecognitionError("Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.")
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        if (isListening) {
          recognitionRef.current.stop()
        }
      }

      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
    }
  }, [recognitionLang]) // Reinitialize when language changes

  // Simple noise filtering function
  const filterNoise = (text: string): string => {
    // Trim whitespace
    let result = text.trim()

    // Remove common noise/filler patterns
    const noisePatterns = [
      /^(uh|um|er|hmm|like) /i,
      / (uh|um|er|hmm|like) /i,
      /(\s)\s+/g, // Remove extra spaces
      /^(hey|ok|okay) (siri|google|alexa|cortana)/i, // Remove assistant triggers
    ]

    noisePatterns.forEach(pattern => {
      result = result.replace(pattern, '$1')
    })

    return result
  }

  // Đặt ngôn ngữ nhận dạng giọng nói
  const setRecognitionLanguage = (lang: string) => {
    console.log(`Changing recognition language to: ${lang}`);
    setRecognitionLang(lang);

    // Nếu đang ghi âm, cần khởi động lại để áp dụng ngôn ngữ mới
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        // Sau khi dừng, onend sẽ được gọi và isListening sẽ thành false
        // Chờ một chút để đảm bảo quá trình dừng hoàn tất
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.lang = lang;
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 300);
      } catch (e) {
        console.error("Error restarting recognition with new language", e);
      }
    } else if (recognitionRef.current) {
      // Nếu không đang ghi âm, chỉ cần cập nhật thuộc tính
      recognitionRef.current.lang = lang;
    }
  };

  // Function to toggle speech recognition
  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setRecognitionError("Nhận dạng giọng nói không được hỗ trợ hoặc chưa sẵn sàng")
      return
    }

    if (isListening) {
      // Dừng nhận dạng
      console.log("Stopping speech recognition");
      recognitionRef.current.stop()
      if (silenceTimeout) {
        clearTimeout(silenceTimeout)
        setSilenceTimeout(null)
      }
    } else {
      // Kiểm tra microphone trước khi bắt đầu
      const micOk = await checkMicrophone();
      if (!micOk) {
        return; // checkMicrophone đã đặt thông báo lỗi
      }

      // Xóa lỗi cũ
      setRecognitionError(null)
      // Xóa transcript tạm thời
      setInterimTranscript('')

      // Không reset transcript hoặc nội dung input
      // Cho phép người dùng tích lũy văn bản qua nhiều phiên ghi âm
      // Điều này cho phép tạm dừng và tiếp tục

      try {
        // Cập nhật ngôn ngữ mới nhất
        recognitionRef.current.lang = recognitionLang;
        console.log(`Starting speech recognition with language: ${recognitionLang}`);

        // Hiển thị thông báo hướng dẫn
        setRecognitionNotification(`Đang lắng nghe bằng ${
          supportedLanguages.find(lang => lang.code === recognitionLang)?.name || recognitionLang
        }`);
        setTimeout(() => setRecognitionNotification(null), 3000);

        // Bắt đầu nhận dạng
        recognitionRef.current.start()
      } catch (e) {
        console.error("Error starting speech recognition", e)
        setRecognitionError("Lỗi khi bắt đầu nhận dạng giọng nói. Vui lòng thử lại.")
      }
    }
  }

  // Update recognition language when selected language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = recognitionLang
    }
  }, [recognitionLang])

  // When detected language changes, update recognition language to match
  useEffect(() => {
    if (lastDetectedLanguage && lastDetectedLanguage !== 'auto') {
      setRecognitionLang(lastDetectedLanguage)
    }
  }, [lastDetectedLanguage])

  // Translation languages - simplified list for translation
  const translationLanguages = [
    { code: "auto", name: "Tự động phát hiện", flag: "🔍" },
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇧🇷" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "th", name: "ไทย", flag: "🇹🇭" },
    { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "pl", name: "Polski", flag: "🇵🇱" },
    { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  ];

  // Supported languages - expanded list with optimal voice settings
  const supportedLanguages = [
    {
      code: "vi-VN",
      name: "Tiếng Việt",
      flag: "🇻🇳",
      recommended: ["Microsoft HoaiMy Online", "Microsoft NamMinh Online"],
      optimalSettings: { rate: 0.95, pitch: 1.05, volume: 1.0 }
    },
    {
      code: "en-US",
      name: "English (US)",
      flag: "🇺🇸",
      recommended: ["Microsoft Guy Online", "Microsoft Jenny Online", "Microsoft Aria Online"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "en-GB",
      name: "English (UK)",
      flag: "🇬🇧",
      recommended: ["Microsoft Mark", "Microsoft Sonia"],
      optimalSettings: { rate: 0.85, pitch: 0.95, volume: 1.0 }
    },
    {
      code: "fr-FR",
      name: "Français",
      flag: "🇫🇷",
      recommended: ["Microsoft Julie", "Google français"],
      optimalSettings: { rate: 0.85, pitch: 1.05, volume: 1.0 }
    },
    {
      code: "de-DE",
      name: "Deutsch",
      flag: "🇩🇪",
      recommended: ["Microsoft Hedda", "Microsoft Stefan"],
      optimalSettings: { rate: 0.85, pitch: 0.95, volume: 1.0 }
    },
    {
      code: "es-ES",
      name: "Español",
      flag: "🇪🇸",
      recommended: ["Microsoft Lucia", "Microsoft Pablo"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "it-IT",
      name: "Italiano",
      flag: "🇮🇹",
      recommended: ["Microsoft Elsa", "Microsoft Diego"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "pt-BR",
      name: "Português",
      flag: "🇧🇷",
      recommended: ["Microsoft Maria", "Microsoft Daniel"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "ru-RU",
      name: "Русский",
      flag: "🇷🇺",
      recommended: ["Microsoft Irina", "Microsoft Pavel"],
      optimalSettings: { rate: 0.9, pitch: 0.95, volume: 1.0 }
    },
    {
      code: "ja-JP",
      name: "日本語",
      flag: "🇯🇵",
      recommended: ["Microsoft Nanami", "Microsoft Keita"],
      optimalSettings: { rate: 0.8, pitch: 1.1, volume: 1.0 }
    },
    {
      code: "ko-KR",
      name: "한국어",
      flag: "🇰🇷",
      recommended: ["Microsoft SunHi", "Microsoft InJoon"],
      optimalSettings: { rate: 0.8, pitch: 1.1, volume: 1.0 }
    },
    {
      code: "zh-CN",
      name: "中文 (简体)",
      flag: "🇨🇳",
      recommended: ["Microsoft Yaoyao", "Microsoft Kangkang"],
      optimalSettings: { rate: 0.85, pitch: 1.1, volume: 1.0 }
    },
    {
      code: "zh-TW",
      name: "中文 (繁體)",
      flag: "🇹🇼",
      recommended: ["Microsoft Zhiwei", "Microsoft Yating"],
      optimalSettings: { rate: 0.85, pitch: 1.1, volume: 1.0 }
    },
    {
      code: "th-TH",
      name: "ไทย",
      flag: "🇹🇭",
      recommended: ["Microsoft Pattara"],
      optimalSettings: { rate: 0.85, pitch: 1.05, volume: 1.0 }
    },
    {
      code: "hi-IN",
      name: "हिन्दी",
      flag: "🇮🇳",
      recommended: ["Microsoft Swara", "Microsoft Ravi"],
      optimalSettings: { rate: 0.85, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "ar-SA",
      name: "العربية",
      flag: "🇸🇦",
      recommended: ["Microsoft Naayf", "Microsoft Hamed"],
      optimalSettings: { rate: 0.8, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "he-IL",
      name: "עברית",
      flag: "🇮🇱",
      recommended: ["Microsoft Asaf"],
      optimalSettings: { rate: 0.8, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "pl-PL",
      name: "Polski",
      flag: "🇵🇱",
      recommended: ["Microsoft Paulina"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "nl-NL",
      name: "Nederlands",
      flag: "🇳🇱",
      recommended: ["Microsoft Frank"],
      optimalSettings: { rate: 0.9, pitch: 0.95, volume: 1.0 }
    },
    {
      code: "tr-TR",
      name: "Türkçe",
      flag: "🇹🇷",
      recommended: ["Microsoft Tolga"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "sv-SE",
      name: "Svenska",
      flag: "🇸🇪",
      recommended: ["Microsoft Hedvig"],
      optimalSettings: { rate: 0.85, pitch: 0.95, volume: 1.0 }
    },
    {
      code: "el-GR",
      name: "Ελληνικά",
      flag: "🇬🇷",
      recommended: ["Microsoft Stefanos"],
      optimalSettings: { rate: 0.85, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "fa-IR",
      name: "فارسی",
      flag: "🇮🇷",
      recommended: [],
      optimalSettings: { rate: 0.8, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "ur-PK",
      name: "اردو",
      flag: "🇵🇰",
      recommended: [],
      optimalSettings: { rate: 0.8, pitch: 0.95, volume: 1.0 }
    },
    {
      code: "id-ID",
      name: "Bahasa Indonesia",
      flag: "🇮🇩",
      recommended: ["Microsoft Gadis", "Microsoft Andika"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "ms-MY",
      name: "Bahasa Melayu",
      flag: "🇲🇾",
      recommended: ["Microsoft Rizwan"],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "bn-BD",
      name: "বাংলা",
      flag: "🇧🇩",
      recommended: [],
      optimalSettings: { rate: 0.85, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "ta-IN",
      name: "தமிழ்",
      flag: "🇮🇳",
      recommended: [],
      optimalSettings: { rate: 0.85, pitch: 1.05, volume: 1.0 }
    },
    {
      code: "tl-PH",
      name: "Filipino",
      flag: "🇵🇭",
      recommended: [],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
    {
      code: "auto",
      name: "Auto Detect",
      flag: "🔍",
      recommended: [],
      optimalSettings: { rate: 0.9, pitch: 1.0, volume: 1.0 }
    },
  ]

  // Function to auto detect language using advanced scoring system
  const detectLanguage = (text: string): string => {
    if (!text || text.trim().length < 3) {
      return "auto"; // Not enough text to detect language
    }

    // Normalize text - lowercase and trim
    const textToAnalyze = text.toLowerCase().trim();

    // Debug log
    console.log("🔍 Detecting language for text:", textToAnalyze.substring(0, 100));

    // Check for different language scripts and character sets first - Most reliable

    // Hebrew - Hebrew characters
    if (/[\u0590-\u05FF\uFB1D-\uFB4F]/.test(textToAnalyze)) {
      console.log("✅ Detected Hebrew by script");
      return "he-IL";
    }

    // Russian and other Cyrillic script languages
    if (/[\u0400-\u04FF]/.test(textToAnalyze)) {
      console.log("✅ Detected Russian/Cyrillic by script");
      return "ru-RU";
    }

    // Thai script
    if (/[\u0E00-\u0E7F]/.test(textToAnalyze)) {
      console.log("✅ Detected Thai by script");
      return "th-TH";
    }

    // Arabic script languages
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(textToAnalyze)) {
      // Distinguish between Arabic, Farsi/Persian, and Urdu based on specific characters
      if (/[\u067E\u0686\u0698\u06AF\u06CC\u06F0-\u06F9]/.test(textToAnalyze) || /\b(است|فارسی|ایران)\b/.test(textToAnalyze)) {
        console.log("✅ Detected Persian/Farsi by script");
        return "fa-IR"; // Persian/Farsi
      }
      if (/[\u0679\u0688\u0691\u06BA\u06BE\u06C1-\u06C3\u06D2]/.test(textToAnalyze) || /\b(اور|ہے|کے|میں|پاکستان)\b/.test(textToAnalyze)) {
        console.log("✅ Detected Urdu by script");
        return "ur-PK"; // Urdu
      }
      console.log("✅ Detected Arabic by script");
      return "ar-SA"; // Default to Arabic
    }

    // East Asian languages - Check for Japanese, Chinese, Korean
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]/.test(textToAnalyze)) {
      // Japanese specific kana characters (hiragana & katakana)
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(textToAnalyze)) {
        console.log("✅ Detected Japanese by script");
        return "ja-JP";
      }

      // Korean Hangul
      if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(textToAnalyze)) {
        console.log("✅ Detected Korean by script");
        return "ko-KR";
      }

      // Chinese - try to distinguish between Traditional and Simplified
      if (/[\u4e00-\u9fff\uf900-\ufaff]/.test(textToAnalyze)) {
        // Characters that differ between Simplified and Traditional
        if (/[国见话说对们还记没这事样经麽]/.test(textToAnalyze)) {
          console.log("✅ Detected Simplified Chinese by script");
          return "zh-CN"; // Simplified
        }
        if (/[國見話說對們還記沒這事樣經麽]/.test(textToAnalyze)) {
          console.log("✅ Detected Traditional Chinese by script");
          return "zh-TW"; // Traditional
        }
        // Default to Simplified Chinese if can't distinguish
        console.log("✅ Detected Chinese (default Simplified) by script");
        return "zh-CN";
      }
    }

    // Hindi and other Devanagari script languages
    if (/[\u0900-\u097F]/.test(textToAnalyze)) {
      console.log("✅ Detected Hindi by script");
      return "hi-IN";
    }

    // Bengali
    if (/[\u0980-\u09FF]/.test(textToAnalyze)) {
      console.log("✅ Detected Bengali by script");
      return "bn-BD";
    }

    // Tamil
    if (/[\u0B80-\u0BFF]/.test(textToAnalyze)) {
      console.log("✅ Detected Tamil by script");
      return "ta-IN";
    }

    // Greek
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(textToAnalyze)) {
      console.log("✅ Detected Greek by script");
      return "el-GR";
    }

    // For Latin script languages, use advanced scoring system
    const scores: Record<string, number> = {
      'fr-FR': 0,
      'es-ES': 0,
      'it-IT': 0,
      'pt-BR': 0,
      'de-DE': 0,
      'en-US': 0,
      'vi-VN': 0,
      'id-ID': 0,
      'ms-MY': 0,
      'pl-PL': 0,
      'nl-NL': 0,
      'sv-SE': 0,
      'tr-TR': 0,
      'tl-PH': 0  // Filipino/Tagalog
    };

    // Filipino/Tagalog scoring - add before other languages to avoid confusion with Vietnamese
    if (/\b(ang|ng|sa|na|ay|mga|ako|ka|siya|kami|kayo|sila|ito|iyan|iyon|filipino|pilipinas|tagalog)\b/.test(textToAnalyze)) scores['tl-PH'] += 5;
    if (/\b(kumusta|salamat|oo|hindi|paano|saan|kailan|sino|ano|bakit)\b/.test(textToAnalyze)) scores['tl-PH'] += 4;
    if (/\b(maganda|mabuti|masaya|malaki|maliit|marami|konti|lahat|wala)\b/.test(textToAnalyze)) scores['tl-PH'] += 3;

    // French scoring - very specific patterns with penalty system
    let frenchScore = 0;
    if (/[àâçéèêëîïôùûüÿœæ]/.test(textToAnalyze)) frenchScore += 3;
    if (/\b(le|la|les|un|une|des|du|de|et|est|sont|avec|pour|dans|sur|pas|cette|avoir|être)\b/.test(textToAnalyze)) frenchScore += 2;
    if (/\b(bonjour|bonsoir|merci|oui|non|comment|pourquoi|quand|où|qui|que|français|france)\b/.test(textToAnalyze)) frenchScore += 5;
    if (/\b(c'est|n'est|qu'il|qu'elle|d'un|d'une|l'on|j'ai|tu|nous|vous|ils|elles)\b/.test(textToAnalyze)) frenchScore += 4;
    if (/\b(très|bien|alors|donc|voilà|ça|maintenant|toujours|jamais)\b/.test(textToAnalyze)) frenchScore += 3;
    // Strong penalty if Italian patterns are found
    if (/\b(sono|è|gli|della|delle|degli|zione|zioni|ciao|grazie|buon)\b/.test(textToAnalyze)) frenchScore -= 3;
    scores['fr-FR'] = Math.max(0, frenchScore);

    // Spanish scoring - unique patterns
    if (/[ñáéíóúü¿¡]/.test(textToAnalyze)) scores['es-ES'] += 4;
    if (/\b(el|la|los|las|es|son|está|están|de|que|en|un|una|por|para|con|como|pero)\b/.test(textToAnalyze)) scores['es-ES'] += 2;
    if (/\b(hola|gracias|buenos|días|noches|señor|señora|muchas|favor|español|españa)\b/.test(textToAnalyze)) scores['es-ES'] += 4;
    if (/¿.*?\?|¡.*?!/.test(textToAnalyze)) scores['es-ES'] += 5; // Spanish punctuation

    // Italian scoring - more distinctive patterns with penalty system
    let italianScore = 0;
    if (/[àèéìíîòóùú]/.test(textToAnalyze)) italianScore += 3;
    if (/\b(di|che|non|per|in|con|sono|sei|è|siamo|mi|ti|ci|della|delle|degli|anche|molto)\b/.test(textToAnalyze)) italianScore += 3;
    if (/\b(ciao|grazie|buongiorno|buonasera|prego|scusi|come|stai|dove|quando|perché|italiano|italia)\b/.test(textToAnalyze)) italianScore += 6;
    if (/\b(gli|glie|zione|zioni|mente)\b/.test(textToAnalyze)) italianScore += 5;
    if (/\b(bene|bello|bella|tutto|tutti|sempre|mai|già|ancora|proprio)\b/.test(textToAnalyze)) italianScore += 4;
    if (/\b(sono|è)\b/.test(textToAnalyze)) italianScore += 4; // Very Italian-specific
    // Strong penalty if French patterns are found
    if (/\b(c'est|n'est|qu'il|qu'elle|d'un|d'une|très|alors|donc|voilà|ça|bonjour|merci)\b/.test(textToAnalyze)) italianScore -= 3;
    // Strong penalty if English patterns are found
    if (/\b(the|and|is|that|you|with|this|will|can|would|could|should|I'm|you're|he's|she's|it's|don't|won't|can't)\b/.test(textToAnalyze)) italianScore -= 3;
    if (/\b(english|hello|thank|please|welcome|good|morning|evening|night|yes|no|what|when|where|why|how)\b/.test(textToAnalyze)) italianScore -= 4;
    scores['it-IT'] = Math.max(0, italianScore);

    // Portuguese scoring - unique features
    if (/[ãõçáéíóúâêôà]/.test(textToAnalyze)) scores['pt-BR'] += 3;
    if (/\b(de|que|e|o|da|em|um|uma|para|com|não|por|os|as|são|você|este|esta)\b/.test(textToAnalyze)) scores['pt-BR'] += 2;
    if (/\b(olá|obrigad[oa]|tudo|muito|português|brasil|portugal|como|está|onde|quando|porque)\b/.test(textToAnalyze)) scores['pt-BR'] += 4;
    if (/\b(ção|ções|ão|ões|mente)\b/.test(textToAnalyze)) scores['pt-BR'] += 3;

    // German scoring - distinctive features
    if (/[äöüß]/.test(textToAnalyze)) scores['de-DE'] += 5;
    if (/\b(und|ist|das|ich|nicht|der|die|zu|den|mit|von|auf|für|werden|haben|sein)\b/.test(textToAnalyze)) scores['de-DE'] += 2;
    if (/\b(aber|oder|wenn|dann|auch|nur|noch|schon|sehr|gut|deutsch|deutschland)\b/.test(textToAnalyze)) scores['de-DE'] += 3;
    if (/\b(eine[nr]?|einem|eines)\b/.test(textToAnalyze)) scores['de-DE'] += 2;

    // English scoring - more distinctive patterns with penalty system
    let englishScore = 0;
    if (/\b(the|and|is|in|to|have|that|for|you|with|on|at|as|are|this|will|can|would|could|should)\b/.test(textToAnalyze)) englishScore += 2; // Increased from 1
    if (/\b(english|hello|thank|please|welcome|good|morning|evening|night|yes|no|what|when|where|why|how)\b/.test(textToAnalyze)) englishScore += 4; // Increased from 3
    if (/\b(about|because|before|after|through|during|without|between|against|under|over|above|below)\b/.test(textToAnalyze)) englishScore += 3; // English prepositions
    if (/\b(something|anything|everything|nothing|someone|anyone|everyone|nobody)\b/.test(textToAnalyze)) englishScore += 4; // English compound words
    if (/\b(I'm|you're|he's|she's|it's|we're|they're|don't|won't|can't|shouldn't|wouldn't)\b/.test(textToAnalyze)) englishScore += 5; // English contractions
    // Penalty if Italian patterns are found
    if (/\b(sono|è|gli|della|delle|degli|zione|zioni|ciao|grazie|buon|molto|anche|dove|quando|perché)\b/.test(textToAnalyze)) englishScore -= 3;
    // Penalty if other Romance language patterns are found
    if (/\b(c'est|très|alors|donc|bonjour|merci|hola|gracias|español|olá|obrigado|português)\b/.test(textToAnalyze)) englishScore -= 2;
    scores['en-US'] = Math.max(0, englishScore);

    // Vietnamese scoring - specific diacritics and words
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(textToAnalyze)) scores['vi-VN'] += 4;
    if (/\b(là|của|và|có|được|này|đó|cho|với|từ|trong|về|một|các|những|người|việt|nam|tiếng)\b/.test(textToAnalyze)) scores['vi-VN'] += 3;

    // Indonesian vs Malay - improved distinction
    if (/\b(dan|yang|di|itu|dengan|untuk|tidak|ini|dari|dalam|akan)\b/.test(textToAnalyze)) {
      // Indonesian specific
      if (/\b(adalah|sudah|belum|sedang|bisa|juga|hanya|sangat|sekali|indonesia|bahasa indonesia)\b/.test(textToAnalyze)) scores['id-ID'] += 4;
      if (/\b(ter[a-z]+|ber[a-z]+|me[a-z]+|pe[a-z]+an)\b/.test(textToAnalyze)) scores['id-ID'] += 2;

      // Malay specific
      if (/\b(boleh|hendak|mahu|nak|pula|amat|malaysia|bahasa malaysia|bahasa melayu)\b/.test(textToAnalyze)) scores['ms-MY'] += 4;
      if (/\b(anda|awak)\b/.test(textToAnalyze)) scores['ms-MY'] += 2;

      // Common words get lower scores
      if (/\b(saya|kamu|mereka|kami)\b/.test(textToAnalyze)) {
        scores['id-ID'] += 1;
        scores['ms-MY'] += 1;
      }
    }

    // Polish scoring
    if (/[ąćęłńóśźż]/.test(textToAnalyze)) scores['pl-PL'] += 4;
    if (/\b(jest|nie|to|się|na|i|w|z|do|są|co|jak|polski|polska)\b/.test(textToAnalyze)) scores['pl-PL'] += 3;

    // Dutch scoring
    if (/\b(het|een|dat|niet|en|de|van|in|op|te|zijn|nederlands|nederland)\b/.test(textToAnalyze)) scores['nl-NL'] += 2;
    if (/\b(geen|deze|die|veel|voor|maar|wel|ook|nog|naar)\b/.test(textToAnalyze)) scores['nl-NL'] += 3;
    if (/[ij]/.test(textToAnalyze) && /\b(ij|zijn|mijn|zijn)\b/.test(textToAnalyze)) scores['nl-NL'] += 2;

    // Swedish scoring
    if (/[åäö]/.test(textToAnalyze)) scores['sv-SE'] += 4;
    if (/\b(och|att|det|som|en|är|på|för|med|jag|har|inte|svenska|sverige)\b/.test(textToAnalyze)) scores['sv-SE'] += 3;

    // Turkish scoring
    if (/[çğıöşü]/.test(textToAnalyze)) scores['tr-TR'] += 4;
    if (/\b(bir|bu|ve|için|ile|ben|sen|o|biz|siz|onlar|türkçe|türkiye)\b/.test(textToAnalyze)) scores['tr-TR'] += 3;

    // Find the language with highest score
    const maxScore = Math.max(...Object.values(scores));
    const detectedLangs = Object.entries(scores).filter(([_, score]) => score === maxScore && score > 0);

    console.log("📊 Language scores:", scores);
    console.log("🏆 Max score:", maxScore, "Languages:", detectedLangs.map(([lang]) => lang));

    if (detectedLangs.length === 1 && maxScore >= 2) {
      const detectedLang = detectedLangs[0][0];
      console.log(`✅ Detected ${detectedLang} with confidence score: ${maxScore}`);
      return detectedLang;
    } else if (detectedLangs.length > 1) {
      console.log(`⚠️ Multiple languages detected with same score (${maxScore}):`, detectedLangs.map(([lang]) => lang));
      // Return the first one, but this indicates ambiguous text
      return detectedLangs[0][0];
    } else {
      console.log("❌ No language detected with sufficient confidence, returning auto");
      return "auto";
    }
  };



  // Load available voices when component mounts or when browser updates them
  useEffect(() => {
    if (!synth) return

    // Function to load and set available voices
    const loadVoices = () => {
      const voices = synth.getVoices()
      setAvailableVoices(voices)

      // Debug: Log all available voices grouped by language
      console.log("=== AVAILABLE VOICES BY LANGUAGE ===");
      const voicesByLang = voices.reduce((acc, voice) => {
        const lang = voice.lang;
        if (!acc[lang]) acc[lang] = [];
        acc[lang].push(voice.name);
        return acc;
      }, {} as Record<string, string[]>);

      Object.keys(voicesByLang).sort().forEach(lang => {
        console.log(`${lang}: ${voicesByLang[lang].join(', ')}`);
      });
      console.log("=====================================");

      // Set default voice if not already set
      if (!selectedVoice && voices.length > 0) {
        // Try to find a Vietnamese voice by default, or fall back to the first voice
        const viVoice = voices.find(voice => voice.lang.includes('vi-VN'))
        setSelectedVoice(viVoice?.name || voices[0].name)
      }
    }

    // Load voices immediately in case they're already available
    loadVoices()

    // Chrome loads voices asynchronously, so we need this event listener
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [synth, selectedVoice])

  // Function to find best matching voice for a language
  const getBestVoiceForLanguage = (langCode: string): string | undefined => {
    if (!availableVoices.length) return undefined;

    const language = supportedLanguages.find(lang => lang.code === langCode);
    if (!language) return undefined;

    // First try to find one of the recommended voices
    if (language.recommended?.length) {
      for (const recommendedVoice of language.recommended) {
        // Ưu tiên các giọng nói "neural" hoặc "online" chất lượng cao
        const voice = availableVoices.find(v => v.name === recommendedVoice);
        if (voice) return voice.name;
      }
    }

    // Look for voices matching the language code
    const matchingVoices = availableVoices.filter(v => v.lang.includes(langCode.split('-')[0]));

    // Prefer high-quality natural voices (sorted by priority)
    // 1. Neural/natural voices specifically named
    // 2. Online voices (typically higher quality)
    // 3. Non-local voices (typically Wavenet or cloud-based)
    // 4. Any voice for the language

    // 1. Check for Neural/natural voices first
    const neuralVoice = matchingVoices.find(v =>
      v.name.toLowerCase().includes('neural') ||
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('wavenet')
    );
    if (neuralVoice) return neuralVoice.name;

    // 2. Check for online voices
    const onlineVoice = matchingVoices.find(v =>
      v.name.toLowerCase().includes('online')
    );
    if (onlineVoice) return onlineVoice.name;

    // 3. Prefer non-local voices
    const cloudVoice = matchingVoices.find(v => !v.localService);
    if (cloudVoice) return cloudVoice.name;

    // 4. Fall back to any voice for that language
    return matchingVoices.length > 0 ? matchingVoices[0].name : undefined;
  };

  // Function to speak text
  const speakText = (text: string) => {
    if (!synth || !isSpeechEnabled || !text.trim()) return

    // Clean text from HTML tags and markdown
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/gm, '$1')

    // Determine language to use - always auto-detect for AI responses to ensure proper pronunciation
    const detectedLang = detectLanguage(cleanText);

    // If detection returns "auto", fallback to English for TTS
    const langToUse = detectedLang === "auto" ? "en-US" : detectedLang;

    // Save detected language to state for UI feedback (keep original detection result)
    setLastDetectedLanguage(detectedLang);

    // Get language info and name
    const langInfo = supportedLanguages.find(lang => lang.code === langToUse);
    const langName = langInfo?.name || langToUse;
    const langFlag = langInfo?.flag || '🔍';

    console.log(`Speaking text in ${langName} (${langToUse}):`, cleanText.substring(0, 50));
    console.log(`Original detection result: ${detectedLang}`);

    // If using Google TTS and we're not in development mode, use that
    if (useGoogleTTS && process.env.NODE_ENV !== 'development' && false) {
      // This would require a server endpoint to call Google TTS API
      // Here we're just using the browser's TTS as a fallback
      console.log("Google TTS would be used in production")
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(cleanText)

    // Apply language code
    utterance.lang = langToUse;

    // Apply user settings - always use user's preferred settings
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;

    // Find best voice for this language
    const bestVoice = getBestVoiceForLanguage(langToUse);
    let selectedVoiceToUse = null;
    let voiceQuality = "Standard";

    if (bestVoice) {
      selectedVoiceToUse = availableVoices.find(v => v.name === bestVoice);
      if (selectedVoiceToUse) {
        voiceQuality = selectedVoiceToUse.localService ? "Standard" : "Premium";
        console.log(`Using voice: ${selectedVoiceToUse.name} (${voiceQuality}) for ${langName}`);
      }
    }

    // If no specific recommended voice is found, try finding any voice for that language
    if (!selectedVoiceToUse) {
      // Try finding any voice that supports this language code (even partially)
      const langCode = langToUse.split('-')[0]; // Get the main language part (e.g. 'ar' from 'ar-SA')
      const fallbackVoices = availableVoices.filter(voice => voice.lang.includes(langCode));

      if (fallbackVoices.length > 0) {
        // Prioritize: 1. Neural/natural voices, 2. Online voices, 3. Non-local voices, 4. Any match
        selectedVoiceToUse = fallbackVoices.find(v =>
          v.name.toLowerCase().includes('neural') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('wavenet')
        ) || fallbackVoices.find(v =>
          v.name.toLowerCase().includes('online')
        ) || fallbackVoices.find(v => !v.localService) || fallbackVoices[0];

        if (selectedVoiceToUse) {
          voiceQuality = selectedVoiceToUse.localService ? "Standard" : "Premium";
          console.log(`Using fallback voice: ${selectedVoiceToUse.name} (${voiceQuality})`);
        }
      }
    }

    // Ultimate fallback - if no voice found for the language at all, use English as fallback
    if (!selectedVoiceToUse) {
      const englishVoice = getBestVoiceForLanguage("en-US");
      if (englishVoice) {
        selectedVoiceToUse = availableVoices.find(v => v.name === englishVoice);
        console.log(`No voice found for ${langName} - using English voice as fallback`);
      }
    }

    // Set the selected voice
    if (selectedVoiceToUse) {
      utterance.voice = selectedVoiceToUse;
    }

    // Note: User settings are now always respected without language-specific overrides

    // Stop any current speech
    synth.cancel()

    // Speak
    synth.speak(utterance)

    // Always show notification about detected language and voice
    const voiceUsed = utterance.voice?.name || "Default voice";
    const notification = `${langFlag} <b>${langName}</b> - ${voiceUsed} <span class="text-xs text-blue-300">(${voiceQuality})</span>`;

    // Display notification
    setVoiceNotification(notification);
    setShowVoiceNotification(true);

    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowVoiceNotification(false);
    }, 3000);
  }

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (synth) synth.cancel()
    }
  }, [synth])

  // Function to translate text using Gemini API
  const translateText = async (text: string, fromLang: string = "auto", toLang: string = "en") => {
    if (!text.trim()) return null;

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const fromLangName = translationLanguages.find(lang => lang.code === fromLang)?.name || fromLang;
      const toLangName = translationLanguages.find(lang => lang.code === toLang)?.name || toLang;

      const prompt = fromLang === "auto"
        ? `Translate the following text to ${toLangName}. Only return the translated text, nothing else:\n\n${text}`
        : `Translate the following text from ${fromLangName} to ${toLangName}. Only return the translated text, nothing else:\n\n${text}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation failed with status ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!translatedText) {
        throw new Error("No translation received");
      }

      setTranslatedText(translatedText);
      return {
        translatedText,
        detectedSourceLanguage: fromLang === "auto" ? "unknown" : fromLang
      };
    } catch (error) {
      console.error("Translation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Translation failed";
      setTranslationError(errorMessage);
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  // Function to toggle voice settings dialog
  const toggleVoiceSettings = () => {
    setIsVoiceSettingsOpen(!isVoiceSettingsOpen)
  }

  const handleAddMatch = () => {
    setEditingMatch({
      ...newMatchTemplate,
      id: `match-${Date.now()}`,
    })
    setIsDialogOpen(true)
  }

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match)
    setIsDialogOpen(true)
  }

  const handleSaveMatch = () => {
    if (!editingMatch) return

    if (matches.some((match) => match.id === editingMatch.id)) {
      onUpdateMatch(editingMatch)
    } else {
      onAddMatch(editingMatch)
    }

    setIsDialogOpen(false)
    setEditingMatch(null)
  }

  const handleDeleteMatch = (id: string) => {
    setMatchIdToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteMatch = () => {
    if (matchIdToDelete) {
      onDeleteMatch(matchIdToDelete)
      setMatchIdToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true
    if (filter === "upcoming") return !match.completed
    if (filter === "completed") return match.completed
    return true
  })

  // Sắp xếp trận đấu: trận sắp tới lên đầu, trận đã hoàn thành xuống cuối
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (a.completed && !b.completed) return 1
    if (!a.completed && b.completed) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng tải lên tệp hình ảnh');
      return;
    }

    setImageFile(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to add a reaction to a message
  const addReaction = (messageId: string, emoji: string) => {
    setChatMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const oldReactions = msg.reactions || {};
          const reactions = { ...oldReactions };
          if (reactions[emoji]) {
            // Increment existing reaction count
            reactions[emoji] = {
              ...reactions[emoji],
              count: reactions[emoji].count + 1,
              users: [...reactions[emoji].users, 'current-user'],
              timestamp: Date.now() // Update timestamp for animation
            };
          } else {
            // Add new reaction
            reactions[emoji] = {
              emoji,
              count: 1,
              users: ['current-user'],
              timestamp: Date.now()
            };
          }

          return {
            ...msg,
            reactions
          };
        }
        return msg;
      })
    );

    // Close emoji picker
    setShowingEmojiFor(null);
  };

  // Generate a unique ID for messages
  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a function to help extract match information from natural language
  const extractMatchInfo = (text: string): Partial<Match> => {
    const matchInfo: Partial<Match> = {};

    // Simple pattern matching for common formats
    // Example: "Thêm trận đấu giữa Arsenal và Chelsea vào ngày 15/10/2023 lúc 19:30 tại Emirates Stadium trong giải Ngoại hạng Anh"

    // Extract team names
    const teamPattern = /giữa\s+([^\s]+(?:\s+[^\s]+)*)\s+(?:và|vs|gặp)\s+([^\s]+(?:\s+[^\s]+)*)/i;
    const teamMatch = text.match(teamPattern);
    if (teamMatch) {
      let homeTeam = teamMatch[1].trim();
      let awayTeam = teamMatch[2].trim();

      // Loại bỏ phần thông tin ngày, thời gian, địa điểm khỏi tên đội (nếu có)
      const cleanPatterns = [
        /\s+vào\s+ngày.*/i,
        /\s+ngày.*/i,
        /\s+lúc.*/i,
        /\s+tại.*/i,
        /\s+ở.*/i,
        /\s+trong.*/i,
        /\s+thuộc.*/i,
      ];

      for (const pattern of cleanPatterns) {
        homeTeam = homeTeam.replace(pattern, '');
        awayTeam = awayTeam.replace(pattern, '');
      }

      matchInfo.homeTeam = homeTeam;
      matchInfo.awayTeam = awayTeam;
    }

    // Extract date (support multiple formats)
    const datePatterns = [
      /ngày\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i, // ngày DD/MM/YYYY
      /ngày\s+(\d{1,2})[\/\-](\d{1,2})/i, // ngày DD/MM (current year)
    ];

    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        if (dateMatch.length === 4) {
          // DD/MM/YYYY format
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3];
          matchInfo.date = `${year}-${month}-${day}`;
        } else {
          // DD/MM format (use current year)
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = new Date().getFullYear();
          matchInfo.date = `${year}-${month}-${day}`;
        }
        break;
      }
    }

    // Extract time
    const timePattern = /(?:lúc|giờ)\s+(\d{1,2})[h:](\d{1,2})?/i;
    const timeMatch = text.match(timePattern);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = (timeMatch[2] || "00").padStart(2, '0');
      matchInfo.time = `${hours}:${minutes}`;
    }

    // Extract venue
    const venuePatterns = [
      /(?:tại|ở)\s+([^\.,]+)(?:,|\.|trong)/i,
      /(?:tại|ở)\s+([^\.,]+)$/i,
    ];

    for (const pattern of venuePatterns) {
      const venueMatch = text.match(pattern);
      if (venueMatch) {
        matchInfo.venue = venueMatch[1].trim();
        break;
      }
    }

    // Extract competition
    const competitionPatterns = [
      /(?:trong|thuộc)\s+(?:giải|khuôn khổ)\s+([^\.,]+)(?:,|\.)/i,
      /(?:trong|thuộc)\s+(?:giải|khuôn khổ)\s+([^\.,]+)$/i,
      /(?:giải|khuôn khổ)\s+([^\.,]+)(?:,|\.)/i,
      /(?:giải|khuôn khổ)\s+([^\.,]+)$/i,
    ];

    for (const pattern of competitionPatterns) {
      const competitionMatch = text.match(pattern);
      if (competitionMatch) {
        matchInfo.competition = competitionMatch[1].trim();
        break;
      }
    }

    // Extract score for home team
    const homeScorePatterns = [
      /(?:đội nhà|đội 1)\s+(?:ghi được|đạt|ghi|thắng|được)\s+(\d+)(?:\s+bàn|\s+điểm|\s+bàn thắng)?/i,
      /(?:tỉ số|tỷ số|kết quả)\s+(\d+)(?:\s*[\-:])\s*\d+/i,
      /(\d+)(?:\s*[\-:])\s*\d+\s+(?:cho|là tỉ số của|là kết quả)/i,
    ];

    for (const pattern of homeScorePatterns) {
      const scoreMatch = text.match(pattern);
      if (scoreMatch) {
        matchInfo.homeScore = parseInt(scoreMatch[1], 10);
        // Nếu có điểm số, đánh dấu trận đấu đã kết thúc
        matchInfo.completed = true;
        break;
      }
    }

    // Extract score for away team
    const awayScorePatterns = [
      /(?:đội khách|đội 2)\s+(?:ghi được|đạt|ghi|thắng|được)\s+(\d+)(?:\s+bàn|\s+điểm|\s+bàn thắng)?/i,
      /(?:tỉ số|tỷ số|kết quả)\s+\d+(?:\s*[\-:])\s*(\d+)/i,
      /\d+(?:\s*[\-:])\s*(\d+)\s+(?:cho|là tỉ số của|là kết quả)/i,
    ];

    for (const pattern of awayScorePatterns) {
      const scoreMatch = text.match(pattern);
      if (scoreMatch) {
        matchInfo.awayScore = parseInt(scoreMatch[1], 10);
        // Nếu có điểm số, đánh dấu trận đấu đã kết thúc
        matchInfo.completed = true;
        break;
      }
    }

    // Extract notes
    const notesPatterns = [
      /ghi chú(?:\s*[:]\s*)["']([^"']+)["']/i,
      /ghi chú(?:\s*[:]\s*)([^.,]+)(?:,|\.|\n|$)/i,
      /chú thích(?:\s*[:]\s*)["']([^"']+)["']/i,
      /chú thích(?:\s*[:]\s*)([^.,]+)(?:,|\.|\n|$)/i,
    ];

    for (const pattern of notesPatterns) {
      const notesMatch = text.match(pattern);
      if (notesMatch) {
        matchInfo.notes = notesMatch[1].trim();
        break;
      }
    }

    return matchInfo;
  };

  // Parse agent action from AI response
  const parseAgentAction = (aiText: string): { text: string, action: AgentAction } => {
    const actionPattern = /\[ACTION:([^]]+)\]/;
    const match = aiText.match(actionPattern);

    if (!match) {
      return { text: aiText, action: { type: 'NONE' } };
    }

    try {
      const actionJson = match[1].trim();
      const action = JSON.parse(actionJson) as AgentAction;

      // Remove the action part from the text
      const cleanedText = aiText.replace(actionPattern, '').trim();

      return { text: cleanedText, action };
    } catch (e) {
      console.error("Error parsing agent action:", e);
      return { text: aiText, action: { type: 'NONE' } };
    }
  };

  const getActionDescription = (action: AgentAction): string => {
    switch (action.type) {
      case 'ADD_MATCH':
        let description = `Thêm trận đấu ${action.match.homeTeam} vs ${action.match.awayTeam}`;
        if (action.match.completed && action.match.homeScore !== undefined && action.match.awayScore !== undefined) {
          description += ` (${action.match.homeScore}-${action.match.awayScore})`;
        }
        return description;
      case 'FILTER_MATCHES':
        return `Lọc trận đấu ${
          action.filter === 'upcoming' ? 'sắp diễn ra' :
          action.filter === 'completed' ? 'đã kết thúc' : 'tất cả'
        }`;
      case 'FIND_MATCH':
        return `Tìm kiếm trận đấu "${action.criteria}"`;
      case 'NONE':
        return 'Không có hành động';
    }
  };

  // Agent Action Executors
  const executeAgentAction = (action: AgentAction) => {
    if (action.type === 'NONE') return;

    const actionMessageId = generateMessageId();
    const actionMessage = {
      role: 'agent' as const,
      content: `⚡ Đang thực hiện hành động: ${getActionDescription(action)}`,
      id: actionMessageId
    };

    setChatMessages(prev => [...prev, actionMessage]);

    // Execute different actions based on type
    switch (action.type) {
      case 'ADD_MATCH':
        // Create a complete match object with all required fields
        const newMatch = {
          ...newMatchTemplate,
          id: `match-${Date.now()}`,
          ...action.match,
          // Set default values for any missing fields
          homeTeam: action.match.homeTeam || "",
          awayTeam: action.match.awayTeam || "",
          date: action.match.date || new Date().toISOString().split("T")[0],
          time: action.match.time || "19:00",
          venue: action.match.venue || "",
          competition: action.match.competition || "V-League",
          completed: action.match.completed || false,
        };

        // Automatically add the match
        onAddMatch(newMatch as Match);

        const resultMessageId = generateMessageId();
        setChatMessages(prev => [
          ...prev,
          {
            role: 'agent',
            content: `✅ Đã thêm trận đấu mới:\n\n${newMatch.homeTeam} VS ${newMatch.awayTeam}\n\nVào ngày: ${formatDate(newMatch.date)}${newMatch.completed ? `\nKết quả: ${newMatch.homeScore || 0}-${newMatch.awayScore || 0}` : ''}${newMatch.notes ? `\nGhi chú: ${newMatch.notes}` : ''}`,
            id: resultMessageId
          }
        ]);
        break;

      case 'FILTER_MATCHES':
        if (action.filter === 'upcoming') {
          setFilter('upcoming');
        } else if (action.filter === 'completed') {
          setFilter('completed');
        } else {
          setFilter('all');
        }

        const filterMessageId = generateMessageId();
        setChatMessages(prev => [
          ...prev,
          {
            role: 'agent',
            content: `✅ Đã lọc danh sách trận đấu: ${
              action.filter === 'upcoming' ? 'Sắp diễn ra' :
              action.filter === 'completed' ? 'Đã kết thúc' : 'Tất cả'
            }`,
            id: filterMessageId
          }
        ]);
        break;

      case 'FIND_MATCH':
        const searchTerm = action.criteria.toLowerCase();
        const foundMatches = matches.filter(match =>
          match.homeTeam.toLowerCase().includes(searchTerm) ||
          match.awayTeam.toLowerCase().includes(searchTerm) ||
          match.competition.toLowerCase().includes(searchTerm) ||
          match.venue.toLowerCase().includes(searchTerm)
        );

        const findMessageId = generateMessageId();
        if (foundMatches.length > 0) {
          const matchesInfo = foundMatches.map(match =>
            `• ${match.homeTeam} VS ${match.awayTeam}\n  Ngày: ${formatDate(match.date)}  |  Địa điểm: ${match.venue}`
          ).join('\n\n');

          setChatMessages(prev => [
            ...prev,
            {
              role: 'agent',
              content: `🔍 Tìm thấy ${foundMatches.length} trận đấu:\n\n${matchesInfo}`,
              id: findMessageId
            }
          ]);
        } else {
          setChatMessages(prev => [
            ...prev,
            {
              role: 'agent',
              content: `❌ Không tìm thấy trận đấu nào phù hợp với "${action.criteria}"`,
              id: findMessageId
            }
          ]);
        }
        break;
    }

    setPendingAgentAction(null);
  };

  // AI chat function
  const askAI = async () => {
    if (!aiQuestion.trim() && !uploadedImage) return;

    // Add user message to chat history
    const userMessage = aiQuestion.trim();
    const userMessageId = generateMessageId();

    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage || (uploadedImage ? '[Đã gửi một hình ảnh]' : ''),
      id: userMessageId
    }]);

    // Check for founder question
    const founderQuestions = [
      'người sáng lập',
      'ai sáng lập',
      'founder',
      'người tạo ra',
      'ai tạo ra',
      'ai làm ra',
      'người phát triển',
      'ai phát triển'
    ];

    if (founderQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      const founderResponse = `Đây là phần mềm quản lý đội bóng do một nhóm sinh viên kĩ thuật của các trường như <b>HCMUT</b>, <b>UIT</b>, <b>SGU</b> cùng phát triển. Người đứng đầu dự án (CO-Founder) là <b>LÊ NGỌC GIÀU</b>, <b>NGUYỄN HOÀNG NAM</b>, <b>TRẦN CÔNG MINH</b>,... đây là những người thực hiện code và phát triển ý tưởng dự án.`;

      const aiMessageId = generateMessageId();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: founderResponse,
        id: aiMessageId
      }]);

      // Speak the AI response
      speakText(founderResponse);

      // Clear input after sending
      setAiQuestion("");
      handleRemoveImage();
      return;
    }

    // First check if the message directly asks to add a match
    if (userMessage.toLowerCase().includes('thêm trận') ||
        userMessage.toLowerCase().includes('tạo trận') ||
        userMessage.includes('đặt lịch trận')) {

      // Try to extract match information directly from the prompt
      const matchInfo = extractMatchInfo(userMessage);

      // If we have at least home team and away team, suggest adding the match
      if (matchInfo.homeTeam && matchInfo.awayTeam) {
        const action: AgentAction = {
          type: 'ADD_MATCH',
          match: matchInfo
        };

        // Add a system message confirming the extracted info with ID
        const agentMessageId = generateMessageId();

        setChatMessages(prev =>
          [...prev, {
            role: 'agent',
            content: `🤖 Tôi đã hiểu yêu cầu của bạn. Bạn muốn thêm trận đấu:

${matchInfo.homeTeam} VS ${matchInfo.awayTeam}

Thông tin chi tiết:${matchInfo.date ? `
• Ngày thi đấu: ${matchInfo.date}` : ''}${matchInfo.time ? `
• Giờ thi đấu: ${matchInfo.time}` : ''}${matchInfo.venue ? `
• Địa điểm: ${matchInfo.venue}` : ''}${matchInfo.competition ? `
• Giải đấu: ${matchInfo.competition}` : ''}${matchInfo.completed ? `
• Trạng thái: Đã kết thúc${matchInfo.homeScore !== undefined && matchInfo.awayScore !== undefined ? ` (Tỉ số: ${matchInfo.homeScore}-${matchInfo.awayScore})` : ''}` : ''}${matchInfo.notes ? `
• Ghi chú: ${matchInfo.notes}` : ''}

Vui lòng xác nhận bằng nút bên dưới.`,
            id: agentMessageId
          }]
        );

        setPendingAgentAction(action);
        setAiQuestion("");
        handleRemoveImage();
        return;
      }
    }

    // Check if user message contains a direct action command
    if (userMessage.includes('[ACTION:')) {
      try {
        const { action } = parseAgentAction(userMessage);
        if (action.type !== 'NONE') {
          // Add a clear system message about detected action
          const actionMessageId = generateMessageId();
          setChatMessages(prev => [...prev, {
            role: 'agent',
            content: `🤖 Đã phát hiện lệnh thực hiện: "${getActionDescription(action)}"\n\nVui lòng xác nhận bằng nút bên dưới.`,
            id: actionMessageId
          }]);

          setPendingAgentAction(action);
          setAiQuestion("");
          handleRemoveImage();
          return;
        }
      } catch (error) {
        console.error("Failed to parse direct action:", error);
        // Show error message if parsing failed
        const errorMessageId = generateMessageId();
        setChatMessages(prev => [...prev, {
          role: 'agent',
          content: `❌ Không thể phân tích lệnh. Vui lòng kiểm tra định dạng JSON.`,
          id: errorMessageId
        }]);
      }
    }

    // Check if message starts with '@' - handle as general knowledge question
    if (userMessage.startsWith('@')) {
      const generalQuestion = userMessage.substring(1).trim(); // Remove @ prefix

      setIsAiLoading(true);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: generalQuestion }]
              }]
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể lấy được phản hồi từ AI.";

        // Add AI response to chat history
        const aiMessageId = generateMessageId();
        setChatMessages(prev => [...prev, {
          role: 'ai',
          content: aiResponse,
          id: aiMessageId
        }]);

        // Speak the AI response
        speakText(aiResponse);

        // Clear input after sending
        setAiQuestion("");
        handleRemoveImage();

      } catch (error) {
        console.error("Error querying AI:", error);
        const errorMessageId = generateMessageId();
        setChatMessages(prev => [...prev, {
          role: 'ai',
          content: "Đã xảy ra lỗi khi tương tác với AI. Vui lòng thử lại sau.",
          id: errorMessageId
        }]);
      } finally {
        setIsAiLoading(false);
      }
      return;
    }

    setIsAiLoading(true);

    try {
      // Create context from matches data
      const matchesContext = matches.map(match =>
        `${match.homeTeam} vs ${match.awayTeam} - ${formatDate(match.date)} at ${match.time}, ${match.venue}, ${match.competition}${
          match.completed ? `, Score: ${match.homeScore}-${match.awayScore}` : ""
        }`
      ).join("\n");

      // Describe agent capabilities
      const agentCapabilities = `
Bạn là một AI Agent có khả năng không chỉ trả lời câu hỏi mà còn thực hiện các hành động sau:
1. Thêm trận đấu mới (ADD_MATCH): Khi người dùng yêu cầu thêm trận đấu, bạn có thể tạo một trận đấu mới
2. Lọc danh sách trận đấu (FILTER_MATCHES): Hiển thị các trận sắp tới, đã kết thúc, hoặc tất cả
3. Tìm kiếm trận đấu (FIND_MATCH): Tìm trận đấu dựa theo đội bóng, giải đấu, địa điểm...

Nếu yêu cầu của người dùng liên quan đến một trong các hành động trên, hãy trả lời và thêm cú pháp JSON đặc biệt:
[ACTION:{"type":"ACTION_TYPE",...chi tiết action}]

Ví dụ:
- Nếu người dùng muốn thêm trận đấu giữa MU và Chelsea ngày 15/09/2023:
[ACTION:{"type":"ADD_MATCH","match":{"homeTeam":"MU","awayTeam":"Chelsea","date":"2023-09-15","venue":"Old Trafford","competition":"Ngoại hạng Anh"}}]

- Nếu người dùng muốn xem các trận sắp diễn ra:
[ACTION:{"type":"FILTER_MATCHES","filter":"upcoming"}]

- Nếu người dùng muốn tìm trận đấu với Man City:
[ACTION:{"type":"FIND_MATCH","criteria":"Man City"}]

Việc của bạn là hiểu ý định của người dùng và thực hiện đúng hành động tương ứng.
      `;

      let requestBody: any = {
        contents: [{
          parts: []
        }]
      };

      // Add text if provided
      if (userMessage) {
        const prompt = `Thông tin về các trận đấu:\n${matchesContext}\n\n${agentCapabilities}\n\nCâu hỏi: ${userMessage}`;
        requestBody.contents[0].parts.push({ text: prompt });
      }

      // Add image if provided
      if (imageFile) {
        const imageBase64 = uploadedImage?.split(',')[1];
        if (imageBase64) {
          requestBody.contents[0].parts.push({
            inline_data: {
              mime_type: imageFile.type,
              data: imageBase64
            }
          });

          // Add specific prompt for image analysis if no text was provided
          if (!userMessage) {
            requestBody.contents[0].parts.push({
              text: `${agentCapabilities}\n\nHãy phân tích hình ảnh này và mô tả những gì bạn thấy liên quan đến bóng đá hoặc thể thao.`
            });
          }
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể lấy được phản hồi từ AI.";

      // Parse agent actions
      const { text: aiText, action } = parseAgentAction(rawAiText);

      // Add AI response to chat history
      const aiMessageId = generateMessageId();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: aiText,
        id: aiMessageId
      }]);

      // Speak the AI response
      speakText(aiText);

      // Handle agent action if present
      if (action.type !== 'NONE') {
        setPendingAgentAction(action);
      }

      // Clear input and image after sending
      setAiQuestion("");
      handleRemoveImage();

    } catch (error) {
      console.error("Error querying AI:", error);
      const errorMessageId = generateMessageId();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: "Đã xảy ra lỗi khi tương tác với AI. Vui lòng thử lại sau.",
        id: errorMessageId
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle AI sidebar visibility
  const toggleAiSidebar = () => {
    setShowAiSidebar(!showAiSidebar);
    if (!showAiSidebar) {
      setAiQuestion("");
      setUploadedImage(null);
      setImageFile(null);
    }
  };

  // Add handleChatDialogQuestion function to handle chat requests from the dialog
  const handleChatDialogQuestion = async () => {
    if (!chatDialogQuestion.trim()) return;

    let apiKeyToUse = useCustomApiKey ? customApiKey : GEMINI_API_KEY;

    if (!apiKeyToUse) {
      alert("Vui lòng nhập API key hoặc sử dụng API key mặc định");
      return;
    }

    // Add user message to chat history
    const userMessage = chatDialogQuestion.trim();
    const userMessageId = generateMessageId();

    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      id: userMessageId
    }]);

    // Check for founder question
    const founderQuestions = [
      'người sáng lập',
      'ai sáng lập',
      'founder',
      'người tạo ra',
      'ai tạo ra',
      'ai làm ra',
      'người phát triển',
      'ai phát triển'
    ];

    if (founderQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      const founderResponse = `Đây là phần mềm quản lý đội bóng do một nhóm sinh viên kĩ thuật của các trường như <b>HCMUT</b>, <b>UIT</b>, <b>SGU</b> cùng phát triển. Người đứng đầu dự án (CO-Founder) là <b>LÊ NGỌC GIÀU</b>, <b>NGUYỄN HOÀNG NAM</b>, <b>TRẦN CÔNG MINH</b>,... đây là những người thực hiện code và phát triển ý tưởng dự án.`;

      const aiMessageId = generateMessageId();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: founderResponse,
        id: aiMessageId
      }]);

      // Speak the AI response
      speakText(founderResponse);

      // Clear input after sending
      setChatDialogQuestion("");
      return;
    }

    setIsAiLoading(true);

    try {
      // Check if message starts with '@' - handle as general knowledge question
      if (userMessage.startsWith('@')) {
        const generalQuestion = userMessage.substring(1).trim(); // Remove @ prefix

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: generalQuestion }]
              }]
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể lấy được phản hồi từ AI.";

        // Add AI response to chat history
        const aiMessageId = generateMessageId();
        setChatMessages(prev => [...prev, {
          role: 'ai',
          content: aiResponse,
          id: aiMessageId
        }]);

        // Speak the AI response
        speakText(aiResponse);

        // Clear input after sending
        setChatDialogQuestion("");
        handleRemoveImage();

      } else {
        // Regular app-related question - use the existing functionality
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyToUse}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: userMessage }]
              }]
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể lấy được phản hồi từ AI.";

        // Add AI response to chat history
        const aiMessageId = generateMessageId();
        setChatMessages(prev => [...prev, {
          role: 'ai',
          content: aiResponse,
          id: aiMessageId
        }]);

        // Speak the AI response
        speakText(aiResponse);
      }

      // Clear input after sending
      setChatDialogQuestion("");

    } catch (error) {
      console.error("Error querying AI:", error);
      const errorMessageId = generateMessageId();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: "Đã xảy ra lỗi khi tương tác với AI. Vui lòng kiểm tra API key hoặc thử lại sau.",
        id: errorMessageId
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRateMatch = (match: Match) => {
    setRatingMatch(match)
    setIsRatingDialogOpen(true)
  }

  const handleViewEvents = (match: Match) => {
    setEventsMatch(match)
    setIsEventsDialogOpen(true)
  }

  const handleSaveRatings = (ratings: PlayerRatingsData) => {
    if (ratingMatch) {
      const updatedMatch = {
        ...ratingMatch,
        playerRatings: ratings
      }
      onUpdateMatch(updatedMatch)
    }
  }

  const handleSaveEvents = (events: MatchEventsType, updatedPlayers?: {player: Player, teamId: string}[]) => {
    if (eventsMatch) {
      const updatedMatch = {
        ...eventsMatch,
        events: events
      }
      onUpdateMatch(updatedMatch)

      // Cập nhật thông tin cầu thủ nếu có
      if (updatedPlayers && updatedPlayers.length > 0) {
        // Tạo bản sao đội nhà và đội khách để cập nhật
        const updatedHomeTeam = {...homeTeam};
        const updatedAwayTeam = {...awayTeam};
        let homeTeamUpdated = false;
        let awayTeamUpdated = false;

        // Cập nhật thông tin cho từng cầu thủ
        updatedPlayers.forEach(({ player, teamId }) => {
          if (teamId === homeTeam.id) {
            // Cập nhật cầu thủ trong đội nhà
            const playerIndex = updatedHomeTeam.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
              updatedHomeTeam.players[playerIndex] = {
                ...updatedHomeTeam.players[playerIndex],
                yellowCards: player.yellowCards,
                redCards: player.redCards
              };
              homeTeamUpdated = true;
            }
          } else if (teamId === awayTeam.id) {
            // Cập nhật cầu thủ trong đội khách
            const playerIndex = updatedAwayTeam.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
              updatedAwayTeam.players[playerIndex] = {
                ...updatedAwayTeam.players[playerIndex],
                yellowCards: player.yellowCards,
                redCards: player.redCards
              };
              awayTeamUpdated = true;
            }
          }
        });

        // Cập nhật đội nếu có thay đổi
        if (homeTeamUpdated && onUpdateHomeTeam) {
          onUpdateHomeTeam(updatedHomeTeam);
        }
        if (awayTeamUpdated && onUpdateAwayTeam) {
          onUpdateAwayTeam(updatedAwayTeam);
        }
      }

      setIsEventsDialogOpen(false)
    }
  }

  const [retryStatus, setRetryStatus] = useState<string | null>(null)

  // Voice notification states
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null)
  const [showVoiceNotification, setShowVoiceNotification] = useState(false)

  // Add animation styles when component mounts
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.innerHTML = fadeInOutKeyframes;
    document.head.appendChild(styleEl);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="relative flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${showAiSidebar ? 'md:pr-[350px]' : ''}`}>
        <div className="space-y-4 p-2 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Lịch thi đấu</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={toggleAiSidebar} variant="outline" className="flex items-center text-xs sm:text-sm">
                <Bot className="h-4 w-4 mr-1 sm:mr-2" /> {showAiSidebar ? "Đóng AI" : "Hỏi AI"}
              </Button>
              <Button onClick={handleAddMatch} className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" /> Thêm trận đấu
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")} className="text-xs">
              Tất cả
            </Button>
            <Button variant={filter === "upcoming" ? "default" : "outline"} size="sm" onClick={() => setFilter("upcoming")} className="text-xs">
              Sắp diễn ra
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
              className="text-xs"
            >
              Đã kết thúc
            </Button>
          </div>

          {sortedMatches.length === 0 ? (
            <div className="text-center p-4 md:p-8 text-gray-500">
              Không có trận đấu nào {filter === "upcoming" ? "sắp diễn ra" : filter === "completed" ? "đã kết thúc" : ""}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMatches.map((match) => (
                <div
                  key={match.id}
                  className={`border rounded-lg p-3 md:p-4 ${
                    match.completed ? "bg-gray-50" : "bg-white"
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                    <div>
                      <Badge variant={match.completed ? "secondary" : "default"}>
                        {match.completed ? "Đã kết thúc" : "Sắp diễn ra"}
                      </Badge>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Trophy className="h-4 w-4 mr-1" />
                        {match.competition}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.completed && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex items-center text-xs"
                            onClick={() => handleRateMatch(match)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {match.playerRatings ? "Xem đánh giá" : "Đánh giá"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex items-center text-xs"
                            onClick={() => handleViewEvents(match)}
                          >
                            <Goal className="h-3 w-3 mr-1" />
                            {match.events ? "Xem sự kiện" : "Thêm sự kiện"}
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditMatch(match)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => handleDeleteMatch(match.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="text-right flex-1">
                      <p className="font-bold text-base sm:text-lg">{match.homeTeam}</p>
                      {match.completed && <p className="text-xl sm:text-2xl font-bold">{match.homeScore}</p>}
                    </div>
                    <div className="mx-2 sm:mx-4 text-center">
                      <p className="text-sm font-medium">VS</p>
                      {match.completed && <p className="text-lg font-bold">-</p>}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-base sm:text-lg">{match.awayTeam}</p>
                      {match.completed && <p className="text-xl sm:text-2xl font-bold">{match.awayScore}</p>}
                    </div>
                  </div>

                  {/* MVP Display */}
                  {match.playerRatings && match.completed && (match.playerRatings.homeMVP || match.playerRatings.awayMVP) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Home Team MVP */}
                      <div className="bg-yellow-100 rounded-lg p-3 sm:p-5 relative overflow-hidden shadow-md border border-yellow-200">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-300 opacity-20 transform translate-x-10 -translate-y-10"></div>

                        {match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            WIN
                          </div>
                        )}

                        {match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore < match.awayScore && (
                          <div className="absolute top-3 right-3 border border-gray-300 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                            LOSS
                          </div>
                        )}

                        <div className="flex items-start">
                          <div className="mr-3 sm:mr-4">
                            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500" />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-bold mb-2 sm:mb-3">MVP Đội nhà</div>
                            {match.playerRatings?.homeMVP ?
                              (() => {
                                const homeMvpPlayer = homeTeam.players.find(p => p.id === match.playerRatings?.homeMVP);
                                const homeMvpRating = match.playerRatings?.homeTeamRatings.find(r => r.playerId === match.playerRatings?.homeMVP);

                                if (!homeMvpPlayer || !homeMvpRating) {
                                  return <span className="text-gray-500 text-sm">MVP không có sẵn</span>;
                                }

                                return (
                                  <div className="flex items-center">
                                    <div className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-full text-white bg-blue-500 mr-2 sm:mr-3 shadow-md`}>
                                      {homeMvpPlayer.image ? (
                                        <img src={homeMvpPlayer.image} alt={homeMvpPlayer.name} className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        <div className="text-base sm:text-lg font-bold">{homeMvpPlayer.position.charAt(0) || "?"}</div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-base sm:text-lg font-bold">{homeMvpPlayer.name}</p>
                                      <p className="text-xs sm:text-sm text-gray-600">{homeMvpPlayer.position}</p>
                                      <div className="flex items-center mt-1">
                                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-base sm:text-lg font-bold ml-1">{homeMvpRating.score.toFixed(1)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                              : <span className="text-gray-500 text-sm">Chưa có MVP</span>
                            }
                          </div>
                        </div>
                      </div>

                      {/* Away Team MVP */}
                      <div className="bg-purple-100 rounded-lg p-3 sm:p-5 relative overflow-hidden shadow-md border border-purple-200">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-300 opacity-20 transform translate-x-10 -translate-y-10"></div>

                        {match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            WIN
                          </div>
                        )}

                        {match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore < match.homeScore && (
                          <div className="absolute top-3 right-3 border border-gray-300 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                            LOSS
                          </div>
                        )}

                        <div className="flex items-start">
                          <div className="mr-3 sm:mr-4">
                            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-bold mb-2 sm:mb-3">MVP Đội khách</div>
                            {match.playerRatings?.awayMVP ?
                              (() => {
                                const awayMvpPlayer = awayTeam.players.find(p => p.id === match.playerRatings?.awayMVP);
                                const awayMvpRating = match.playerRatings?.awayTeamRatings.find(r => r.playerId === match.playerRatings?.awayMVP);

                                if (!awayMvpPlayer || !awayMvpRating) {
                                  return <span className="text-gray-500 text-xs sm:text-sm">MVP không có sẵn</span>;
                                }

                                return (
                                  <div className="flex items-center">
                                    <div className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-full text-white bg-red-500 mr-2 sm:mr-3 shadow-md`}>
                                      {awayMvpPlayer.image ? (
                                        <img src={awayMvpPlayer.image} alt={awayMvpPlayer.name} className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        <div className="text-base sm:text-lg font-bold">{awayMvpPlayer.position.charAt(0) || "?"}</div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-base sm:text-lg font-bold">{awayMvpPlayer.name}</p>
                                      <p className="text-xs sm:text-sm text-gray-600">{awayMvpPlayer.position}</p>
                                      <div className="flex items-center mt-1">
                                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-base sm:text-lg font-bold ml-1">{awayMvpRating.score.toFixed(1)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                              : <span className="text-gray-500 text-xs sm:text-sm">Chưa có MVP</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {formatDate(match.date)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {match.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {match.venue}
                    </div>
                  </div>

                  {match.notes && (
                    <div className="mt-3 pt-3 border-t text-xs sm:text-sm text-gray-600">
                      <p className="font-medium mb-1">Ghi chú:</p>
                      <p>{match.notes}</p>
                    </div>
                  )}

                  {/* Match Events Summary */}
                  {match.events && match.completed && (
                    <div className="mt-3 pt-3 border-t text-xs sm:text-sm">
                      <p className="font-medium mb-2 flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Diễn biến trận đấu:
                      </p>

                      <div className="space-y-2">
                        {/* Goals */}
                        {match.events.goals.length > 0 && (
                          <div className="flex items-start">
                            <div className="w-5 sm:w-6 flex-shrink-0">
                              <Goal className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium text-gray-700 text-xs sm:text-sm">Bàn thắng:</p>
                              <div className="space-y-1">
                                {match.events.goals
                                  .sort((a, b) => a.minute - b.minute)
                                  .map((goal, index) => {
                                    const isHomeTeam = goal.teamId === homeTeam.id;
                                    const player = isHomeTeam
                                      ? homeTeam.players.find(p => p.id === goal.playerId)
                                      : awayTeam.players.find(p => p.id === goal.playerId);

                                    const assistPlayer = goal.assistPlayerId
                                      ? (goal.teamId === homeTeam.id
                                          ? homeTeam.players.find(p => p.id === goal.assistPlayerId)
                                          : awayTeam.players.find(p => p.id === goal.assistPlayerId))
                                      : undefined;

                                    if (!player) return null;

                                    return (
                                      <div key={goal.id} className="flex flex-wrap items-center text-gray-600 text-xs sm:text-sm">
                                        <Badge className="mr-2 bg-gray-200 text-gray-800 font-normal text-[10px] sm:text-xs">{goal.minute}'</Badge>
                                        <span className={`${isHomeTeam ? 'text-blue-600' : 'text-red-600'} font-medium`}>
                                          {player.name}
                                          {goal.isOwnGoal && <span className="text-gray-500">(phản lưới)</span>}
                                          {goal.isPenalty && <span className="text-gray-500">(phạt đền)</span>}
                                        </span>
                                        {assistPlayer && (
                                          <span className="text-gray-500 ml-1 text-[10px] sm:text-xs">
                                            (kiến tạo: {assistPlayer.name})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cards */}
                        {match.events.cards.length > 0 && (
                          <div className="flex items-start">
                            <div className="w-5 sm:w-6 flex-shrink-0">
                              <Flag className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium text-gray-700 text-xs sm:text-sm">Thẻ phạt:</p>
                              <div className="space-y-1">
                                {match.events.cards
                                  .sort((a, b) => a.minute - b.minute)
                                  .map((card, index) => {
                                    const isHomeTeam = card.teamId === homeTeam.id;
                                    const player = isHomeTeam
                                      ? homeTeam.players.find(p => p.id === card.playerId)
                                      : awayTeam.players.find(p => p.id === card.playerId);

                                    if (!player) return null;

                                    return (
                                      <div key={card.id} className="flex flex-wrap items-center text-gray-600 text-xs sm:text-sm">
                                        <Badge className="mr-2 bg-gray-200 text-gray-800 font-normal text-[10px] sm:text-xs">{card.minute}'</Badge>
                                        <div className={`w-2 sm:w-3 h-3 sm:h-4 mr-1 ${card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
                                        <span className="font-medium">
                                          {player.name}
                                        </span>
                                        {card.reason && (
                                          <span className="text-gray-500 ml-1 text-[10px] sm:text-xs">
                                            ({card.reason})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        )}

                        {match.events.goals.length === 0 && match.events.cards.length === 0 && (
                          <p className="text-gray-500 text-xs sm:text-sm">Chưa có dữ liệu sự kiện</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Sidebar */}
      {showAiSidebar && (
        <div className="fixed inset-0 z-40 md:z-10 md:inset-auto md:top-0 md:right-0 md:h-full md:w-[350px] border-l bg-slate-50 flex flex-col shadow-lg">
          <div className="p-3 sm:p-4 border-b bg-white flex justify-between items-center">
            <h3 className="font-bold text-base sm:text-lg flex items-center">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" /> Trợ lý AI
            </h3>
            <div className="flex items-center">
              <Button
                variant={isListening ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 w-8 p-0 mr-1 sm:mr-2 ${isListening ? "bg-red-100 text-red-600" : ""}`}
                onClick={toggleListening}
                title={isListening ? "Đang nghe (nhấn để dừng)" : ""}
              >
                <Mic className={`h-4 w-4 ${isListening ? "animate-pulse text-red-500" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mr-1 sm:mr-2"
                onClick={toggleVoiceSettings}
                title="Cài đặt giọng nói"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mr-1 sm:mr-2"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                title={isSpeechEnabled ? "Tắt phát âm" : "Bật phát âm"}
              >
                {isSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleAiSidebar}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Voice notification for AI sidebar */}
          {showVoiceNotification && voiceNotification && (
            <div className="absolute top-14 sm:top-16 right-2 left-2 sm:right-4 sm:left-4 z-50">
              <div
                className="bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-lg text-xs sm:text-sm flex items-center"
                style={{
                  animation: "fadeInOut 3s ease-in-out forwards",
                }}
              >
                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-400" />
                <div dangerouslySetInnerHTML={{ __html: voiceNotification }}></div>
              </div>
            </div>
          )}

          {/* Speech recognition error notification */}
          {recognitionError && (
            <div className="absolute top-14 sm:top-16 right-2 left-2 sm:right-4 sm:left-4 z-50">
              <div
                className="bg-red-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-lg text-xs sm:text-sm flex items-center"
                style={{
                  animation: "fadeInOut 6s ease-in-out forwards",
                }}
              >
                <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-white" />
                {recognitionError}
              </div>
            </div>
          )}

          {/* Speech recognition notification */}
          {recognitionNotification && (
            <div className="absolute top-14 sm:top-16 right-2 left-2 sm:right-4 sm:left-4 z-50" style={{ top: recognitionError ? '60px' : '14px' }}>
              <div
                className="bg-blue-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-lg text-xs sm:text-sm flex items-center"
                style={{
                  animation: "fadeInOut 3s ease-in-out forwards",
                }}
              >
                <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-white" />
                {recognitionNotification}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 my-6 sm:my-8">
                <Bot className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-xs sm:text-sm">Hãy đặt câu hỏi hoặc tải lên hình ảnh để bắt đầu.</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`relative ${
                    msg.role === 'user'
                      ? 'bg-blue-100 ml-auto'
                      : msg.role === 'agent'
                        ? 'bg-purple-100 border border-purple-200'
                        : 'bg-white border'
                  } rounded-lg p-2 sm:p-3 max-w-[95%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className="whitespace-pre-line text-xs sm:text-sm"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />

                  {msg.role === 'ai' && (
                    <div className="mt-1 text-xs text-gray-400 flex items-center">
                      {autoDetectLanguage && (
                        <>
                          <span>
                            {supportedLanguages.find(lang =>
                              lang.code === detectLanguage(msg.content.replace(/<[^>]*>?/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/gm, '$1')))?.flag || '🌐'
                            }
                          </span>
                          <span className="ml-1">
                            {supportedLanguages.find(lang =>
                              lang.code === detectLanguage(msg.content.replace(/<[^>]*>?/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/gm, '$1')))?.name || 'Auto'
                            }
                          </span>
                          <span className="ml-1 text-blue-400">
                            (giọng tối ưu)
                          </span>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 sm:h-6 px-1.5 sm:px-2 py-0 sm:py-1 ml-auto text-[10px] sm:text-xs"
                        onClick={() => {
                          // Lấy ngôn ngữ được phát hiện
                          const cleanContent = msg.content.replace(/<[^>]*>?/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/gm, '$1');
                          const detectedLang = detectLanguage(cleanContent);
                          const langSettings = supportedLanguages.find(lang => lang.code === detectedLang)?.optimalSettings;

                          // Lưu ngôn ngữ phát hiện được
                          setLastDetectedLanguage(detectedLang);

                          // Hiển thị thông báo
                          const bestVoice = getBestVoiceForLanguage(detectedLang);
                          const voiceName = availableVoices.find(v => v.name === bestVoice)?.name || "Mặc định";
                          const voiceType = availableVoices.find(v => v.name === bestVoice)?.localService ? "Standard" : "Premium";
                          const notification = `${supportedLanguages.find(lang => lang.code === detectedLang)?.flag || '🌐'} <b>${supportedLanguages.find(lang => lang.code === detectedLang)?.name || detectedLang}</b> - ${voiceName} <span class="text-xs text-blue-300">(${voiceType})</span>`;

                          setVoiceNotification(notification);
                          setShowVoiceNotification(true);

                          // Ẩn thông báo sau 3 giây
                          setTimeout(() => {
                            setShowVoiceNotification(false);
                          }, 3000);

                          // Phát âm
                          speakText(msg.content);
                        }}
                      >
                        <Volume2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Đọc
                      </Button>
                    </div>
                  )}

                  {/* Emoji reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.values(msg.reactions).map((reaction) => (
                        <span
                          key={reaction.emoji}
                          className={cn(
                            "inline-flex items-center rounded-full border bg-white px-1.5 py-0.5 text-xs",
                            Date.now() - reaction.timestamp < 3000 && "animate-bounce"
                          )}
                          title={`${reaction.count} ${reaction.count > 1 ? 'reactions' : 'reaction'}`}
                        >
                          {reaction.emoji} {reaction.count > 1 && reaction.count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add reaction button */}
                  <div className="absolute bottom-1 right-1">
                    <Popover open={showingEmojiFor === msg.id} onOpenChange={(open) => {
                      if (open) setShowingEmojiFor(msg.id);
                      else setShowingEmojiFor(null);
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-full opacity-50 hover:opacity-100"
                        >
                          <Smile className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1" align="end">
                        <div className="flex space-x-1">
                          {availableEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              className="hover:bg-muted p-1.5 sm:p-2 rounded-full transition-colors"
                              onClick={() => addReaction(msg.id, emoji)}
                            >
                              <span className="text-base sm:text-lg">{emoji}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))
            )}
            {isAiLoading && (
              <div className="bg-white border rounded-lg p-2 sm:p-3 max-w-[90%]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Pending action */}
          {pendingAgentAction && (
            <div className="p-3 sm:p-4 border-t bg-purple-50 animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-xs sm:text-sm flex items-center">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-500" />
                  Hành động được đề xuất
                </h4>
              </div>

              {pendingAgentAction.type === 'ADD_MATCH' ? (
                <div>
                  <div className="text-xs sm:text-sm mb-2 font-medium">
                    Thêm trận đấu:
                  </div>
                  <div className="bg-white rounded p-2 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs sm:text-sm">{pendingAgentAction.match.homeTeam}</span>
                      <span className="text-xs mx-2">VS</span>
                      <span className="font-bold text-xs sm:text-sm">{pendingAgentAction.match.awayTeam}</span>
                    </div>
                    {pendingAgentAction.match.completed && pendingAgentAction.match.homeScore !== undefined && pendingAgentAction.match.awayScore !== undefined && (
                      <div className="flex justify-center mb-2 text-xs sm:text-sm">
                        <span className="font-bold">{pendingAgentAction.match.homeScore}</span>
                        <span className="mx-2">-</span>
                        <span className="font-bold">{pendingAgentAction.match.awayScore}</span>
                      </div>
                    )}
                    <div className="text-[10px] sm:text-xs space-y-1 text-gray-600">
                      {pendingAgentAction.match.date && (
                        <div className="flex items-center">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {pendingAgentAction.match.date}
                        </div>
                      )}
                      {pendingAgentAction.match.time && (
                        <div className="flex items-center">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {pendingAgentAction.match.time}
                        </div>
                      )}
                      {pendingAgentAction.match.venue && (
                        <div className="flex items-center">
                          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {pendingAgentAction.match.venue}
                        </div>
                      )}
                      {pendingAgentAction.match.competition && (
                        <div className="flex items-center">
                          <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {pendingAgentAction.match.competition}
                        </div>
                      )}
                      {pendingAgentAction.match.notes && (
                        <div className="flex items-start mt-1 pt-1 border-t border-gray-100">
                          <span className="text-[10px] sm:text-xs text-gray-500">Ghi chú:</span>
                          <span className="text-[10px] sm:text-xs ml-1">{pendingAgentAction.match.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm mb-3 font-medium">{getActionDescription(pendingAgentAction)}</p>
              )}

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => setPendingAgentAction(null)}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs sm:text-sm"
                  onClick={() => executeAgentAction(pendingAgentAction)}
                >
                  Xác nhận thực hiện
                </Button>
              </div>
            </div>
          )}

          {/* Image preview */}
          {uploadedImage && (
            <div className="p-3 sm:p-4 border-t bg-white">
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded image"
                  className="w-full h-auto max-h-[100px] sm:max-h-[150px] object-contain rounded-lg border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 p-0 bg-white/80 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 sm:p-4 border-t bg-white">
            <div className="flex flex-wrap gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center text-xs h-7 sm:h-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Gửi ảnh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center text-xs h-7 sm:h-8"
                onClick={() => setIsChatDialogOpen(true)}
              >
                <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Chat AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center text-xs h-7 sm:h-8"
                onClick={() => {
                  setCurrentInputType('ai');
                  setShowTranslationPanel(!showTranslationPanel);
                }}
                title="Dịch văn bản"
              >
                <Languages className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Dịch
              </Button>
              <Button
                variant={isListening ? "secondary" : "outline"}
                size="sm"
                className={`flex items-center text-xs h-7 sm:h-8 ${isListening ? "bg-red-100 border-red-300 text-red-600" : ""}`}
                onClick={toggleListening}
              >
                <Mic className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isListening ? "animate-pulse text-red-500" : ""}`} />
                {isListening ? "Listen..." : ""}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {/* Show interim transcript when listening */}
            {isListening && interimTranscript && (
              <div className="mb-2 p-2 bg-blue-50 rounded-md text-blue-700 text-sm italic">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-2"></div>
                  <span>Đang nghe: </span>
                </div>
                {interimTranscript}...
              </div>
            )}

            {/* Speech recognition error for input area */}
            {recognitionError && !isListening && (
              <div className="mb-2 p-2 bg-red-50 rounded-md text-red-700 text-sm">
                <div className="flex items-center">
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-500" />
                  {recognitionError}
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              {/* Translation Panel */}
              {showTranslationPanel && (
                <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Languages className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Dịch văn bản</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowTranslationPanel(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Từ ngôn ngữ</Label>
                      <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {translationLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center">
                                <span className="mr-2">{lang.flag}</span>
                                {lang.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Sang ngôn ngữ</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {translationLanguages.filter(lang => lang.code !== "auto").map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center">
                                <span className="mr-2">{lang.flag}</span>
                                {lang.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const textToTranslate = currentInputType === 'ai' ? aiQuestion : chatDialogQuestion;
                        if (textToTranslate.trim()) {
                          translateText(textToTranslate, sourceLanguage, targetLanguage);
                        }
                      }}
                      disabled={isTranslating || (!aiQuestion.trim() && !chatDialogQuestion.trim())}
                    >
                      {isTranslating ? "Đang dịch..." : "Dịch"}
                    </Button>
                  </div>

                  {translationError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {translationError}
                    </div>
                  )}

                  {translatedText && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600">Kết quả dịch:</div>
                      <div className="bg-white p-2 rounded border text-sm">
                        {translatedText}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (currentInputType === 'ai') {
                              setAiQuestion(translatedText);
                            } else {
                              setChatDialogQuestion(translatedText);
                            }
                            setShowTranslationPanel(false);
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Thay thế
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(translatedText);
                          }}
                        >
                          Sao chép
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <Textarea
                placeholder="Hỏi AI về lịch thi đấu, đội bóng, hoặc thông tin bóng đá..."
                value={aiQuestion}
                  onChange={(e) => {
                    const text = e.target.value;
                    // Giới hạn số từ (khoảng 1000 từ ~ 6000 ký tự)
                    const wordCount = text.trim().split(/\s+/).length;
                    if (wordCount <= 1000) {
                      setAiQuestion(text);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      askAI();
                    } else if (e.key === "t" && e.ctrlKey) {
                      e.preventDefault();
                      setCurrentInputType('ai');
                      setShowTranslationPanel(!showTranslationPanel);
                    }
                  }}
                disabled={isAiLoading}
                  className={`min-h-[60px] sm:min-h-[80px] resize-y max-h-[150px] sm:max-h-[200px] text-xs sm:text-sm ${isListening ? "border-blue-300 focus-visible:ring-blue-400" : ""}`}
                />
                {aiQuestion && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
                    {aiQuestion.trim().split(/\s+/).length}/1000 từ
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                  <kbd className="px-1 py-0.5 border rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 border rounded">Enter</kbd> để gửi •
                  <kbd className="px-1 py-0.5 border rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 border rounded">T</kbd> để dịch
                </div>
                <Button onClick={askAI} disabled={isAiLoading} className="ml-auto text-xs sm:text-sm h-7 sm:h-8">
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Gửi
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog xác nhận xóa */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa trận đấu"
        description="Bạn có chắc chắn muốn xóa trận đấu này? Hành động này không thể hoàn tác."
        onConfirm={confirmDeleteMatch}
      />

      {/* ChatAI Dialog */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg h-[90vh] sm:h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                Chat với AI
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mr-2"
                  onClick={toggleVoiceSettings}
                  title="Cài đặt giọng nói"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                title={isSpeechEnabled ? "Tắt phát âm" : "Bật phát âm"}
              >
                {isSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Sử dụng API key mặc định hoặc nhập API key của bạn để trò chuyện với AI
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="useCustomKey"
              checked={useCustomApiKey}
              onCheckedChange={setUseCustomApiKey}
            />
            <Label htmlFor="useCustomKey" className="text-xs sm:text-sm">Sử dụng API key của riêng tôi</Label>
          </div>

          {useCustomApiKey && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="apiKey" className="text-xs sm:text-sm">API Key (Gemini API)</Label>
              <Input
                id="apiKey"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Nhập API key của bạn"
                type="password"
              />
            </div>
          )}

          {/* Chat history */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2 sm:pr-4 border rounded-md p-2 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-6 sm:py-8">
                    <Bot className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm">Hãy đặt câu hỏi để bắt đầu trò chuyện với AI.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`relative ${
                        msg.role === 'user'
                          ? 'bg-blue-100 ml-auto'
                          : msg.role === 'agent'
                            ? 'bg-purple-100 border border-purple-200'
                            : 'bg-gray-100'
                      } rounded-lg p-2 sm:p-3 max-w-[95%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div
                        className="whitespace-pre-line text-xs sm:text-sm"
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      />

                      {/* Emoji reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.values(msg.reactions).map((reaction) => (
                            <span
                              key={reaction.emoji}
                              className={cn(
                                "inline-flex items-center rounded-full border bg-white px-1.5 py-0.5 text-xs",
                                Date.now() - reaction.timestamp < 3000 && "animate-bounce"
                              )}
                              title={`${reaction.count} ${reaction.count > 1 ? 'reactions' : 'reaction'}`}
                            >
                              {reaction.emoji} {reaction.count > 1 && reaction.count}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add reaction button */}
                      <div className="absolute bottom-1 right-1">
                        <Popover open={showingEmojiFor === msg.id} onOpenChange={(open) => {
                          if (open) setShowingEmojiFor(msg.id);
                          else setShowingEmojiFor(null);
                        }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-full opacity-50 hover:opacity-100"
                            >
                              <Smile className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-1" align="end">
                            <div className="flex space-x-1">
                              {availableEmojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  className="hover:bg-muted p-1.5 sm:p-2 rounded-full transition-colors"
                                  onClick={() => addReaction(msg.id, emoji)}
                                >
                                  <span className="text-base sm:text-lg">{emoji}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="bg-gray-100 rounded-lg p-2 sm:p-3 max-w-[90%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Voice notification for chat dialog */}
          {showVoiceNotification && voiceNotification && (
            <div className="relative py-2">
              <div
                className="bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-lg text-xs sm:text-sm flex items-center"
                style={{
                  animation: "fadeInOut 3s ease-in-out forwards",
                }}
              >
                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-400" />
                <div dangerouslySetInnerHTML={{ __html: voiceNotification }}></div>
              </div>
            </div>
          )}

          {/* Translation Panel for Chat Dialog */}
          {showTranslationPanel && currentInputType === 'chat' && (
            <div className="border rounded-lg p-3 bg-gray-50 space-y-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Languages className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Dịch văn bản</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowTranslationPanel(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Từ ngôn ngữ</Label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {translationLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center">
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Sang ngôn ngữ</Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {translationLanguages.filter(lang => lang.code !== "auto").map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center">
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const textToTranslate = currentInputType === 'chat' ? chatDialogQuestion : aiQuestion;
                    if (textToTranslate.trim()) {
                      translateText(textToTranslate, sourceLanguage, targetLanguage);
                    }
                  }}
                  disabled={isTranslating || (!chatDialogQuestion.trim() && !aiQuestion.trim())}
                >
                  {isTranslating ? "Đang dịch..." : "Dịch"}
                </Button>
              </div>

              {translationError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {translationError}
                </div>
              )}

              {translatedText && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Kết quả dịch:</div>
                  <div className="bg-white p-2 rounded border text-sm">
                    {translatedText}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setChatDialogQuestion(translatedText);
                        setShowTranslationPanel(false);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Thay thế
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(translatedText);
                      }}
                    >
                      Sao chép
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input area */}
          <div className="mt-3 sm:mt-4 flex space-x-2">
            <div className="flex-grow relative">
              {isListening && (
                <div className="absolute -top-10 left-0 right-0 p-2 bg-blue-50 rounded-md text-blue-700 text-xs sm:text-sm italic">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-2"></div>
                    <span>Đang nghe: </span>
                  </div>
                  {interimTranscript ? interimTranscript + "..." : "Hãy nói vào microphone..."}
                </div>
              )}

              {/* Speech recognition error for dialog */}
              {recognitionError && !isListening && (
                <div className="absolute -top-10 left-0 right-0 p-2 bg-red-50 rounded-md text-red-700 text-xs sm:text-sm">
                  <div className="flex items-center">
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-500" />
                    {recognitionError}
                  </div>
                </div>
              )}

              <Textarea
                placeholder="Nhập câu hỏi của bạn (tối đa 1000 từ)"
              value={chatDialogQuestion}
                onChange={(e) => {
                  const text = e.target.value;
                  // Giới hạn số từ (~1000 từ)
                  const wordCount = text.trim().split(/\s+/).length;
                  if (wordCount <= 1000) {
                    setChatDialogQuestion(text);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    handleChatDialogQuestion();
                  } else if (e.key === "t" && e.ctrlKey) {
                    e.preventDefault();
                    setCurrentInputType('chat');
                    setShowTranslationPanel(!showTranslationPanel);
                  }
                }}
              disabled={isAiLoading}
                className={`min-h-[50px] sm:min-h-[60px] resize-y max-h-[100px] sm:max-h-[150px] text-xs sm:text-sm ${isListening ? "border-blue-300 focus-visible:ring-blue-400" : ""}`}
              />
              {chatDialogQuestion && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1 rounded z-10">
                  {chatDialogQuestion.trim().split(/\s+/).length}/1000 từ
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setCurrentInputType('chat');
                  setShowTranslationPanel(!showTranslationPanel);
                }}
                title="Dịch văn bản"
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button
                variant={isListening ? "secondary" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${isListening ? "bg-red-100 border-red-300 text-red-600" : ""}`}
                onClick={toggleListening}
              >
                <Mic className={`h-4 w-4 ${isListening ? "animate-pulse text-red-500" : ""}`} />
              </Button>
              <div className="text-[10px] sm:text-xs text-center text-gray-500">
                {isListening ? "Dừng" : "Nói"}
              </div>
            </div>
            <Button
              onClick={handleChatDialogQuestion}
              disabled={isAiLoading || !chatDialogQuestion.trim()}
              title="Ctrl+Enter để gửi"
              className="text-xs sm:text-sm"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Gửi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMatch?.id.includes("match-") ? "Thêm trận đấu mới" : "Chỉnh sửa trận đấu"}
            </DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="homeTeam" className="text-xs sm:text-sm">Đội nhà</Label>
                  <Input
                    id="homeTeam"
                    value={editingMatch.homeTeam}
                    onChange={(e) => setEditingMatch({ ...editingMatch, homeTeam: e.target.value })}
                    placeholder="Tên đội nhà"
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="awayTeam" className="text-xs sm:text-sm">Đội khách</Label>
                  <Input
                    id="awayTeam"
                    value={editingMatch.awayTeam}
                    onChange={(e) => setEditingMatch({ ...editingMatch, awayTeam: e.target.value })}
                    placeholder="Tên đội khách"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="date" className="text-xs sm:text-sm">Ngày thi đấu</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editingMatch.date}
                    onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="time" className="text-xs sm:text-sm">Giờ thi đấu</Label>
                  <Input
                    id="time"
                    type="time"
                    value={editingMatch.time}
                    onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="venue" className="text-xs sm:text-sm">Địa điểm</Label>
                <Input
                  id="venue"
                  value={editingMatch.venue}
                  onChange={(e) => setEditingMatch({ ...editingMatch, venue: e.target.value })}
                  placeholder="Sân vận động"
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="competition" className="text-xs sm:text-sm">Giải đấu</Label>
                <Select
                  value={editingMatch.competition}
                  onValueChange={(value) => setEditingMatch({ ...editingMatch, competition: value })}
                >
                  <SelectTrigger id="competition" className="text-xs sm:text-sm">
                    <SelectValue placeholder="Chọn giải đấu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V-League">V-League</SelectItem>
                    <SelectItem value="Cúp Quốc Gia">Cúp Quốc Gia</SelectItem>
                    <SelectItem value="AFC Champions League">AFC Champions League</SelectItem>
                    <SelectItem value="Giao hữu">Giao hữu</SelectItem>
                    <SelectItem value="Ngoại hạng Anh">Ngoại hạng Anh</SelectItem>
                    <SelectItem value="Champions League">Champions League</SelectItem>
                    <SelectItem value="World Cup">World Cup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="completed"
                  checked={editingMatch.completed}
                  onCheckedChange={(checked) => setEditingMatch({ ...editingMatch, completed: checked })}
                />
                <Label htmlFor="completed" className="text-xs sm:text-sm">Đã kết thúc</Label>
              </div>

              {editingMatch.completed && (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="homeScore" className="text-xs sm:text-sm">Bàn thắng đội nhà</Label>
                    <Input
                      id="homeScore"
                      type="number"
                      min={0}
                      value={editingMatch.homeScore || 0}
                      onChange={(e) =>
                        setEditingMatch({ ...editingMatch, homeScore: Number.parseInt(e.target.value) || 0 })
                      }
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="awayScore" className="text-xs sm:text-sm">Bàn thắng đội khách</Label>
                    <Input
                      id="awayScore"
                      type="number"
                      min={0}
                      value={editingMatch.awayScore || 0}
                      onChange={(e) =>
                        setEditingMatch({ ...editingMatch, awayScore: Number.parseInt(e.target.value) || 0 })
                      }
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={editingMatch.notes || ""}
                  onChange={(e) => setEditingMatch({ ...editingMatch, notes: e.target.value })}
                  placeholder="Thông tin thêm về trận đấu"
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs sm:text-sm">
                  Hủy
                </Button>
                <Button onClick={handleSaveMatch} className="text-xs sm:text-sm">Lưu</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Player Rating Dialog */}
      {ratingMatch && (
        <PlayerRating
          match={ratingMatch}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onSaveRatings={handleSaveRatings}
        />
      )}

      {/* Match Events Dialog */}
      {eventsMatch && (
        <MatchEvents
          match={eventsMatch}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          open={isEventsDialogOpen}
          onOpenChange={setIsEventsDialogOpen}
          onSaveEvents={handleSaveEvents}
        />
      )}

      {/* Voice Settings Dialog */}
      <Dialog open={isVoiceSettingsOpen} onOpenChange={setIsVoiceSettingsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-base sm:text-lg">
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Cài đặt giọng nói
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Điều chỉnh các tham số để có giọng nói dễ nghe nhất
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 text-xs sm:text-sm">
            {/* Auto Detect Language */}
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="auto-detect"
                checked={autoDetectLanguage}
                onCheckedChange={(checked) => {
                  setAutoDetectLanguage(checked);
                  // Khi bật auto detect, tự động chọn "auto" cho selectedLanguage
                  if (checked) {
                    setSelectedLanguage("auto");
                  }
                }}
              />
              <div>
                <Label htmlFor="auto-detect">Tự động nhận dạng ngôn ngữ</Label>
                <p className="text-sm text-gray-500">
                  Tự động phát hiện và sử dụng giọng nói phù hợp với ngôn ngữ văn bản
                </p>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center">
                <Globe className="h-4 w-4 mr-2" /> Ngôn ngữ đọc
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => {
                  setSelectedLanguage(value);

                  // When changing language, try to set a recommended voice
                  if (!autoDetectLanguage) {
                    const bestVoice = getBestVoiceForLanguage(value);
                    if (bestVoice) {
                      setSelectedVoice(bestVoice);
                    }
                  }
                }}
                disabled={autoDetectLanguage}
              >
                <SelectTrigger id="language" className={autoDetectLanguage ? "opacity-50" : ""}>
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="flex items-center">
                      <div className="flex items-center">
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {autoDetectLanguage && (
                <div className="text-xs text-blue-500 mt-1 flex items-center">
                  <span className="bg-blue-100 p-1 rounded-full mr-1">🔍</span>
                  Hệ thống sẽ tự động phát hiện và sử dụng ngôn ngữ phù hợp nhất
                </div>
              )}
            </div>

            {/* Speech Recognition Language */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <Label className="font-bold flex items-center text-base">
                <Mic className="h-4 w-4 mr-2" /> Nhận dạng giọng nói
              </Label>

              <div className="mt-2">
                <Label htmlFor="recognitionLanguage" className="flex items-center text-sm mb-1">
                  Ngôn ngữ nhận dạng
                </Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button
                    type="button"
                    variant={recognitionLang === "vi-VN" ? "default" : "outline"}
                    className="justify-start w-full"
                    onClick={() => setRecognitionLanguage("vi-VN")}
                  >
                    <span className="mr-2">🇻🇳</span> Tiếng Việt
                  </Button>
                  <Button
                    type="button"
                    variant={recognitionLang === "en-US" ? "default" : "outline"}
                    className="justify-start w-full"
                    onClick={() => setRecognitionLanguage("en-US")}
                  >
                    <span className="mr-2">🇺🇸</span> English
                  </Button>
                </div>

                <Select
                  value={recognitionLang}
                  onValueChange={(value) => setRecognitionLanguage(value)}
                >
                  <SelectTrigger id="recognitionLanguage">
                    <SelectValue placeholder="Chọn ngôn ngữ khác" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {supportedLanguages
                      .filter(lang => lang.code !== "auto" && lang.code !== "vi-VN" && lang.code !== "en-US")
                      .map((lang) => (
                        <SelectItem key={`recog-${lang.code}`} value={lang.code} className="flex items-center">
                          <div className="flex items-center">
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>

                <div className="text-xs text-gray-700 mt-2 border-l-2 border-blue-400 pl-2 py-1 bg-blue-50">
                  <p className="font-medium">Quan trọng:</p>
                  <p>Chọn đúng ngôn ngữ bạn đang nói để đạt độ chính xác cao nhất. Khi nói tiếng Việt, chọn Tiếng Việt. Khi nói tiếng Anh, chọn English.</p>
                </div>
              </div>

              {/* Test Voice Recognition Button */}
              <div className="flex mt-2">
                <Button
                  onClick={toggleListening}
                  variant={isListening ? "secondary" : "outline"}
                  className={`w-full ${isListening ? "bg-red-100 border-red-300 text-red-600" : ""}`}
                >
                  {isListening ? (
                    <>
                      <Mic className="h-4 w-4 mr-2 animate-pulse text-red-500" />
                      Đang nghe... (nhấn để dừng)
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Kiểm tra nhận dạng giọng nói
                    </>
                  )}
                </Button>
              </div>

              {/* Display recognition errors */}
              {recognitionError && !isListening && (
                <div className="p-2 bg-red-50 rounded-md text-red-700 text-sm mt-1">
                  <div className="flex items-center">
                    <Mic className="h-4 w-4 mr-2 text-red-500" />
                    {recognitionError}
                  </div>
                  <p className="text-xs mt-1 text-gray-500">
                    Mẹo: Hãy nói chậm và rõ ràng, kiểm tra microphone và đảm bảo trình duyệt đã được cấp quyền.
                  </p>
                </div>
              )}

              {isListening && (
                <div className="p-2 bg-blue-50 rounded-md text-blue-700 text-sm mt-1">
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-2"></div>
                    <span className="font-medium">Đang nghe...</span>
                  </div>
                  {interimTranscript ? interimTranscript : "Hãy nói vào microphone..."}
                </div>
              )}

              {transcript && (
                <div className="p-2 bg-gray-50 rounded-md text-gray-700 text-sm mt-1 border">
                  <p className="font-medium text-xs text-gray-500 mb-1">Kết quả nhận dạng:</p>
                  {transcript}
                  {transcript && (
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => {
                          if (showAiSidebar) {
                            setAiQuestion(transcript);
                          } else if (isChatDialogOpen) {
                            setChatDialogQuestion(transcript);
                          }
                          setTranscript("");
                        }}
                      >
                        Dùng kết quả này
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-red-600"
                        onClick={() => setTranscript("")}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice" className="flex items-center">
                <Mic className="h-4 w-4 mr-2" /> Chọn giọng nói
              </Label>
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                disabled={autoDetectLanguage}
              >
                <SelectTrigger id="voice" className={autoDetectLanguage ? "opacity-50" : ""}>
                  <SelectValue placeholder="Chọn giọng nói" />
                </SelectTrigger>
                <SelectContent>
                  {autoDetectLanguage ? (
                    <SelectItem value="auto">Tự động chọn giọng tốt nhất</SelectItem>
                  ) : (
                    <>
                      {/* Recommended voices section */}
                      {(supportedLanguages
                        .find(lang => lang.code === selectedLanguage)?.recommended?.length ?? 0) > 0 && (
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Giọng đề xuất
                        </div>
                      )}
                      {supportedLanguages
                        .find(lang => lang.code === selectedLanguage)?.recommended
                        ?.map(recommendedVoice => {
                          const voice = availableVoices.find(v => v.name === recommendedVoice);
                          if (!voice) return null;
                          return (
                            <SelectItem key={voice.name} value={voice.name} className="flex items-center">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 mr-2 text-yellow-500" />
                                {voice.name}
                              </div>
                            </SelectItem>
                          );
                        })}

                      {/* All available voices section */}
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Tất cả giọng đọc
                      </div>
                      {availableVoices
                        .filter(voice => voice.lang.includes(selectedLanguage.split('-')[0]))
                        .map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.name} {voice.localService ? "" : "(online)"}
                          </SelectItem>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {selectedVoice && !autoDetectLanguage && (
                <div className="text-xs text-muted-foreground mt-1">
                  {availableVoices.find(v => v.name === selectedVoice)?.localService
                    ? "Giọng cơ bản (offline)"
                    : "Giọng chất lượng cao (online)"}
                </div>
              )}
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="rate" className="flex items-center">
                  <Timer className="h-4 w-4 mr-2" /> Tốc độ nói
                </Label>
                <span className="text-sm text-gray-500">{speechRate.toFixed(1)}x</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Chậm</span>
                <Slider
                  id="rate"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[speechRate]}
                  onValueChange={values => setSpeechRate(values[0])}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 ml-2">Nhanh</span>
              </div>
            </div>

            {/* Speech Pitch */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="pitch" className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" /> Cao độ giọng
                </Label>
                <span className="text-sm text-gray-500">{speechPitch.toFixed(1)}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Thấp</span>
                <Slider
                  id="pitch"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[speechPitch]}
                  onValueChange={values => setSpeechPitch(values[0])}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 ml-2">Cao</span>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="volume" className="flex items-center">
                  <Volume className="h-4 w-4 mr-2" /> Âm lượng
                </Label>
                <span className="text-sm text-gray-500">{Math.round(speechVolume * 100)}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Nhỏ</span>
                <Slider
                  id="volume"
                  min={0}
                  max={1.0}
                  step={0.05}
                  value={[speechVolume]}
                  onValueChange={values => setSpeechVolume(values[0])}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 ml-2">Lớn</span>
              </div>
            </div>

            {/* Google TTS toggle */}
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="google-tts"
                checked={useGoogleTTS}
                onCheckedChange={setUseGoogleTTS}
              />
              <div>
                <Label htmlFor="google-tts">Giọng cao cấp Google TTS</Label>
                <p className="text-sm text-gray-500">
                  Sử dụng dịch vụ Google Cloud TTS chất lượng cao cho tiếng Nhật, Hàn, Trung, Thái
                </p>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => speakText("Xin chào, đây là giọng nói thử nghiệm. Bạn có nghe rõ không?")}
                className="w-full"
              >
                Kiểm tra tiếng Việt
              </Button>
              <Button
                onClick={() => speakText("Hello, this is a test voice. Can you hear me clearly? I'm speaking English and it's working perfectly.")}
                className="w-full"
                variant="outline"
              >
                Test English
              </Button>
            </div>

            {/* Language Detection Test Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <Label className="flex items-center">
                <Languages className="h-4 w-4 mr-2" /> Test phát hiện ngôn ngữ
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Bonjour, comment allez-vous? Je suis très heureux de vous parler en français.")}
                  className="justify-start text-xs"
                >
                  🇫🇷 Test Français
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Guten Tag, wie geht es Ihnen? Ich spreche sehr gerne Deutsch mit Ihnen.")}
                  className="justify-start text-xs"
                >
                  🇩🇪 Test Deutsch
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Hola, ¿cómo está usted? Me gusta mucho hablar español con usted.")}
                  className="justify-start text-xs"
                >
                  🇪🇸 Test Español
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Ciao, come stai? Mi piace molto parlare italiano con te.")}
                  className="justify-start text-xs"
                >
                  🇮🇹 Test Italiano
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Olá, como você está? Eu gosto muito de falar português com você.")}
                  className="justify-start text-xs"
                >
                  🇧🇷 Test Português
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Привет, как дела? Мне очень нравится говорить по-русски.")}
                  className="justify-start text-xs"
                >
                  🇷🇺 Test Русский
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("สวัสดีครับ ผมชื่อ AI ผมพูดภาษาไทยได้ครับ")}
                  className="justify-start text-xs"
                >
                  🇹🇭 Test ไทย
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Saya bisa berbahasa Indonesia dengan baik. Terima kasih sudah menggunakan sistem ini.")}
                  className="justify-start text-xs"
                >
                  🇮🇩 Test Indonesia
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Saya boleh bercakap bahasa Malaysia dengan baik. Terima kasih kerana menggunakan sistem ini.")}
                  className="justify-start text-xs"
                >
                  🇲🇾 Test Malaysia
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Dzień dobry, bardzo lubię mówić po polsku. To jest test języka polskiego.")}
                  className="justify-start text-xs"
                >
                  🇵🇱 Test Polski
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Kumusta ka? Ako ay masaya na makausap ka sa Filipino. Salamat sa paggamit ng sistema na ito.")}
                  className="justify-start text-xs"
                >
                  🇵🇭 Test Filipino
                </Button>
              </div>
            </div>

            {/* Voice presets for quick selection */}
            <div className="space-y-2 pt-2">
              <Label className="flex items-center">
                <Bookmark className="h-4 w-4 mr-2" /> Cấu hình nhanh
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLanguage("vi-VN");
                    setSelectedVoice(getBestVoiceForLanguage("vi-VN") || "");
                    setSpeechRate(1.0);
                    setSpeechPitch(1.0);
                  }}
                  className="justify-start"
                >
                  <span className="mr-2">🇻🇳</span> Tiếng Việt - Nam
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLanguage("vi-VN");
                    setSelectedVoice("Microsoft HoaiMy Online");
                    setSpeechRate(1.0);
                    setSpeechPitch(1.2);
                  }}
                  className="justify-start"
                >
                  <span className="mr-2">🇻🇳</span> Tiếng Việt - Nữ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLanguage("en-US");
                    setSelectedVoice(getBestVoiceForLanguage("en-US") || "");
                    setSpeechRate(0.9);
                    setSpeechPitch(1.0);
                  }}
                  className="justify-start"
                >
                  <span className="mr-2">🇺🇸</span> English - Male
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLanguage("en-US");
                    setSelectedVoice("Microsoft Aria Online");
                    setSpeechRate(0.9);
                    setSpeechPitch(1.1);
                  }}
                  className="justify-start"
                >
                  <span className="mr-2">🇺🇸</span> English - Female
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice notification */}
      {showVoiceNotification && voiceNotification && (
        <div className="fixed top-4 sm:top-16 right-2 sm:right-4 left-2 sm:left-4 z-20">
          <div
            className="bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-lg text-xs sm:text-sm flex items-center"
            style={{
              animation: "fadeInOut 3s ease-in-out forwards",
            }}
          >
            <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-400" />
            <div dangerouslySetInnerHTML={{ __html: voiceNotification }}></div>
          </div>
        </div>
      )}
    </div>
  )
}
