export type SoundProfile = 'off';

// Sound is intentionally disabled in the integrated game hub.
class AudioService {
  public setProfile(_profile: SoundProfile) {}
  public getProfile(): SoundProfile { return 'off'; }
  public playKey() {}
  public playSuccess() {}
  public playError() {}
}

export const audioService = new AudioService();
export default audioService;
