import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { kubernetesApi } from '../../services/api';
import {
  CommandLineIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

type TerminalMode = 'kubectl' | 'shell';

interface HistoryEntry {
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
  executionTime?: number;
  workingDirectory?: string;
}

const KUBECTL_QUICK_COMMANDS = [
  { label: 'Get Pods', command: 'get pods -A' },
  { label: 'Get Nodes', command: 'get nodes' },
  { label: 'Get Services', command: 'get svc -A' },
  { label: 'Get Deployments', command: 'get deployments -A' },
  { label: 'Get Namespaces', command: 'get namespaces' },
  { label: 'Get Events', command: 'get events -A --sort-by=.lastTimestamp' },
  { label: 'Cluster Info', command: 'cluster-info' },
  { label: 'Get ConfigMaps', command: 'get configmaps -A' },
  { label: 'Get Secrets', command: 'get secrets -A' },
  { label: 'Top Nodes', command: 'top nodes' },
  { label: 'Top Pods', command: 'top pods -A' },
  { label: 'API Resources', command: 'api-resources' },
];

const SHELL_QUICK_COMMANDS = [
  { label: 'List Files', command: 'ls -la' },
  { label: 'Current Dir', command: 'pwd' },
  { label: 'Disk Usage', command: 'df -h' },
  { label: 'Memory Info', command: 'free -h' },
  { label: 'System Info', command: 'uname -a' },
  { label: 'Process List', command: 'ps aux | head -20' },
  { label: 'Network Info', command: 'ifconfig || ip addr' },
  { label: 'Environment', command: 'env | sort' },
  { label: 'Helm List', command: 'helm list -A' },
  { label: 'Docker PS', command: 'docker ps' },
  { label: 'Git Status', command: 'git status 2>/dev/null || echo "Not a git repo"' },
  { label: 'Curl Test', command: 'curl -s https://httpbin.org/get | head -10' },
];

export default function KubectlTerminal() {
  const [mode, setMode] = useState<TerminalMode>('kubectl');
  const [command, setCommand] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('~');
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      type: 'info',
      content: 'Welcome to NexOps Terminal. Use the toggle to switch between kubectl and shell modes.',
      timestamp: new Date(),
    },
    {
      type: 'info',
      content: 'Type "help" for available commands.',
      timestamp: new Date(),
    },
  ]);
  const [executing, setExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || executing) return;

    const trimmedCmd = cmd.trim();

    // Handle clear command
    if (trimmedCmd === 'clear') {
      setHistory([]);
      setCommand('');
      return;
    }

    // Handle help command
    if (trimmedCmd === 'help') {
      const helpContent = mode === 'kubectl'
        ? `Available kubectl commands:
  get <resource>     - List resources (pods, nodes, svc, deployments, etc.)
  describe <resource> <name> - Show details of a resource
  logs <pod>         - Print pod logs
  explain <resource> - Documentation for a resource
  top nodes/pods     - Display resource usage
  api-resources      - List available API resources
  version            - Show kubectl version
  clear              - Clear terminal
  help               - Show this help

Note: Some dangerous commands are blocked for security.`
        : `Available shell commands:
  Any standard shell command is supported, including:
  ls, cat, pwd, cd, grep, find, curl, wget, etc.

  Special commands:
  clear              - Clear terminal
  help               - Show this help

  Installed tools available:
  kubectl, helm, docker, git, curl, wget, etc.

Note: Some dangerous commands are blocked for security.`;

      setHistory(prev => [...prev, {
        type: 'input',
        content: mode === 'kubectl' ? `$ kubectl ${trimmedCmd}` : `$ ${trimmedCmd}`,
        timestamp: new Date(),
      }, {
        type: 'info',
        content: helpContent,
        timestamp: new Date(),
      }]);
      setCommand('');
      return;
    }

    // Handle cd command in shell mode
    if (mode === 'shell' && trimmedCmd.startsWith('cd ')) {
      const newDir = trimmedCmd.substring(3).trim();
      setWorkingDirectory(newDir || '~');
      setHistory(prev => [...prev, {
        type: 'input',
        content: `$ ${trimmedCmd}`,
        timestamp: new Date(),
      }, {
        type: 'info',
        content: `Changed directory to: ${newDir || '~'}`,
        timestamp: new Date(),
      }]);
      setCommand('');
      return;
    }

    // Add to history display
    setHistory(prev => [...prev, {
      type: 'input',
      content: mode === 'kubectl' ? `$ kubectl ${trimmedCmd}` : `$ ${trimmedCmd}`,
      timestamp: new Date(),
    }]);

    // Add to command history for navigation
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);
    setCommand('');
    setExecuting(true);

    try {
      if (mode === 'kubectl') {
        const response = await kubernetesApi.executeKubectl({
          command: trimmedCmd,
          timeout: 60,
        });

        if (response.data.success) {
          if (response.data.stdout) {
            setHistory(prev => [...prev, {
              type: 'output',
              content: response.data.stdout,
              timestamp: new Date(),
              executionTime: response.data.execution_time,
            }]);
          } else {
            setHistory(prev => [...prev, {
              type: 'info',
              content: 'Command executed successfully (no output)',
              timestamp: new Date(),
              executionTime: response.data.execution_time,
            }]);
          }
        } else {
          setHistory(prev => [...prev, {
            type: 'error',
            content: response.data.stderr || 'Command failed',
            timestamp: new Date(),
            executionTime: response.data.execution_time,
          }]);
        }
      } else {
        // Shell mode
        const response = await kubernetesApi.executeShell({
          command: trimmedCmd,
          timeout: 60,
          working_directory: workingDirectory,
        });

        // Update working directory from response
        if (response.data.working_directory) {
          setWorkingDirectory(response.data.working_directory);
        }

        if (response.data.success) {
          if (response.data.stdout) {
            setHistory(prev => [...prev, {
              type: 'output',
              content: response.data.stdout,
              timestamp: new Date(),
              executionTime: response.data.execution_time,
              workingDirectory: response.data.working_directory,
            }]);
          } else {
            setHistory(prev => [...prev, {
              type: 'info',
              content: 'Command executed successfully (no output)',
              timestamp: new Date(),
              executionTime: response.data.execution_time,
            }]);
          }
        } else {
          setHistory(prev => [...prev, {
            type: 'error',
            content: response.data.stderr || 'Command failed',
            timestamp: new Date(),
            executionTime: response.data.execution_time,
          }]);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute command';
      setHistory(prev => [...prev, {
        type: 'error',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      }]);
    } finally {
      setExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(command);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  const clearTerminal = () => {
    setHistory([{
      type: 'info',
      content: 'Terminal cleared',
      timestamp: new Date(),
    }]);
  };

  const runQuickCommand = (cmd: string) => {
    setCommand(cmd);
    executeCommand(cmd);
  };

  const toggleMode = (newMode: TerminalMode) => {
    setMode(newMode);
    setHistory(prev => [...prev, {
      type: 'info',
      content: `Switched to ${newMode === 'kubectl' ? 'Kubectl' : 'Shell'} mode`,
      timestamp: new Date(),
    }]);
  };

  const quickCommands = mode === 'kubectl' ? KUBECTL_QUICK_COMMANDS : SHELL_QUICK_COMMANDS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Terminal</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'kubectl'
              ? 'Execute kubectl commands against your cluster'
              : 'Execute shell commands on the backend server'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => toggleMode('kubectl')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'kubectl'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ServerIcon className="h-4 w-4" />
                Kubectl
              </div>
            </button>
            <button
              onClick={() => toggleMode('shell')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'shell'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CommandLineIcon className="h-4 w-4" />
                Shell
              </div>
            </button>
          </div>
          <button
            onClick={clearTerminal}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Quick Commands ({mode === 'kubectl' ? 'Kubectl' : 'Shell'})
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickCommands.map((qc) => (
            <button
              key={qc.command}
              onClick={() => runQuickCommand(qc.command)}
              disabled={executing}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-mono">
              {mode === 'kubectl' ? 'kubectl' : 'bash'}
            </span>
            {mode === 'shell' && (
              <span className="text-xs text-gray-500 font-mono ml-2">
                ({workingDirectory})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              mode === 'kubectl'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {mode === 'kubectl' ? 'K8s Mode' : 'Shell Mode'}
            </span>
            {executing && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <div className="animate-spin h-3 w-3 border border-yellow-400 border-t-transparent rounded-full"></div>
                Executing...
              </span>
            )}
          </div>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className="h-[500px] overflow-y-auto p-4 font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((entry, index) => (
            <div key={index} className="mb-2">
              {entry.type === 'input' && (
                <div className="flex items-start gap-2">
                  <span className="text-green-400 select-none">&gt;</span>
                  <span className="text-white">{entry.content}</span>
                </div>
              )}
              {entry.type === 'output' && (
                <div className="pl-4">
                  <pre className="text-gray-300 whitespace-pre-wrap break-all">{entry.content}</pre>
                  {entry.executionTime !== undefined && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      {entry.executionTime}s
                      <CheckCircleIcon className="h-3 w-3 text-green-500 ml-2" />
                    </div>
                  )}
                </div>
              )}
              {entry.type === 'error' && (
                <div className="pl-4">
                  <pre className="text-red-400 whitespace-pre-wrap break-all">{entry.content}</pre>
                  {entry.executionTime !== undefined && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      {entry.executionTime}s
                      <XCircleIcon className="h-3 w-3 text-red-500 ml-2" />
                    </div>
                  )}
                </div>
              )}
              {entry.type === 'info' && (
                <div className="pl-4">
                  <pre className="text-blue-400 whitespace-pre-wrap">{entry.content}</pre>
                </div>
              )}
            </div>
          ))}

          {/* Input Line */}
          <div className="flex items-center gap-2">
            <span className="text-green-400 select-none">&gt;</span>
            {mode === 'kubectl' && <span className="text-gray-500">kubectl</span>}
            {mode === 'shell' && <span className="text-gray-500">{workingDirectory}$</span>}
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={executing}
              className="flex-1 bg-transparent text-white outline-none font-mono"
              placeholder={executing ? 'Executing...' : 'Enter command...'}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className={`border rounded-xl p-4 ${
        mode === 'kubectl'
          ? 'bg-yellow-50 border-yellow-100'
          : 'bg-blue-50 border-blue-100'
      }`}>
        <h3 className={`text-sm font-medium mb-2 ${
          mode === 'kubectl' ? 'text-yellow-800' : 'text-blue-800'
        }`}>
          Tips & Shortcuts
        </h3>
        <ul className={`text-sm space-y-1 ${
          mode === 'kubectl' ? 'text-yellow-700' : 'text-blue-700'
        }`}>
          <li>- Press <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            mode === 'kubectl' ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>Enter</kbd> to execute command</li>
          <li>- Press <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            mode === 'kubectl' ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>Up/Down</kbd> arrows to navigate command history</li>
          <li>- Press <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            mode === 'kubectl' ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>Ctrl+L</kbd> to clear terminal</li>
          <li>- Type <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            mode === 'kubectl' ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>help</code> for available commands</li>
          {mode === 'kubectl' ? (
            <li>- Commands like delete --all, drain, etc. are blocked for safety</li>
          ) : (
            <li>- Dangerous commands like rm -rf /, sudo su, etc. are blocked for safety</li>
          )}
        </ul>
      </div>
    </div>
  );
}
