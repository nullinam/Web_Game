import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { multiplayerService, MultiplayerPlayer, MatchSettings, ROOM_ID_LENGTH } from '../services/multiplayerService';
import { InterfaceLanguage, Language, LessonMode } from '../types';
import { UI_STRINGS } from '../constants';

interface MultiplayerDialogProps {
  uiLanguage: InterfaceLanguage;
  language: Language;
  lessonMode: LessonMode;
  playerName: string;
  initialRoomId?: string; // From a shared ?room= link: open on the join tab and connect immediately
  onPlayerNameChange: (name: string) => void;
  onClose: () => void;
  onMatchStart: (settings: MatchSettings) => void;
}

type MpStrings = {
  host: string; join: string; joinButton: string; roomId: string; enterRoomId: string; playerName: string;
  connected: string; scan: string; cancel: string; start: string; close: string;
  waitingHost: string; waitingPlayers: string; shareHint: string; cameraError: string; invalidCode: string;
};

const LOCALIZED_MP: Record<InterfaceLanguage, MpStrings> = {
  [InterfaceLanguage.ENGLISH]: {
    host: "HOST MATCH", join: "JOIN MATCH", joinButton: "JOIN", roomId: "ROOM CODE", enterRoomId: "CODE",
    playerName: "PLAYER INITIALS", connected: "CONNECTED PLAYERS", scan: "SCAN QR CODE", cancel: "CANCEL",
    start: "START DUEL", close: "CLOSE", waitingHost: "WAITING FOR HOST TO START...",
    waitingPlayers: "WAITING FOR PLAYERS TO JOIN...", shareHint: "Share the code or let a friend scan the QR code.",
    cameraError: "Camera unavailable. Type the code instead.", invalidCode: "Codes are 6 letters/numbers."
  },
  [InterfaceLanguage.SPANISH]: {
    host: "CREAR PARTIDA", join: "UNIRSE", joinButton: "UNIRSE", roomId: "CÓDIGO DE SALA", enterRoomId: "CÓDIGO",
    playerName: "INICIALES", connected: "JUGADORES CONECTADOS", scan: "ESCANEAR QR", cancel: "CANCELAR",
    start: "INICIAR DUELO", close: "CERRAR", waitingHost: "ESPERANDO AL ANFITRIÓN...",
    waitingPlayers: "ESPERANDO JUGADORES...", shareHint: "Comparte el código o deja que escaneen el QR.",
    cameraError: "Cámara no disponible. Escribe el código.", invalidCode: "El código tiene 6 caracteres."
  },
  [InterfaceLanguage.FRENCH]: {
    host: "CRÉER", join: "REJOINDRE", joinButton: "REJOINDRE", roomId: "CODE DU SALON", enterRoomId: "CODE",
    playerName: "INITIALES", connected: "JOUEURS CONNECTÉS", scan: "SCANNER LE QR", cancel: "ANNULER",
    start: "LANCER LE DUEL", close: "FERMER", waitingHost: "EN ATTENTE DE L'HÔTE...",
    waitingPlayers: "EN ATTENTE DE JOUEURS...", shareHint: "Partagez le code ou faites scanner le QR.",
    cameraError: "Caméra indisponible. Saisissez le code.", invalidCode: "Le code fait 6 caractères."
  },
  [InterfaceLanguage.GERMAN]: {
    host: "SPIEL ERSTELLEN", join: "BEITRETEN", joinButton: "BEITRETEN", roomId: "RAUMCODE", enterRoomId: "CODE",
    playerName: "INITIALEN", connected: "VERBUNDENE SPIELER", scan: "QR SCANNEN", cancel: "ABBRECHEN",
    start: "DUELL STARTEN", close: "SCHLIESSEN", waitingHost: "WARTE AUF DEN HOST...",
    waitingPlayers: "WARTE AUF SPIELER...", shareHint: "Teile den Code oder lass den QR-Code scannen.",
    cameraError: "Kamera nicht verfügbar. Code eintippen.", invalidCode: "Der Code hat 6 Zeichen."
  },
  [InterfaceLanguage.ITALIAN]: {
    host: "CREA PARTITA", join: "UNISCITI", joinButton: "ENTRA", roomId: "CODICE STANZA", enterRoomId: "CODICE",
    playerName: "INIZIALI", connected: "GIOCATORI CONNESSI", scan: "SCANSIONA QR", cancel: "ANNULLA",
    start: "INIZIA DUELLO", close: "CHIUDI", waitingHost: "IN ATTESA DELL'HOST...",
    waitingPlayers: "IN ATTESA DI GIOCATORI...", shareHint: "Condividi il codice o fai scansionare il QR.",
    cameraError: "Fotocamera non disponibile. Digita il codice.", invalidCode: "Il codice ha 6 caratteri."
  },
  [InterfaceLanguage.PORTUGUESE]: {
    host: "CRIAR PARTIDA", join: "ENTRAR", joinButton: "ENTRAR", roomId: "CÓDIGO DA SALA", enterRoomId: "CÓDIGO",
    playerName: "INICIAIS", connected: "JOGADORES CONECTADOS", scan: "LER QR CODE", cancel: "CANCELAR",
    start: "INICIAR DUELO", close: "FECHAR", waitingHost: "AGUARDANDO O ANFITRIÃO...",
    waitingPlayers: "AGUARDANDO JOGADORES...", shareHint: "Compartilhe o código ou deixe escanear o QR.",
    cameraError: "Câmera indisponível. Digite o código.", invalidCode: "O código tem 6 caracteres."
  },
  [InterfaceLanguage.RUSSIAN]: {
    host: "СОЗДАТЬ", join: "ПРИСОЕДИНИТЬСЯ", joinButton: "ВОЙТИ", roomId: "КОД КОМНАТЫ", enterRoomId: "КОД",
    playerName: "ИНИЦИАЛЫ", connected: "ИГРОКИ", scan: "СКАНИРОВАТЬ QR", cancel: "ОТМЕНА",
    start: "НАЧАТЬ ДУЭЛЬ", close: "ЗАКРЫТЬ", waitingHost: "ЖДЁМ ХОСТА...",
    waitingPlayers: "ЖДЁМ ИГРОКОВ...", shareHint: "Поделитесь кодом или дайте отсканировать QR.",
    cameraError: "Камера недоступна. Введите код.", invalidCode: "Код состоит из 6 символов."
  },
  [InterfaceLanguage.KOREAN]: {
    host: "방 만들기", join: "참가하기", joinButton: "참가", roomId: "방 코드", enterRoomId: "코드",
    playerName: "이니셜", connected: "접속한 플레이어", scan: "QR 스캔", cancel: "취소",
    start: "대결 시작", close: "닫기", waitingHost: "호스트가 시작하기를 기다리는 중...",
    waitingPlayers: "플레이어를 기다리는 중...", shareHint: "코드를 공유하거나 QR 코드를 스캔하게 하세요.",
    cameraError: "카메라를 사용할 수 없습니다. 코드를 입력하세요.", invalidCode: "코드는 6자리입니다."
  },
  [InterfaceLanguage.JAPANESE]: {
    host: "部屋を作る", join: "参加する", joinButton: "参加", roomId: "ルームコード", enterRoomId: "コード",
    playerName: "イニシャル", connected: "接続中のプレイヤー", scan: "QRをスキャン", cancel: "キャンセル",
    start: "対戦開始", close: "閉じる", waitingHost: "ホストの開始を待っています...",
    waitingPlayers: "プレイヤーを待っています...", shareHint: "コードを共有するか、QRを読み取ってもらいましょう。",
    cameraError: "カメラが使えません。コードを入力してください。", invalidCode: "コードは6文字です。"
  },
  [InterfaceLanguage.CHINESE]: {
    host: "创建房间", join: "加入房间", joinButton: "加入", roomId: "房间代码", enterRoomId: "代码",
    playerName: "玩家缩写", connected: "已连接玩家", scan: "扫描二维码", cancel: "取消",
    start: "开始对战", close: "关闭", waitingHost: "等待房主开始...",
    waitingPlayers: "等待玩家加入...", shareHint: "分享代码或让朋友扫描二维码。",
    cameraError: "无法使用相机，请输入代码。", invalidCode: "代码为 6 位。"
  },
  [InterfaceLanguage.ARABIC]: {
    host: "إنشاء مباراة", join: "انضمام", joinButton: "انضم", roomId: "رمز الغرفة", enterRoomId: "الرمز",
    playerName: "الأحرف الأولى", connected: "اللاعبون المتصلون", scan: "مسح رمز QR", cancel: "إلغاء",
    start: "ابدأ المبارزة", close: "إغلاق", waitingHost: "في انتظار المضيف...",
    waitingPlayers: "في انتظار اللاعبين...", shareHint: "شارك الرمز أو دع صديقك يمسح رمز QR.",
    cameraError: "الكاميرا غير متاحة. اكتب الرمز.", invalidCode: "الرمز مكون من 6 أحرف."
  },
  [InterfaceLanguage.HEBREW]: {
    host: "צור משחק", join: "הצטרף", joinButton: "הצטרף", roomId: "קוד חדר", enterRoomId: "קוד",
    playerName: "ראשי תיבות", connected: "שחקנים מחוברים", scan: "סרוק QR", cancel: "ביטול",
    start: "התחל דו-קרב", close: "סגור", waitingHost: "ממתין למארח...",
    waitingPlayers: "ממתין לשחקנים...", shareHint: "שתף את הקוד או תן לחבר לסרוק את ה-QR.",
    cameraError: "המצלמה אינה זמינה. הקלד את הקוד.", invalidCode: "הקוד בן 6 תווים."
  }
};

