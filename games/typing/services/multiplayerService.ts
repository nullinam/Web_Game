import type * as YType from 'yjs';
import type { WebrtcProvider as WebrtcProviderType } from 'y-webrtc';
import type { Language, LessonMode } from '../types';

export interface MultiplayerPlayer {
  id: number;
  name: string;
  progress: number; // 0 to 100
  wpm: number;
  score: number;
  isFinished: boolean;
  color: string;
}

/** Everything a peer needs to generate the exact same race as the host. */
export interface MatchSettings {
  seed: number;
  language: Language;
  lessonMode: LessonMode;
}

interface MultiplayerSession {
  ydoc: YType.Doc;
  provider: WebrtcProviderType;
  roomId: string;
}

type PlayersListener = (players: MultiplayerPlayer[]) => void;

// Signaling servers only introduce peers to each other; game data flows peer-to-peer.
// Configure with VITE_SIGNALING_URLS="wss://a.example,wss://b.example" at build time.
const SIGNALING_URLS = (import.meta.env.VITE_SIGNALING_URLS ?? '')
  .split(',')
  .map((url: string) => url.trim())
  .filter(Boolean);

// No 0/O or 1/I so codes can be read aloud and typed without ambiguity
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_ID_LENGTH = 6;

const PLAYER_COLORS = ['#06b6d4', '#c084fc', '#f43f5e', '#fbbf24', '#34d399', '#3b82f6'];

export const normalizeName = (name: string) => name.toUpperCase().trim().slice(0, 3) || 'PNK';

class MultiplayerService {
  private session: MultiplayerSession | null = null;
  private players: MultiplayerPlayer[] = [];
  private listeners = new Set<PlayersListener>();
  // Bumped on every init/cleanup so a slow init can tell it has been superseded
  private generation = 0;

  public readonly isAvailable = SIGNALING_URLS.length > 0;

  public generateRoomId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(ROOM_ID_LENGTH));
    return Array.from(bytes, b => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join('');
  }

  public isValidRoomId(roomId: string): boolean {
    return roomId.length === ROOM_ID_LENGTH && [...roomId].every(c => ROOM_ALPHABET.includes(c));
  }

  public getSession() {
    return this.session;
  }

  public getLocalId(): number | null {
    return this.session?.provider.awareness.clientID ?? null;
  }

  public getPlayers(): MultiplayerPlayer[] {
    return this.players;
  }

  /** Subscribes to player list changes; the listener is called immediately with the current list. */
  public subscribe(listener: PlayersListener): () => void {
    this.listeners.add(listener);
    listener(this.players);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async initSession(roomId: string, playerName: string, onMatchStart: (settings: MatchSettings) => void) {
    this.cleanup();
    const generation = this.generation;

    const [Y, { WebrtcProvider }] = await Promise.all([import('yjs'), import('y-webrtc')]);
    if (generation !== this.generation) return;

    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(`penko-typing:${roomId}`, ydoc, {
      signaling: SIGNALING_URLS,
      // Encrypts everything relayed through the (untrusted) signaling servers
      password: roomId,
      filterBcConns: true,
    });

    const awareness = provider.awareness;
    awareness.setLocalStateField('user', {
      name: normalizeName(playerName),
      progress: 0,
      wpm: 0,
      score: 0,
      isFinished: false,
      // Derived from the peer id so two players rarely share a colour
      color: PLAYER_COLORS[awareness.clientID % PLAYER_COLORS.length],
    });

    awareness.on('change', () => {
      this.players = Array.from(awareness.getStates().entries())
        .filter(([, state]) => state?.user)
        .map(([clientId, state]) => ({
          id: clientId,
          name: state.user.name,
          progress: state.user.progress || 0,
          wpm: state.user.wpm || 0,
          score: state.user.score || 0,
          isFinished: state.user.isFinished || false,
          color: state.user.color || PLAYER_COLORS[0],
        }));
      this.listeners.forEach(listener => listener(this.players));
    });

    // The host writes the match settings once; every peer (host included) starts on that change
    const control = ydoc.getMap<MatchSettings>('control');
    let startedSeed: number | null = null;
    control.observe(() => {
      const match = control.get('match');
      if (match && match.seed !== startedSeed) {
        startedSeed = match.seed;
        onMatchStart(match);
      }
    });

    this.session = { ydoc, provider, roomId };
    this.players = [];
  }

  public setPlayerName(name: string) {
    this.updateLocalUser({ name: normalizeName(name) });
  }

  public updateLocalProgress(progress: number, wpm: number, score: number, isFinished: boolean) {
    this.updateLocalUser({ progress, wpm, score, isFinished });
  }

  public startMatch(language: Language, lessonMode: LessonMode) {
    if (!this.session) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    this.session.ydoc.getMap<MatchSettings>('control').set('match', { seed, language, lessonMode });
  }

  public cleanup() {
    this.generation++;
    if (this.session) {
      try {
        this.session.provider.destroy();
        this.session.ydoc.destroy();
      } catch (e) {
        console.error('Failed to cleanup WebRTC connection', e);
      }
      this.session = null;
    }
    this.players = [];
    this.listeners.forEach(listener => listener(this.players));
  }

  private updateLocalUser(fields: Partial<Omit<MultiplayerPlayer, 'id'>>) {
    if (!this.session) return;
    const awareness = this.session.provider.awareness;
    const current = awareness.getLocalState();
    if (current?.user) {
      awareness.setLocalStateField('user', { ...current.user, ...fields });
    }
  }
}

export const multiplayerService = new MultiplayerService();
export default multiplayerService;
