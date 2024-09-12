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

  vscode.workspace.onDidOpenTextDocument(() => {
    addEditorDecorations({ contentText: '📂 Document Opened XP: 5', color: 'cyan' });
    gainXP(5);
  });

  vscode.workspace.onDidChangeTextDocument(() => {
    gainXP(1);
  });

  vscode.window.onDidChangeTextEditorSelection(() => {
    highlightSelectedLine('rgba(0, 255, 0, 0.1)'); // Highlight the selected line
  });

  const test = () => {};

  const disposables = [
    vscode.commands.registerCommand('code-force-one.clockIn', clockIn),
    vscode.commands.registerCommand('code-force-one.test', test),
  ];
  disposables.forEach((disposable) => context.subscriptions.push(disposable));

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

// This method is called when your extension is deactivated
export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose(); // Dispose of the status bar item when the extension is deactivated
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

// Function to update the existing status bar item
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

  // Define the decoration style using the provided color
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: color,
    isWholeLine: true, // Highlight the entire line
  });

  // Get the current cursor position (selected line)
  const cursorPosition = activeEditor.selection.active.line;

  // Create the range for the current line
  const lineRange = activeEditor.document.lineAt(cursorPosition).range;

  // Apply the decoration to the current line
  activeEditor.setDecorations(decorationType, [lineRange]);

  // Set a timeout to clear the decoration after 3 seconds
  setTimeout(() => {
    activeEditor.setDecorations(decorationType, []); // Clear decorations
  }, 500); // 3000 ms = 3 seconds
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
    return; // No active editor
  }

  // Get the current cursor position
  const cursorPosition = activeEditor.selection.active.line;

  // Define the decoration style
  const decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentText,
      color,
      fontWeight,
    },
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  // Create the decoration at the current cursor line
  const position = activeEditor.document.lineAt(cursorPosition).range;
  activeEditor.setDecorations(decorationType, [{ range: position }]);

  // Set a timeout to clear the decoration after 3 seconds
  setTimeout(() => {
    activeEditor.setDecorations(decorationType, []); // Clear decorations
  }, 3000); // 3000 ms = 3 seconds
}
