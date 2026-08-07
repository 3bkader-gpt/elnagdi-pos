import { executeSql } from './db.js'

let syncInterval = null
let isSyncing = false

export function startDesktopSyncAgent(serverUrl = 'https://elnagdi-cloud-sync-worker.workers.dev') {
  if (syncInterval) clearInterval(syncInterval)

  console.log('[Sync Agent] Starting POS Desktop Cloud Sync Agent...')

  // Run sync every 15 seconds
  syncInterval = setInterval(async () => {
    if (isSyncing) return
    isSyncing = true
    try {
      await processPendingSyncQueue(serverUrl)
    } catch (err) {
      console.error('[Sync Agent] Error during sync cycle:', err.message)
    } finally {
      isSyncing = false
    }
  }, 15000)
}

export function stopDesktopSyncAgent() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('[Sync Agent] Stopped POS Desktop Cloud Sync Agent.')
  }
}

async function processPendingSyncQueue(serverUrl) {
  // Query up to 50 pending queue items
  const pendingItems = await executeSql(`
    SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC LIMIT 50;
  `)

  if (!pendingItems || pendingItems.length === 0) {
    return
  }

  console.log(`[Sync Agent] Found ${pendingItems.length} pending items to upload.`)

  try {
    const response = await fetch(`${serverUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: pendingItems }),
    })

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`)
    }

    const data = await response.json()
    if (data.success && Array.isArray(data.syncedIds)) {
      if (data.syncedIds.length > 0) {
        const idList = data.syncedIds.join(',')
        await executeSql(`
          UPDATE sync_queue
          SET status = 'synced', synced_at = datetime('now', 'localtime')
          WHERE id IN (${idList});
        `)
        console.log(`[Sync Agent] Successfully synced ${data.syncedIds.length} items to cloud.`)
      }
    }
  } catch (err) {
    console.warn('[Sync Agent] Offline or Cloud API unreachable:', err.message)

    // Increment retry_count for pending items
    const pendingIds = pendingItems.map((i) => i.id).join(',')
    await executeSql(`
      UPDATE sync_queue
      SET retry_count = retry_count + 1, error_message = '${err.message.replace(/'/g, "''")}'
      WHERE id IN (${pendingIds});
    `)
  }
}
