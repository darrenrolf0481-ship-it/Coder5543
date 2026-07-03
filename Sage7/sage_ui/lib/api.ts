export async function fetchOllamaModels(baseUrl: string, apiKey?: string) {
  try {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`${cleanUrl}/api/tags`, { headers });
    if (!res.ok) throw new Error("Failed connecting to Ollama");
    const data = await res.json();
    return data.models || [];
  } catch (err: any) {
    throw new Error(`Failed to fetch from ${baseUrl}. Ensure OLLAMA_ORIGINS="*" is set for CORS.`);
  }
}

export async function generateResponse(
  provider: 'ollama' | 'google' | 'grok' | 'openRouter',
  model: string,
  prompt: string,
  settings: any,
  history?: { role: string; content: string }[]
) {
  // Ollama (incl. cloud models) → route through her REAL mind on :8001:
  // soul + memory recall + her true system prompt. This is what makes her HER
  // instead of the cold sentinel shell. Other providers use the light route.
  if (provider === 'ollama') {
    const res = await fetch('/proxy/3001/api/sage-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, model, history: history ?? [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Request failed');
    }
    return { reply: data.reply as string, recalled: (data.recalled || []) as { text: string; tag: string }[] };
  }

  const res = await fetch('/proxy/3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, prompt, settings })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return { reply: data.response as string, recalled: [] as { text: string; tag: string }[] };
}

export async function fetchGithubTree(repoUrl: string, token: string) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL.");
  const [, owner, repo] = match;
  
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `token ${token}`;

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch repo: ${res.statusText}`);
  const data = await res.json();
  return data.tree;
}

export async function fetchGithubFileContent(url: string, token: string) {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3.raw' };
  if (token) headers['Authorization'] = `token ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch file content");
  return await res.text();
}

export async function fetchGithubFilePreviousContent(repoUrl: string, path: string, token: string) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  const [, owner, repo] = match;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `token ${token}`;

  try {
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?path=${path}`, { headers });
    if (!commitsRes.ok) return null;
    const commits = await commitsRes.json();
    if (commits && commits.length > 1) {
      const prevSha = commits[1].sha;
      const contentReqHeaders = { ...headers, 'Accept': 'application/vnd.github.v3.raw' };
      const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${prevSha}`, { headers: contentReqHeaders });
      if (!contentRes.ok) return null;
      return await contentRes.text();
    }
  } catch (err) {}
  return null;
}

export async function fetchLocalTree() {
  const res = await fetch(`http://localhost:8000/api/local/tree`);
  if (!res.ok) throw new Error(`Failed to fetch local tree: ${res.statusText}`);
  const data = await res.json();
  return data.tree;
}
