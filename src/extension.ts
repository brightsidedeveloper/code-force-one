import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem; // Declare a global variable for the status bar item

export function activate(context: vscode.ExtensionContext) {
  const clockIn = () => {
    // Initialize the status bar item if it doesn't exist
    if (!statusBarItem) {
      statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
      statusBarItem.tooltip = 'Code Commander XP Tracker';
      statusBarItem.show();
    }
    updateStatusBarItem(getStats());
  };

  let throttleSave = false;
  vscode.workspace.onDidSaveTextDocument(() => {
    if (throttleSave) {
      return;
    }
    addEditorDecorations({ contentText: '💾 Document Saved XP: 10', color: 'lime' });
    gainXP(10);
    throttleSave = true;
    setTimeout(() => {
      throttleSave = false;
    }, 5000);
  });

  const test = () => {};

  const disposables = [
    vscode.commands.registerCommand('code-force-one.clockIn', clockIn),
    vscode.commands.registerCommand('code-force-one.test', test),
    vscode.workspace.onDidOpenTextDocument(() => {
      addEditorDecorations({ contentText: '📂 Document Opened XP: 5', color: 'cyan' });
      gainXP(5);
    }),
    vscode.workspace.onDidChangeTextDocument(() => {
      gainXP(1);
    }),
    vscode.window.onDidChangeTextEditorSelection(() => {
      highlightSelectedLine('rgba(0, 255, 0, 0.1)');
    }),
  ];
  context.subscriptions.push(...disposables);

  function getStats(): Stats {
    return context.globalState.get('stats', { xp: 0, level: 1, streak: 0, linesOfCode: 0 });
  }

  function updateStats(stats: Stats) {
    updateStatusBarItem(stats); // Update the existing status bar item
    context.globalState.update('stats', stats);
  }

  function gainXP(amount: number) {
    const stats = getStats();
    stats.xp += amount;

    while (stats.xp >= getXPForNextLevel(stats.level)) {
      stats.xp -= getXPForNextLevel(stats.level);
      stats.level++;
    }

    updateStats(stats);
  }
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

interface Stats {
  xp: number;
  level: number;
  streak: number;
  linesOfCode: number;
}

const BASE_XP = 100;
const GROWTH_RATE = 1.008;

function getXPForNextLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, GROWTH_RATE));
}

function updateStatusBarItem(stats: Stats) {
  if (statusBarItem) {
    statusBarItem.text = `🔥 Level: ${stats.level} XP: ${stats.xp} / ${getXPForNextLevel(stats.level)} 👨‍💻`;
  }
}

const highlightSelectedLine = (color: string) => {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return; // No active editor
  }

  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: color,
    isWholeLine: true,
  });

  const cursorPosition = activeEditor.selection.active.line;

  const lineRange = activeEditor.document.lineAt(cursorPosition).range;

  activeEditor.setDecorations(decorationType, [lineRange]);

  setTimeout(() => {
    activeEditor.setDecorations(decorationType, []);
    decorationType.dispose();
  }, 500);
};

function addEditorDecorations({
  contentText,
  color = 'yellow',
  fontWeight = 'bold',
}: {
  contentText: string;
  color?: string;
  fontWeight?: string;
}) {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    return;
  }

  const cursorPosition = activeEditor.selection.active.line;

  const decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentText,
      color,
      fontWeight,
    },
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  const position = activeEditor.document.lineAt(cursorPosition).range;
  activeEditor.setDecorations(decorationType, [{ range: position }]);

  setTimeout(() => {
    activeEditor.setDecorations(decorationType, []);
    decorationType.dispose();
  }, 3000);
}