const cleanRoomId = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_ID_LENGTH);

export const MultiplayerDialog: React.FC<MultiplayerDialogProps> = ({
  uiLanguage,
  language,
  lessonMode,
  playerName,
  initialRoomId,
  onPlayerNameChange,
  onClose,
  onMatchStart
}) => {
  const t = LOCALIZED_MP[uiLanguage];
  const ui = UI_STRINGS[uiLanguage];
  const isRTL = uiLanguage === InterfaceLanguage.ARABIC || uiLanguage === InterfaceLanguage.HEBREW;

  const [activeTab, setActiveTab] = useState<'host' | 'join'>(initialRoomId ? 'join' : 'host');
  const [hostRoomId, setHostRoomId] = useState('');
  const [joinInput, setJoinInput] = useState(initialRoomId ? cleanRoomId(initialRoomId) : '');
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [scanActive, setScanActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The session is created once per room; keep the latest callbacks/name without re-creating it
  const onMatchStartRef = useRef(onMatchStart);
  onMatchStartRef.current = onMatchStart;
  const nameRef = useRef(playerName);
  nameRef.current = playerName;

  const connect = (roomId: string) => {
    multiplayerService.initSession(roomId, nameRef.current, settings => onMatchStartRef.current(settings));
  };

  useEffect(() => multiplayerService.subscribe(setPlayers), []);

  // Host: one room per visit to the host tab
  useEffect(() => {
    if (activeTab !== 'host') return;
    const generated = multiplayerService.generateRoomId();
    setHostRoomId(generated);
    setQrUrl('');
    connect(generated);

    const joinLink = `${window.location.origin}${window.location.pathname}?room=${generated}`;
    QRCode.toDataURL(joinLink, { margin: 2, scale: 5 })
      .then(setQrUrl)
      .catch(err => console.error(err));
    // No cleanup here: the session must outlive this dialog once the match starts.
    // Closing the dialog or switching tabs tears it down instead.
  }, [activeTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Join: auto-connect when opened from a shared link
  useEffect(() => {
    if (initialRoomId && multiplayerService.isValidRoomId(cleanRoomId(initialRoomId))) {
      joinRoom(cleanRoomId(initialRoomId));
    }
  }, []);

  // Name changes update the live session instead of reconnecting
  useEffect(() => {
    multiplayerService.setPlayerName(playerName);
  }, [playerName]);

  const joinRoom = (roomId: string) => {
    if (!multiplayerService.isValidRoomId(roomId)) {
      setError(t.invalidCode);
      return;
    }
    setError(null);
    setJoinInput(roomId);
    setJoinedRoomId(roomId);
    connect(roomId);
  };

  const switchTab = (tab: 'host' | 'join') => {
    if (tab === activeTab) return;
    setScanActive(false);
    setError(null);
    setJoinedRoomId(null);
    multiplayerService.cleanup();
    setActiveTab(tab);
  };

  // QR camera scanning: runs while the <video> is mounted
  useEffect(() => {
    if (!scanActive) return;
    let active = true;
    let frame = 0;
    let stream: MediaStream | null = null;

    const scanFrame = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });

      if (video && canvas && ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code) {
          // Accept a full join link (…?room=ABC123) or a bare code
          let scanned = code.data;
          try {
            scanned = new URL(code.data).searchParams.get('room') ?? code.data;
          } catch {
            // Not a URL; treat as a bare code
          }
          const roomId = cleanRoomId(scanned);
          if (multiplayerService.isValidRoomId(roomId)) {
            setScanActive(false);
            joinRoom(roomId);
            return;
          }
        }
      }
      frame = requestAnimationFrame(scanFrame);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.cameraError);
      setScanActive(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        if (!active || !videoRef.current) {
          s.getTracks().forEach(track => track.stop());
          return;
        }
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
        frame = requestAnimationFrame(scanFrame);
      })
      .catch(err => {
        console.error('Camera access failed', err);
        if (active) {
          setError(t.cameraError);
          setScanActive(false);
        }
      });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [scanActive]);

  const handleStartDuel = () => {
    multiplayerService.startMatch(language, lessonMode);
  };

  const canStart = players.length >= 2;
  const inRoom = activeTab === 'host' || joinedRoomId !== null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-xl p-4 sm:p-6 rounded-2xl border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.25)] flex flex-col max-h-[calc(100dvh-1.5rem)] overflow-y-auto custom-scrollbar"
        dir={isRTL ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp-title"
        onClick={e => e.stopPropagation()}
      >

        {/* Title */}
        <h2 id="mp-title" className="text-center font-retro text-base sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-cyan-500 glow-text mb-4 sm:mb-6 leading-relaxed">
          {ui.multiplayer}
        </h2>

        {/* Local Name Input */}
        <div className="mb-4">
          <label htmlFor="mp-name" className="block text-cyan-400 font-retro text-[9px] uppercase tracking-wider mb-2">{t.playerName}</label>
          <input
            id="mp-name"
            type="text"
            maxLength={3}
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value.toUpperCase().trim())}
            className="w-full bg-slate-900 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-center text-lg sm:text-xl font-retro text-amber-400 focus:outline-none focus:border-cyan-500 uppercase"
            placeholder="PNK"
            autoComplete="off"
          />
        </div>

        {/* Host/Join Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-6">
          {(['host', 'join'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`py-3 px-1 font-retro text-[10px] sm:text-xs rounded-xl border transition ${
                activeTab === tab
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-900 border-slate-800 text-cyan-400 hover:text-white'
              }`}
            >
              {tab === 'host' ? t.host : t.join}
            </button>
          ))}
        </div>

        {/* HOST PANEL */}
        {activeTab === 'host' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-slate-950/60 p-3 sm:p-4 border border-cyan-500/10 rounded-xl text-center w-full">
              <span className="text-[10px] font-retro text-slate-500 block mb-2">{t.roomId}</span>
              <span className="text-2xl sm:text-4xl font-retro text-cyan-400 font-bold tracking-widest select-all" dir="ltr">{hostRoomId}</span>
            </div>

            {qrUrl && (
              <div className="p-2 sm:p-3 bg-white rounded-xl border-4 border-cyan-500 shadow-lg">
                <img src={qrUrl} alt={`${t.roomId} ${hostRoomId}`} className="w-32 h-32 sm:w-40 sm:h-40" />
              </div>
            )}
            <p className="text-slate-400 text-base text-center">{t.shareHint}</p>
          </div>
        )}

        {/* JOIN PANEL */}
        {activeTab === 'join' && (
          <div className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                joinRoom(cleanRoomId(joinInput));
              }}
            >
              <input
                type="text"
                maxLength={ROOM_ID_LENGTH}
                value={joinInput}
                onChange={(e) => setJoinInput(cleanRoomId(e.target.value))}
                className="flex-1 min-w-0 bg-slate-900 border border-cyan-500/20 rounded-xl px-3 py-3 text-center text-lg sm:text-2xl font-retro text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase tracking-widest placeholder:text-slate-600 placeholder:text-sm"
                placeholder={t.enterRoomId}
                aria-label={t.enterRoomId}
                autoComplete="off"
                autoCapitalize="characters"
                dir="ltr"
              />
              <button
                type="submit"
                className="flex-none px-4 sm:px-6 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-retro text-[10px] sm:text-xs rounded-xl border border-cyan-400 transition"
              >
                {t.joinButton}
              </button>
            </form>

            {/* QR Scanner Trigger */}
            <div className="flex flex-col items-center">
              {!scanActive ? (
                <button
                  onClick={() => {
                    setError(null);
                    setScanActive(true);
                  }}
                  className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 font-retro text-[10px] sm:text-xs rounded-xl transition"
                >
                  📷 {t.scan}
                </button>
              ) : (
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-cyan-500/30">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={() => setScanActive(false)}
                    className="absolute top-2 right-2 bg-red-600/80 text-white px-3 py-1 rounded text-sm"
                  >
                    {t.cancel}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-center text-red-400 text-lg" role="alert">{error}</p>
        )}

        {/* CONNECTION STATUS + PEERS */}
        {inRoom && (
          <div className="mt-4 sm:mt-6 border-t border-cyan-500/10 pt-4 sm:pt-6">
            <p className="text-center text-amber-400/90 font-retro text-[9px] leading-relaxed mb-3 animate-pulse">
              {activeTab === 'host'
                ? (canStart ? '' : t.waitingPlayers)
                : t.waitingHost}
            </p>
            {players.length > 0 && (
              <>
                <h4 className="font-retro text-[10px] text-slate-500 uppercase tracking-wider mb-3">
                  {t.connected} ({players.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {players.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-950/40 border border-slate-900 rounded-lg">
                      <div className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: p.color }} />
                      <span className="font-retro text-xs text-slate-200">
                        {p.name}{p.id === multiplayerService.getLocalId() ? ` (${ui.you})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* CONTROL ACTIONS */}
        <div className="mt-4 sm:mt-6 flex gap-3 sm:gap-4 pt-4 border-t border-cyan-500/10">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 font-retro text-[10px] sm:text-xs rounded-xl transition"
          >
            {t.close}
          </button>

          {activeTab === 'host' && (
            <button
              onClick={handleStartDuel}
              disabled={!canStart}
              className={`flex-1 py-3.5 font-retro text-[10px] sm:text-xs rounded-xl transition ${
                canStart
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-400'
                  : 'bg-slate-800 text-slate-600 border border-transparent cursor-not-allowed'
              }`}
            >
              {t.start}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default MultiplayerDialog;
