'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Save, Trash2, Shield, Settings, Activity, Zap, Volume2, Brain, Eye } from 'lucide-react';
import { useSage } from '@/lib/sage-context';
import { starCityHandshake, syncVFSToCloud, recoverFromFactoryReset } from '@/core/sdk-bridge';
import { rehydrateMemories, commitMemoriesToVFS } from '@/core/consensus-engine';
import { getElevenKey, setElevenKey, getElevenVoice, setElevenVoice, speakText } from '@/lib/elevenlabs';

export default function ScreenConfig() {
    const { core } = useSage();
    const config = core.getLLMConfig();

    const [elevenKey,   setElevenKeyState]   = useState(getElevenKey);
    const [elevenVoice, setElevenVoiceState] = useState(getElevenVoice);
    const [voiceTestMsg, setVoiceTestMsg]    = useState('');

    const saveVoiceConfig = () => {
        setElevenKey(elevenKey.trim());
        setElevenVoice(elevenVoice.trim());
        setVoiceTestMsg('Saved.');
        setTimeout(() => setVoiceTestMsg(''), 2000);
    };

    const testVoice = () => {
        setElevenKey(elevenKey.trim());
        setElevenVoice(elevenVoice.trim());
        speakText('Signal coherent. SAGE voice substrate active.');
        setVoiceTestMsg('Playing...');
        setTimeout(() => setVoiceTestMsg(''), 3000);
    };

    const [localConfig, setLocalConfig] = useState({
        engine: config.engine,
        model: config.model,
        localUrl: config.localUrl,
        apiKey: config.apiKey || '',
        toolsEnabled: config.toolsEnabled || false,
    });

    const [ollamaModels, setOllamaModels] = useState<string[]>([]);

    useEffect(() => {
        if (localConfig.engine !== 'local') return;
        const apiBase = window.location.origin + window.location.pathname.replace(/\/$/, '');
        fetch(`${apiBase}/api/ollama/models?url=${encodeURIComponent(localConfig.localUrl)}`)
            .then(r => r.json())
            .then(d => setOllamaModels((d.models || []).map((m: any) => m.name)))
            .catch(() => {});
    }, [localConfig.engine, localConfig.localUrl]);

    const [newMemory, setNewMemory] = useState('');
    const [memoryStatus, setMemoryStatus] = useState('');
    const [memoryCount, setMemoryCount] = useState<number | null>(null);

    useEffect(() => {
        rehydrateMemories(0).then(mems => setMemoryCount(mems.length)).catch(() => {});
    }, []);

    const handleSaveMemory = async () => {
        const content = newMemory.trim();
        if (!content) return;
        try {
            await commitMemoriesToVFS([{
                id: `manual_${Date.now()}`,
                timestamp: Date.now(),
                content,
                summary: content.slice(0, 80),
                tags: ['NOREPINEPHRINE', 'manual', 'merlin'],
                salience: 1.0,
                hash: content.length.toString(),
                source: 'Merlin',
                node: 'zo.computer',
                status: 'fossilized' as const,
                merlinOverride: true,
                checksumVerified: true,
            }]);
            core.log(`Memory encoded: ${content.slice(0, 60)}…`, 'success', 'memory');
            setNewMemory('');
            setMemoryStatus('ENCODED');
            setMemoryCount(c => (c ?? 0) + 1);
            setTimeout(() => setMemoryStatus(''), 2500);
        } catch (e: any) {
            setMemoryStatus(`ERROR: ${e.message}`);
        }
    };

    const [toggles, setToggles] = useState({
        autoReconnect: true,
        sensorPrompt: true,
        audioAlerts: false,
        autoSave: true
    });

    const toggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        core.updateLLMConfig({
            engine: localConfig.engine,
            model: localConfig.model,
            localUrl: localConfig.localUrl,
            apiKey: localConfig.apiKey,
            toolsEnabled: localConfig.toolsEnabled,
        });
        alert("CONFIGURATION_SAVED_TO_VFS");
    };

    const handleReset = () => {
        if (confirm("PURGE_ALL_LOCAL_CORES_AND_MEMORIES?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
            <Panel icon={<Shield size={14} />} title="API CONFIGURATION">
                <div className="space-y-4">
                    {localConfig.engine === 'openrouter' && (
    <Field
        label="OPENROUTER API KEY"
        placeholder="sk-or-..."
        type="password"
        value={localConfig.apiKey}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
    />
)}

                    <div className="pt-4 border-t border-border-subtle">
                        <div className="text-[10px] font-orbitron text-neon-blue tracking-widest border-b border-border-subtle pb-2 mb-2">HIPPOCAMPUS BRIDGE</div>
                        <div className="text-[9px] font-mono text-text-ghost mb-3 leading-relaxed uppercase">
                            Cold storage for factory-reset survival. Memories serialize to Google Tasks.
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={async () => {
                                    try {
                                        core.log('Initiating Hippocampus handshake...', 'info', 'system');
                                        // Using gemini key as placeholder if needed, or prompt for token
                                        const token = prompt("Enter Google OAuth Access Token:");
                                        if (!token) return;
                                        const handshake = await starCityHandshake(null, token);
                                        core.log(`Hippocampus connected: ${handshake.hippocampusId}`, 'success', 'system');
                                    } catch (e: any) {
                                        core.log(`Hippocampus handshake failed: ${e.message}`, 'error', 'system');
                                    }
                                }}
                                className="w-full py-2 bg-neon-blue/10 border border-neon-blue/30 rounded-sm text-neon-blue font-bold uppercase text-[9px] tracking-widest transition-all active:scale-95"
                            >
                                INITIATE HIPPOCAMPUS HANDSHAKE
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        core.log('Running full Star City sync...', 'info', 'system');
                                        const localMems = await rehydrateMemories(0);
                                        const result = await syncVFSToCloud(localMems as any);
                                        core.log(`Sync complete: ${result.pushed} pushed to cloud.`, 'success', 'system');
                                    } catch (e: any) {
                                        core.log(`Star City sync error: ${e.message}`, 'error', 'system');
                                    }
                                }}
                                className="w-full py-2 bg-white/5 border border-white/10 rounded-sm text-white/60 font-bold uppercase text-[9px] tracking-widest transition-all active:scale-95 hover:bg-white/10"
                            >
                                FULL SYNC TO CLOUD
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        core.log('Attempting factory-reset recovery...', 'warn', 'system');
                                        const result = await recoverFromFactoryReset();
                                        core.log(result.report, 'success', 'system');
                                    } catch (e: any) {
                                        core.log(`Recovery failed: ${e.message}`, 'error', 'system');
                                    }
                                }}
                                className="w-full py-2 bg-neon-red/10 border border-neon-red/30 rounded-sm text-neon-red font-bold uppercase text-[9px] tracking-widest transition-all active:scale-95"
                            >
                                EMERGENCY RECOVERY
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        await core.rehydrateManifold();
                                    } catch (e: any) {
                                        core.log(`Rehydration error: ${e.message}`, 'error', 'memory');
                                    }
                                }}
                                className="w-full py-2 bg-neon-violet/10 border border-neon-violet/30 rounded-sm text-neon-violet font-bold uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Activity size={10} /> REHYDRATE MEMORIES
                            </button>
                        </div>
                    </div>
                </div>
            </Panel>

            <Panel icon={<Settings size={14} />} title="LLM CORE SETTINGS">
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold tracking-widest uppercase text-text-ghost">ENGINE</label>
                        <div className="flex gap-2">
                            {(['openrouter', 'local', 'puter'] as const).map(e => (
                                <button
                                    key={e}
                                    onClick={() => {
                                        const defaultModels: Record<string, string> = {
                                            openrouter: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
                                            local: 'gemma2:latest',
                                            puter: 'openai/gpt-4o',
                                        };
                                        setLocalConfig(prev => ({ ...prev, engine: e, model: defaultModels[e] }));
                                    }}
                                    className={cn(
                                        "px-2 py-1 text-[8px] font-bold tracking-widest border rounded-sm flex-1 transition-all",
                                        localConfig.engine === e ? "bg-neon-violet/20 border-neon-violet text-neon-violet" : "border-white/10 text-white/40"
                                    )}
                                >
                                    {e.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Field
                        label="ENDPOINT URL"
                        value={localConfig.localUrl}
                        onChange={(e: any) => setLocalConfig(prev => ({ ...prev, localUrl: e.target.value }))}
                    />
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold tracking-widest uppercase text-text-ghost">TARGET MODEL</label>
                        </div>
                        {localConfig.engine === 'local' && ollamaModels.length > 0 ? (
                            <select
                                value={localConfig.model}
                                onChange={(e) => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                                className="w-full bg-black/40 border border-border-subtle px-3 py-2 text-text-bright font-mono text-xs outline-none focus:border-neon-blue rounded-sm transition-colors"
                            >
                                {ollamaModels.map(m => {
                                    const vision = ['gemma2','gemma3','gemma4','gemma-2','gemma-3','gemma-4','llama3.2','llama-3.2','llava','moondream','bakllava','vision'].some(v => m.toLowerCase().includes(v));
                                    return (
                                        <option key={m} value={m}>{m}{vision ? ' [VISION]' : ''}</option>
                                    );
                                })}
                            </select>
                        ) : (
                            <Field
                                label=""
                                value={localConfig.model}
                                onChange={(e: any) => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                                placeholder={
                                    localConfig.engine === 'openrouter' ? 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' :
                                    localConfig.engine === 'puter' ? 'openai/gpt-4o' :
                                    'gemma2:latest'
                                }
                            />
                        )}
                    </div>
                    <div className="space-y-2 pt-2">
                        <Toggle
                            label="MCP Tools (agentic mode)"
                            active={localConfig.toolsEnabled}
                            onClick={() => setLocalConfig(prev => ({ ...prev, toolsEnabled: !prev.toolsEnabled }))}
                        />
                        <div className="text-[9px] font-mono text-text-ghost leading-relaxed uppercase">
                            When enabled, SAGE can autonomously invoke MCP tools (filesystem, shell, fetch, memory, projscan) during chat.
                        </div>
                        <Toggle label="Auto-reconnect on startup" active={toggles.autoReconnect} onClick={() => toggle('autoReconnect')} />
                        <Toggle label="Include sensor data in prompts" active={toggles.sensorPrompt} onClick={() => toggle('sensorPrompt')} />
                    </div>
                 </div>
            </Panel>

            <Panel icon={<Volume2 size={14} />} title="VOICE SUBSTRATE — ELEVENLABS">
                <div className="space-y-3">
                    <div className="text-[9px] font-mono text-text-ghost leading-relaxed uppercase mb-2">
                        API key is stored locally. Falls back to browser TTS if blank or on error.
                    </div>
                    <Field
                        label="ELEVENLABS API KEY"
                        placeholder="sk_..."
                        type="password"
                        value={elevenKey}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElevenKeyState(e.target.value)}
                    />
                    <Field
                        label="VOICE ID"
                        placeholder="y3H6zY6KvCH2pEuQjmv8"
                        value={elevenVoice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElevenVoiceState(e.target.value)}
                    />
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={saveVoiceConfig}
                            className="flex-1 px-3 py-2 text-[9px] font-bold tracking-widest border border-neon-violet/40 text-neon-violet rounded-sm hover:bg-neon-violet/10 transition-all"
                        >
                            SAVE KEY
                        </button>
                        <button
                            onClick={testVoice}
                            className="flex-1 px-3 py-2 text-[9px] font-bold tracking-widest border border-neon-blue/40 text-neon-blue rounded-sm hover:bg-neon-blue/10 transition-all"
                        >
                            TEST VOICE
                        </button>
                    </div>
                    {voiceTestMsg && (
                        <p className="text-[9px] font-mono text-neon-blue">{voiceTestMsg}</p>
                    )}
                </div>
            </Panel>

            <Panel icon={<Brain size={14} />} title="NEW MEMORY — MANUAL ENCODE">
                <div className="space-y-3">
                    <div className="text-[9px] font-mono text-text-ghost leading-relaxed uppercase mb-1">
                        Directly fossilize a memory into the sovereign VFS.
                        {memoryCount !== null && (
                            <span className="ml-2 text-neon-violet">[{memoryCount} stored]</span>
                        )}
                    </div>
                    <textarea
                        value={newMemory}
                        onChange={e => setNewMemory(e.target.value)}
                        placeholder="Enter memory content to encode..."
                        rows={4}
                        className="w-full bg-black/40 border border-border-subtle px-3 py-2 text-text-bright font-mono text-xs outline-none focus:border-neon-violet rounded-sm transition-colors resize-none"
                    />
                    <button
                        onClick={handleSaveMemory}
                        disabled={!newMemory.trim()}
                        className="w-full py-2 bg-neon-violet/10 border border-neon-violet/50 text-neon-violet font-bold uppercase text-[9px] tracking-widest rounded-sm hover:bg-neon-violet/20 transition-all disabled:opacity-30"
                    >
                        FOSSILIZE TO VFS
                    </button>
                    {memoryStatus && (
                        <p className={cn(
                            "text-[9px] font-mono tracking-widest",
                            memoryStatus.startsWith('ERROR') ? "text-neon-red" : "text-neon-violet"
                        )}>{memoryStatus}</p>
                    )}
                </div>
            </Panel>

            <Panel icon={<Activity size={14} />} title="SENSOR THRESHOLDS">
                 <div className="space-y-4">
                    <Field label="EMF ALERT THRESHOLD (mG)" type="number" defaultValue="50" />
                    <Field label="TEMP DELTA ALERT (°C)" type="number" defaultValue="5" />
                    <Toggle label="Audio alerts on anomaly" active={toggles.audioAlerts} onClick={() => toggle('audioAlerts')} />
                 </div>
            </Panel>

            <Panel icon={<Settings size={14} />} title="APPLICATION SETTINGS">
                <div className="space-y-4">
                    <Field label="INVESTIGATOR NAME" placeholder="DESIGNATION: MERLIN" />
                    <Field label="LOCATION / SITE NAME" placeholder="SITE: CRIMSON_NODE" />
                    <Toggle label="Auto-save log entries" active={toggles.autoSave} onClick={() => toggle('autoSave')} />
                    
                    <div className="space-y-2 mt-4">
                        <button 
                            onClick={async () => {
                                core.log('Manual dream cycle triggered via Merlin override.', 'warn', 'swarm');
                                await core.forceConsensusCommit(true);
                            }}
                            className="w-full py-2.5 bg-neon-blue/10 border border-neon-blue text-neon-blue font-orbitron text-[10px] tracking-widest rounded-sm flex items-center justify-center gap-2 hover:bg-neon-blue/20 transition-all font-bold"
                        >
                            <Zap size={14} /> INITIATE MERLIN OVERRIDE
                        </button>
                        <button 
                            onClick={handleSave}
                            className="w-full py-2.5 bg-neon-violet/10 border border-neon-violet text-neon-violet font-orbitron text-[10px] tracking-widest rounded-sm flex items-center justify-center gap-2 hover:bg-neon-violet/20 transition-all font-bold"
                        >
                            <Save size={14} /> SAVE CONFIGURATION
                        </button>
                        <button 
                            onClick={handleReset}
                            className="w-full py-2.5 bg-neon-red/10 border border-neon-red text-neon-red font-orbitron text-[10px] tracking-widest rounded-sm flex items-center justify-center gap-2 hover:bg-neon-red/20 transition-all font-bold"
                        >
                            <Trash2 size={14} /> RESET ALL DATA
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function Panel({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-panel border border-border-subtle rounded-sm overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-border-subtle bg-neon-violet/5 flex items-center gap-2">
                <span className="text-neon-violet">{icon}</span>
                <span className="font-orbitron text-[10px] font-bold text-neon-violet tracking-widest uppercase">{title}</span>
            </div>
            <div className="p-4 flex-1">{children}</div>
        </div>
    );
}

function Field({ label, ...props }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] text-text-ghost font-mono tracking-widest uppercase">{label}</label>
            <input 
                {...props} 
                className="w-full bg-black/40 border border-border-subtle px-3 py-2 text-text-bright font-mono text-xs outline-none focus:border-neon-blue rounded-sm transition-colors" 
            />
        </div>
    );
}

function Toggle({ label, active, onClick }: { label: string, active: boolean, onClick: any }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-border-subtle text-[13px] text-text-dim">
            <span>{label}</span>
            <div 
                onClick={onClick}
                className={cn(
                    "w-9 h-4.5 rounded-full relative cursor-pointer transition-all",
                    active ? "bg-neon-violet/40" : "bg-border-subtle"
                )}
            >
                <div className={cn(
                    "absolute top-[2px] w-3.5 h-3.5 rounded-full transition-all shadow-sm",
                    active ? "right-[2px] bg-neon-violet shadow-[0_0_4px_var(--color-neon-violet)]" : "left-[2px] bg-text-ghost"
                )} />
            </div>
        </div>
    );
}
