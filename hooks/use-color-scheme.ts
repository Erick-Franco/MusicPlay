import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' | null {
  const scheme = useRNColorScheme();
  if (scheme === 'dark' || scheme === 'light') return scheme;
  return null;
}
