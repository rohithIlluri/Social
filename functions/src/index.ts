/**
 * FriendCatcher Cloud Functions - Privacy-First
 *
 * Only cleanup functions - no data persistence.
 * All user data is ephemeral and auto-deleted.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin
initializeApp();

const rtdb = getDatabase();

/**
 * Cleanup all inactive/stale ephemeral data every 5 minutes
 * - Removes stale locations (inactive for 5+ minutes)
 * - Removes inactive encounters (no connected participants)
 * - Removes orphaned chats
 */
export const cleanupInactiveData = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'us-central1',
    timeoutSeconds: 120,
  },
  async () => {
    logger.info('Starting ephemeral data cleanup');

    const cutoffTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    const updates: Record<string, null> = {};

    let locationsRemoved = 0;
    let encountersRemoved = 0;

    try {
      // 1. Cleanup stale locations
      const locationsSnapshot = await rtdb.ref('locations').once('value');

      if (locationsSnapshot.exists()) {
        const locations = locationsSnapshot.val() as Record<
          string,
          Record<string, { timestamp: number; active: boolean }>
        >;

        for (const [geohash, users] of Object.entries(locations)) {
          if (!users) continue;

          for (const [userId, locationData] of Object.entries(users)) {
            const isStale = locationData.timestamp < cutoffTime;
            const isInactive = locationData.active === false;

            if (isStale || isInactive) {
              updates[`locations/${geohash}/${userId}`] = null;
              locationsRemoved++;
            }
          }
        }
      }

      // 2. Cleanup inactive encounters and their chats
      const encountersSnapshot = await rtdb.ref('encounters').once('value');

      if (encountersSnapshot.exists()) {
        const encounters = encountersSnapshot.val() as Record<
          string,
          {
            active: boolean;
            startedAt: number;
            participants?: Record<string, { connected: boolean }>;
          }
        >;

        for (const [encounterId, encounter] of Object.entries(encounters)) {
          if (!encounter) continue;

          // Check if any participant is still connected
          const hasConnectedParticipant =
            encounter.participants &&
            Object.values(encounter.participants).some((p) => p.connected);

          const isStale = encounter.startedAt < cutoffTime;

          // Remove if inactive, no connected participants, or stale
          if (!encounter.active || !hasConnectedParticipant || isStale) {
            updates[`encounters/${encounterId}`] = null;
            updates[`chats/${encounterId}`] = null; // Also remove associated chat
            encountersRemoved++;
          }
        }
      }

      // 3. Cleanup orphaned chats (chat exists but no encounter)
      const chatsSnapshot = await rtdb.ref('chats').once('value');

      if (chatsSnapshot.exists()) {
        const chats = chatsSnapshot.val() as Record<string, unknown>;
        const encounterIds = new Set(
          encountersSnapshot.exists()
            ? Object.keys(encountersSnapshot.val() || {})
            : []
        );

        for (const chatId of Object.keys(chats)) {
          // If chat's encounter doesn't exist and not already marked for removal
          if (!encounterIds.has(chatId) && !updates[`chats/${chatId}`]) {
            updates[`chats/${chatId}`] = null;
          }
        }
      }

      // Apply all updates atomically
      if (Object.keys(updates).length > 0) {
        await rtdb.ref().update(updates);
      }

      logger.info('Ephemeral cleanup complete', {
        locationsRemoved,
        encountersRemoved,
        totalUpdates: Object.keys(updates).length,
        cutoffTime: new Date(cutoffTime).toISOString(),
      });
    } catch (error) {
      logger.error('Cleanup failed', { error });
      throw error;
    }
  }
);
