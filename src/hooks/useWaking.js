import { useSyncExternalStore } from 'react';
import { isWaking, subscribeWaking } from '../api/axios.js';

/** True while a request is stalled on a Render cold start. */
export const useWaking = () => useSyncExternalStore(subscribeWaking, isWaking, () => false);
