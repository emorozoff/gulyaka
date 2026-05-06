import { useSyncExternalStore } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { routes } from './data/routes';

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

function getHash() {
  return window.location.hash;
}

export function App() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  const match = /^#route\/([\w-]+)$/.exec(hash);

  if (match) {
    const route = routes.find((r) => r.id === match[1]);
    if (route) return <MapScreen route={route} />;
    window.location.hash = '';
    return null;
  }

  return <HomeScreen />;
}
