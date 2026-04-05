export const APP_NAME = 'Soundwave';
export const API_URL = 'https://your-api.com';

export interface Song {
  id: string;
  title: string;
  artist: string;
}

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
