import { analyze, applyBatchFixes, VERSION } from './engine.bundle.js';

// DOM References
const appVersion = document.getElementById('app-version');
if (appVersion && VERSION) {
  appVersion.textContent = `v${VERSION}`;
}

const rawInput = document.getElementById('raw-input');
const modeSelect = document.getElementById('mode-select');
const registerSelect = document.getElementById('register-select');
const formatBadge = document.getElementById('format-badge');
const inputStats = document.getElementById('input-stats');
const badgeTotalCount = document.getElementById('badge-total-count');
const countGrammar = document.getElementById('count-grammar');
const countTerminology = document.getElementById('count-terminology');
const countStyle = document.getElementById('count-style');
const countParity = document.getElementById('count-parity');
const jsonErrorBanner = document.getElementById('json-error-banner');
const jsonErrorText = document.getElementById('json-error-text');
const reviewDisplay = document.getElementById('review-display');
const issuesList = document.getElementById('issues-list');
const btnApplyBatch = document.getElementById('btn-apply-batch');
const btnCopy = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');
const btnSampleProse = document.getElementById('btn-sample-prose');
const btnSampleJson = document.getElementById('btn-sample-json');
const btnClear = document.getElementById('btn-clear');
const dropOverlay = document.getElementById('drop-overlay');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

let debounceTimer = null;
let currentAnalysis = null;

const SAMPLE_PROSE = `# Panduan Sesi Latihan di Era Digital

Mohon silahkan periksa jadwal dan aktifitas latihanmu disini.
Di era digital ini, aplikasi ini—di tengah hiruk pikuk kesibukan—bukan hanya mencatat repetisi, tetapi juga adalah merupakan asisten terbaikmu.

Gunakan perintah instalasi berikut:
\`\`\`bash
npm install @gym/tracker --save
\`\`\`

Kunjungi https://example.com/panduan-latihan untuk informasi lebih lanjut.
Silahkan coba lagi jika terdapat kendala teknis.`;

const SAMPLE_JSON = `{
  "Back": "punggung",
  "clearRating": "peringkat yang jelas",
  "runningWorkout": "latihan lari",
  "welcomeNote": "Silahkan atur jadwal dan aktifitas latihanmu disini.",
  "statusActive": "{0} hari beruntun",
  "statusInverted": "Set {0} belum dicentang"
}`;

/**
 * Escapes HTML entities to prevent XSS during DOM interpolation.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Displays a transient notification toast.
 * @param {string} msg
 */
function showToast(msg) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2400);
}

/**
 * Updates textarea character and line metrics.
 * @param {string} text
 */
function updateInputStats(text) {
  const chars = text.length;
  const lines = text === '' ? 0 : text.split('\n').length;
  if (inputStats) {
    inputStats.textContent = `${chars.toLocaleString()} characters • ${lines.toLocaleString()} lines`;
  }
}

/**
 * Renders categorized review display with interactive <mark> highlight spans.
 * @param {string} text
 * @param {Array<any>} findings
 */
