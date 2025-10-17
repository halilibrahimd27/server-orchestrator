import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Upload, Download, FolderOpen, Power } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalComponent({ servers }) {
  const [selectedServer, setSelectedServer] = useState(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [connected, setConnected] = useState(false);
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  // Terminal bağlantısı
  const connectToServer = (server) => {
    setSelectedServer(server);
    setConnected(false);
  };

  // selectedServer değişince terminal kur
  useEffect(() => {
    if (!selectedServer || !terminalRef.current) return;

    console.log('🚀 Setting up terminal for server:', selectedServer.name);

    // Eski terminal'i temizle
    if (xtermRef.current) {
      xtermRef.current.dispose();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Yeni xterm instance oluştur
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace, "Apple Color Emoji"',
      fontSize: 14,
      lineHeight: 1.2,
      theme: {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00',
        cursorAccent: '#000000',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bbbbbb',
        brightBlack: '#555555',
        brightRed: '#ff6e67',
        brightGreen: '#5af78e',
        brightYellow: '#f4f99d',
        brightBlue: '#caa9fa',
        brightMagenta: '#ff92d0',
        brightCyan: '#9aedfe',
        brightWhite: '#ffffff'
      },
      allowProposedApi: true,
      cols: 120,
      rows: 30
    });

    // Fit addon ekle
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Terminal'i DOM'a bağla
    console.log('✅ Terminal ref found, opening xterm...');
    term.open(terminalRef.current);
    fitAddon.fit();
    console.log('✅ XTerm opened and fitted');

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // WebSocket bağlantısı
    const ws = new WebSocket(`ws://localhost:8081?serverId=${selectedServer.id}`);

    ws.onopen = () => {
      setConnected(true);
      console.log('✅ Terminal bağlantısı kuruldu');
    };

    ws.onmessage = (event) => {
      // SSH'tan gelen veriyi xterm'e yaz
      term.write(event.data);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket hatası:', error);
      term.write('\r\n\r\n\x1b[31m❌ Bağlantı hatası!\x1b[0m\r\n');
    };

    ws.onclose = () => {
      setConnected(false);
      term.write('\r\n\r\n\x1b[31m🔴 Bağlantı kapatıldı\x1b[0m\r\n');
      console.log('🔴 Terminal bağlantısı kapandı');
    };

    // Terminal'den gelen input'u WebSocket'e gönder
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    wsRef.current = ws;

    // Window resize olduğunda terminali yeniden boyutlandır
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws) {
        ws.close();
      }
      if (term) {
        term.dispose();
      }
    };
  }, [selectedServer]);

  // Bağlantıyı kes
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    setSelectedServer(null);
    setConnected(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  // Terminal görünür olduğunda boyutlandır
  useEffect(() => {
    if (selectedServer && !showFileManager && fitAddonRef.current && xtermRef.current) {
      setTimeout(() => {
        fitAddonRef.current.fit();
      }, 100);
    }
  }, [showFileManager]);

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${connected ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
            <TerminalIcon className={`w-6 h-6 ${connected ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SSH Terminal</h2>
            <p className="text-sm text-slate-400">
              {selectedServer ? (
                <>
                  {selectedServer.name} ({selectedServer.host}:{selectedServer.port})
                  {connected && <span className="ml-2 text-green-400">● Bağlı</span>}
                </>
              ) : 'Sunucu seçin'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {connected && (
            <>
              <button
                onClick={() => setShowFileManager(!showFileManager)}
                className={`px-3 py-2 rounded-lg transition-colors ${showFileManager ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                title="Dosya Yöneticisi"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              <button
                onClick={disconnect}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Bağlantıyı Kes"
              >
                <Power className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Server Selector */}
      {!selectedServer && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <TerminalIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-4">SSH Bağlantısı Kur</h3>
            <p className="text-sm text-slate-500 mb-6">Bağlanmak için bir sunucu seçin</p>
            <div className="grid grid-cols-2 gap-3 max-w-2xl">
              {servers.length === 0 ? (
                <p className="col-span-2 text-slate-500">Henüz sunucu yok</p>
              ) : (
                servers.map(server => (
                  <button
                    key={server.id}
                    onClick={() => connectToServer(server)}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-green-500 rounded-lg transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="font-semibold text-white">{server.name}</div>
                    </div>
                    <div className="text-sm text-slate-400 font-mono">{server.username}@{server.host}:{server.port}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Screen */}
      {selectedServer && !showFileManager && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={terminalRef}
            className="flex-1 overflow-hidden bg-black"
            style={{ padding: '8px', minHeight: '400px' }}
          />

          {/* Info Bar */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <div>
                💡 <strong>İpucu:</strong> Tam terminal emülasyonu aktif. Tüm tuşlar ve komutlar desteklenir.
              </div>
              <div className="flex gap-4">
                <span>Ctrl+C: İptal</span>
                <span>Ctrl+D: Çıkış</span>
                <span>Tab: Otomatik tamamlama</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Manager */}
      {selectedServer && showFileManager && (
        <FileManager server={selectedServer} onClose={() => setShowFileManager(false)} />
      )}
    </div>
  );
}

// File Manager Component
function FileManager({ server, onClose }) {
  const [currentPath, setCurrentPath] = useState('~');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files/list/${server.id}?remotePath=${encodeURIComponent(currentPath)}`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Dosya listesi alınamadı:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const handleUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('remotePath', currentPath);

    try {
      const response = await fetch(`/api/files/upload/${server.id}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Dosya başarıyla yüklendi!');
        setUploadFile(null);
        loadFiles();
      } else {
        alert('❌ Hata: ' + data.error);
      }
    } catch (error) {
      alert('❌ Yükleme hatası: ' + error.message);
    }
  };

  const handleDownload = async (fileName) => {
    const remotePath = `${currentPath}/${fileName}`.replace('//', '/');

    try {
      const response = await fetch(`/api/files/download/${server.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remotePath })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert('❌ Hata: ' + data.error);
      }
    } catch (error) {
      alert('❌ İndirme hatası: ' + error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:border-blue-500"
            placeholder="Yol girin..."
          />
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Yükle
          </button>
        </div>

        {/* Upload */}
        <div className="flex gap-2">
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={!uploadFile}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 p-2">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Yükleniyor...</p>
        ) : files.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Dosya bulunamadı</p>
        ) : (
          <div className="space-y-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 rounded transition-colors"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm text-white">{file.name}</div>
                  <div className="text-xs text-slate-500">
                    {file.type === 'directory' ? '📁 Dizin' : `📄 ${(file.size / 1024).toFixed(2)} KB`}
                  </div>
                </div>
                {file.type === 'file' && (
                  <button
                    onClick={() => handleDownload(file.name)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
                    title="İndir"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
