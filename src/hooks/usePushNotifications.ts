import { useState, useEffect } from 'react';
import {
  isPushSupported,
  requestAndSubscribe,
  getSubscriptionState,
} from '../services/notifications';

type State = 'granted' | 'denied' | 'default' | 'unsupported' | 'loading';

export function usePushNotifications() {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    if (!isPushSupported()) {
      setState('unsupported');
      return;
    }
    getSubscriptionState().then(setState);
  }, []);

  async function subscribe() {
    setState('loading');
    const result = await requestAndSubscribe();
    setState(result === 'unsupported' ? 'unsupported' : result);
  }

  return { state, subscribe };
}