function renderProseReview(text, findings) {
  if (!reviewDisplay) return;

  if (!text) {
    reviewDisplay.innerHTML = '<span class="text-slate-400 italic">Text with highlighted issues will appear here...</span>';
    return;
  }

  if (findings.length === 0) {
    reviewDisplay.innerHTML = `<span class="text-emerald-700 font-medium">✓ All clear! No spelling errors, calques, or AI slop detected in this text.</span>\n\n${escapeHtml(text)}`;
    return;
  }

  // Sort findings with coordinates ascending by startIndex
  const validSpans = findings
    .map((f, index) => ({ ...f, originalIndex: index }))
    .filter((f) => typeof f.startIndex === 'number' && typeof f.endIndex === 'number' && f.startIndex < f.endIndex)
    .sort((a, b) => a.startIndex - b.startIndex);

  let html = '';
  let cursor = 0;

  for (const span of validSpans) {
    if (span.startIndex < cursor) {
      // Overlapping span; skip highlight wrapping to prevent DOM corruption
      continue;
    }
    // Append preceding clean text
    html += escapeHtml(text.slice(cursor, span.startIndex));

    // Append highlighted issue span
    const categoryClass = `issue-${span.category || 'grammar'}`;
    const spanText = escapeHtml(text.slice(span.startIndex, span.endIndex));
    html += `<mark class="${categoryClass}" data-issue-index="${span.originalIndex}" title="${escapeHtml(span.message)}">${spanText}</mark>`;
    cursor = span.endIndex;
  }

  // Append remaining text
  html += escapeHtml(text.slice(cursor));
  reviewDisplay.innerHTML = html;

  // Add click listener to highlight cards on mark click
  reviewDisplay.querySelectorAll('mark').forEach((markEl) => {
    markEl.addEventListener('click', () => {
      const idx = markEl.getAttribute('data-issue-index');
      const card = document.getElementById(`issue-card-${idx}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        card.classList.add('ring-2', 'ring-emerald-500');
        setTimeout(() => card.classList.remove('ring-2', 'ring-emerald-500'), 1500);
      }
    });
  });
}

/**
 * Renders the detailed findings card list.
 * @param {Array<any>} findings
 * @param {'prose' | 'json'} mode
 */
function renderFindingCards(findings, mode) {
  if (!issuesList) return;

  if (findings.length === 0) {
    issuesList.innerHTML = '<p class="text-xs text-slate-400 italic">No issues detected.</p>';
    return;
  }

  const categoryLabels = {
    grammar: 'Grammar',
    terminology: 'Terminology & Calques',
    style: 'Style & Pronouns',
    parity: 'Format & Parity',
    structure: 'Structure',
    general: 'General',
  };

  const categoryBadgeColors = {
    grammar: 'bg-rose-100 text-rose-800 border-rose-200',
    terminology: 'bg-amber-100 text-amber-800 border-amber-200',
    style: 'bg-sky-100 text-sky-800 border-sky-200',
    parity: 'bg-purple-100 text-purple-800 border-purple-200',
    structure: 'bg-slate-100 text-slate-800 border-slate-200',
    general: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  let html = '';
  findings.forEach((finding, idx) => {
    const cat = finding.category || 'general';
    const catLabel = categoryLabels[cat] || cat;
    const badgeColor = categoryBadgeColors[cat] || categoryBadgeColors.general;
    const hasReplacement = typeof finding.replacement === 'string';

    html += `
      <div id="issue-card-${idx}" class="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}">
              ${escapeHtml(catLabel)}
            </span>
            <span class="font-mono text-xs font-semibold text-slate-700">
              ${escapeHtml(finding.rule)}
            </span>
          </div>
          ${
            hasReplacement
              ? `<button type="button" data-fix-index="${idx}" class="btn-single-fix inline-flex items-center px-2 py-1 text-xs font-medium rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition">
                  ⚡ Apply: <span class="font-bold ml-1 font-mono">${escapeHtml(finding.replacement)}</span>
                </button>`
              : ''
          }
        </div>

        ${
          finding.keyPath
            ? `<div class="text-[11px] text-slate-500 font-mono">Key: <span class="text-slate-800 font-semibold">${escapeHtml(finding.keyPath)}</span></div>`
            : ''
        }

        <p class="text-xs text-slate-700 leading-normal">${escapeHtml(finding.message)}</p>
      </div>
    `;
  });

  issuesList.innerHTML = html;

  // Bind single-fix buttons
  issuesList.querySelectorAll('.btn-single-fix').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-fix-index') || '-1', 10);
      const finding = findings[idx];
      if (finding && typeof finding.replacement === 'string') {
        applySingleFix(finding, mode);
      }
    });
  });
}

/**
 * Applies a single replacement to the textarea and refreshes analysis.
 * @param {any} finding
 * @param {'prose' | 'json'} mode
 */
function applySingleFix(finding, mode) {
  if (!rawInput || !currentAnalysis) return;
  const currentVal = rawInput.value;

  if (mode === 'prose' && typeof finding.startIndex === 'number' && typeof finding.endIndex === 'number') {
    const nextVal = currentVal.slice(0, finding.startIndex) + finding.replacement + currentVal.slice(finding.endIndex);
    rawInput.value = nextVal;
    showToast(`Applied fix "${finding.replacement}" successfully!`);
    runAnalysis();
  } else if (mode === 'json') {
    // In JSON mode, apply batch fix or re-run analysis
    if (currentAnalysis && currentAnalysis.cleanText) {
      rawInput.value = currentAnalysis.cleanText;
      showToast('JSON catalog fixes applied successfully!');
      runAnalysis();
    }
  }
}

/**
 * Executes full analysis pass on current textarea content.
 */
function runAnalysis() {
  if (!rawInput) return;
  const text = rawInput.value;
  const pronoun = registerSelect ? registerSelect.value : '';
  const mode = modeSelect ? modeSelect.value : 'auto';

  updateInputStats(text);

  currentAnalysis = analyze(text, { pronoun: pronoun || undefined, mode });

  // Update format badge
  if (formatBadge) {
    if (currentAnalysis.mode === 'json') {
      formatBadge.textContent = currentAnalysis.isSnippet ? 'JSON Catalog (Snippet)' : 'JSON Catalog';
      formatBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800';
    } else {
      formatBadge.textContent = 'Freeform Prose';
      formatBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700';
    }
  }

  // Update counts
  const stats = currentAnalysis.stats || { totalFindings: 0, highConfidence: 0, byCategory: {} };
  if (badgeTotalCount) {
    badgeTotalCount.textContent = `${stats.totalFindings} ${stats.totalFindings === 1 ? 'issue' : 'issues'}`;
  }
  if (countGrammar) countGrammar.textContent = stats.byCategory?.grammar || 0;
  if (countTerminology) countTerminology.textContent = stats.byCategory?.terminology || 0;
  if (countStyle) countStyle.textContent = stats.byCategory?.style || 0;
  if (countParity) countParity.textContent = stats.byCategory?.parity || 0;

  // Handle JSON error boundary
  if (currentAnalysis.mode === 'json' && !currentAnalysis.valid) {
    if (jsonErrorBanner) jsonErrorBanner.classList.remove('hidden');
    if (jsonErrorText) jsonErrorText.textContent = currentAnalysis.error || 'Invalid JSON syntax.';
    if (reviewDisplay) {
      reviewDisplay.innerHTML = '<span class="text-rose-600 italic">Analysis halted due to invalid JSON syntax. Please resolve the syntax error above.</span>';
    }
    if (issuesList) {
      issuesList.innerHTML = '<p class="text-xs text-rose-500 italic">Please resolve JSON syntax errors before proceeding with linguistic audit.</p>';
    }
    if (btnApplyBatch) btnApplyBatch.disabled = true;
    return;
  }

  if (jsonErrorBanner) jsonErrorBanner.classList.add('hidden');

  // Render review display
  if (currentAnalysis.mode === 'json') {
    if (reviewDisplay) {
      if (currentAnalysis.findings.length === 0) {
        reviewDisplay.innerHTML = `<span class="text-emerald-700 font-medium">✓ Valid! JSON catalog syntax is correct, with no spelling errors, calques, or placeholder parity issues found.</span>\n\n<pre class="mt-2 text-xs leading-relaxed text-slate-700 font-mono">${escapeHtml(currentAnalysis.cleanText || text)}</pre>`;
      } else {
        reviewDisplay.innerHTML = `<pre class="text-xs leading-relaxed text-slate-700 font-mono">${escapeHtml(currentAnalysis.cleanText || text)}</pre>`;
      }
    }
  } else {
    renderProseReview(text, currentAnalysis.findings);
  }

  renderFindingCards(currentAnalysis.findings, currentAnalysis.mode);

  // Enable/disable action buttons
  if (btnApplyBatch) {
    const hasBatchFixable =
      (currentAnalysis.mode === 'prose' && stats.highConfidence > 0) ||
      (currentAnalysis.mode === 'json' && currentAnalysis.cleanText !== text);
    btnApplyBatch.disabled = !hasBatchFixable;
  }
  if (btnCopy) btnCopy.disabled = !text || text.trim().length === 0;
  if (btnDownload) btnDownload.disabled = !text || text.trim().length === 0;
}

// Event Listeners
if (rawInput) {
  rawInput.addEventListener('input', () => {
    currentAnalysis = null;
    if (btnApplyBatch) btnApplyBatch.disabled = true;
    if (btnCopy) btnCopy.disabled = true;
    if (btnDownload) btnDownload.disabled = true;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runAnalysis, 150);
  });
}

if (registerSelect) {
  registerSelect.addEventListener('change', runAnalysis);
}

if (modeSelect) {
  modeSelect.addEventListener('change', runAnalysis);
}

if (btnApplyBatch) {
  btnApplyBatch.addEventListener('click', () => {
    if (!currentAnalysis || !rawInput) return;
    if (currentAnalysis.cleanText && currentAnalysis.cleanText !== rawInput.value) {
      rawInput.value = currentAnalysis.cleanText;
      showToast('All standard fixes applied successfully!');
      runAnalysis();
    }
  });
}

if (btnCopy) {
  btnCopy.addEventListener('click', async () => {
    if (!rawInput) return;
    const textToCopy = currentAnalysis?.cleanText || rawInput.value;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Clean text copied to clipboard!');
    } catch (_) {
      showToast('Failed to copy text to clipboard.');
    }
  });
}

if (btnDownload) {
  btnDownload.addEventListener('click', () => {
    if (!rawInput) return;
    const textToDownload = currentAnalysis?.cleanText || rawInput.value;
    const isJson = currentAnalysis?.mode === 'json';
    const filename = isJson ? 'indonesian-linguist-clean.json' : 'indonesian-linguist-clean.md';
    const mime = isJson ? 'application/json' : 'text/markdown';

    const blob = new Blob([textToDownload], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`File ${filename} downloaded successfully!`);
  });
}

if (btnSampleProse) {
  btnSampleProse.addEventListener('click', () => {
    if (!rawInput) return;
    rawInput.value = SAMPLE_PROSE;
    runAnalysis();
  });
}

if (btnSampleJson) {
  btnSampleJson.addEventListener('click', () => {
    if (!rawInput) return;
    rawInput.value = SAMPLE_JSON;
    runAnalysis();
  });
}

if (btnClear) {
  btnClear.addEventListener('click', () => {
    if (!rawInput) return;
    rawInput.value = '';
    runAnalysis();
  });
}

// Drag & Drop Ingestion
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (dropOverlay) dropOverlay.classList.remove('hidden');
});

window.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null && dropOverlay) {
    dropOverlay.classList.add('hidden');
  }
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  if (dropOverlay) dropOverlay.classList.add('hidden');

  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (rawInput && event.target && typeof event.target.result === 'string') {
        rawInput.value = event.target.result;
        showToast(`File "${file.name}" loaded successfully.`);
        runAnalysis();
      }
    };
    reader.readAsText(file, 'utf-8');
  }
});

// Initial analysis pass
runAnalysis();
