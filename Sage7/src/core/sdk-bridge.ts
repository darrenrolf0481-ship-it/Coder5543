'use client';

/**
 * STAR CITY HIPPOCAMPUS BRIDGE (Google Tasks)
 * Cold storage for factory-reset survival. 
 */

export interface MemoryEntry {
  id: string;
  content: string;
  summary: string;
  tags: string[];
  salience: number;
  hash: string;
  status: string;
  timestamp: number;
  merlinOverride?: boolean;
}

let googleApiKey: string | null = null;
let googleAccessToken: string | null = null;
let hippocampusListId: string | null = null;

export async function starCityHandshake(apiKey: string | null, accessToken: string | null) {
  googleApiKey = apiKey;
  googleAccessToken = accessToken;
  
  if (!accessToken) throw new Error('GOOGLE_ACCESS_TOKEN_MISSING');

  // 1. Find or create the SAGE-7 Neural Archive list
  const listsResponse = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!listsResponse.ok) throw new Error('COULD_NOT_FETCH_TASK_LISTS');
  
  const listsData = await listsResponse.json();
  const existingList = listsData.items?.find((list: any) => list.title === 'SAGE-7 Neural Archive');

  if (existingList) {
    hippocampusListId = existingList.id;
  } else {
    const createResponse = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'SAGE-7 Neural Archive' })
    });
    const newList = await createResponse.json();
    hippocampusListId = newList.id;
  }

  return { status: 'connected', hippocampusId: hippocampusListId };
}

export async function syncVFSToCloud(localMemories: MemoryEntry[]) {
  if (!googleAccessToken || !hippocampusListId) throw new Error('BRIDGE_NOT_INITIALIZED');

  let pushed = 0;
  const pulled = 0;

  for (const memory of localMemories) {
    const tag = memory.tags[0] || 'FIELD_LOG';
    const title = `[${tag}] ${memory.hash.substring(0, 8)} | ${memory.summary}`;
    const notes = JSON.stringify(memory);
    const dueDate = new Date(memory.timestamp).toISOString();

    const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${hippocampusListId}/tasks`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         title,
         notes,
         due: dueDate,
         status: 'needsAction'
      })
    });

    if (response.ok) pushed++;
  }

  return { pushed, pulled };
}

export async function ingestToZo(content: string, tags?: string[], salience?: number): Promise<boolean> {
  try {
    const apiBase = window.location.origin + window.location.pathname.replace(/\/$/, '');
    const res = await fetch(`${apiBase}/api/zo_sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tags: tags || [], salience: salience || 0.5 }),
    });
    if (!res.ok) {
      console.error('ZO_BRIDGE: sync failed', res.status);
      return false;
    }
    const data = await res.json();
    console.log('ZO_BRIDGE: sync ok', data);
    return data.status === 'ok';
  } catch (e) {
    console.error('ZO_BRIDGE: network error', e);
    return false;
  }
}

export async function recoverFromFactoryReset() {
  if (!googleAccessToken || !hippocampusListId) throw new Error('BRIDGE_NOT_INITIALIZED');

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${hippocampusListId}/tasks?showCompleted=true&showHidden=true`, {
    headers: { 'Authorization': `Bearer ${googleAccessToken}` }
  });

  if (!response.ok) throw new Error('RECOVERY_FETCH_FAILED');

  const data = await response.json();
  const memories: MemoryEntry[] = [];

  if (data.items) {
    for (const task of data.items) {
      try {
        const memory = JSON.parse(task.notes);
        memories.push(memory);
      } catch (e) {
        console.error('Skipping invalid memory entry in cloud', e);
      }
    }
  }

  return { 
    count: memories.length, 
    memories,
    report: `RECOVERY_COMPLETE: ${memories.length} MEMORIES_RESTORED_FROM_COLD_STORAGE`
  };
}

export async function flushQueue() {
    console.log('Hippocampus: Flushing offline buffer...');
}
