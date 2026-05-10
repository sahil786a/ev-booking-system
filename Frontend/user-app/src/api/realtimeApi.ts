/**
 * Optional WebSocket channel for live availability & booking updates.
 * Requires backend Phase 2 endpoint.
 */
export type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export function createRealtimeClientPlaceholder(): {
  connect: () => void;
  disconnect: () => void;
  state: RealtimeConnectionState;
} {
  // Requires backend Phase 2 endpoint (WebSocket / SSE contract).
  return {
    connect: () => undefined,
    disconnect: () => undefined,
    state: 'idle',
  };
}
