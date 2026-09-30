/**
 * Notes Module - Calendar-Notes-Discord
 * Unified Apple Notes / Notion-inspired rich document editor with visual formatting toolbar,
 * interactive checklists, note color themes, and date linking.
 */

const Notes = {
  notes: [],
  selectedTag: 'all',
  searchQuery: '',
  editingNoteId: null,
  activeColor: 'slate',

  init() {
    this.loadNotes();
    this.renderNotes();
    this.renderTags();
  },

  loadNotes() {
    const saved = localStorage.getItem('calnotes_notes');
    if (saved) {
      try {
        this.notes = JSON.parse(saved);
      } catch (e) {
        this.notes = [];
      }
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      this.notes = [
        {
          id: 'note-1',
          title: 'Project Roadmap & Discord Integration',
          htmlContent: `<h2>System Overview</h2><p>Building a self-hosted calendar and notes system with mobile PWA access and Discord alerts.</p><div class="task-item"><input type="checkbox" class="task-checkbox" checked><span class="task-text">Design mobile-first calendar timeline</span></div><div class="task-item"><input type="checkbox" class="task-checkbox" checked><span class="task-text">Replace split markdown with unified rich text editor</span></div><div class="task-item"><input type="checkbox" class="task-checkbox"><span class="task-text">Connect Discord bot for slash commands (/calendar, /note)</span></div><div class="task-item"><input type="checkbox" class="task-checkbox"><span class="task-text">Wire SQLite database persistence</span></div><blockquote>"Make it simple, make it reliable."</blockquote>`,
          tags: ['architecture', 'roadmap'],
          color: 'blue',
          pinned: true,
          linkedDate: todayStr,
          updatedAt: Date.now() - 1800000
        },
        {
          id: 'note-2',
          title: 'Daily Meeting & Action Items',
          htmlContent: `<h2>Morning Standup Notes</h2><p>Discussing the new UI improvements and time selection controls.</p><ul><li>Event scheduling now supports <b>15m / 30m / 1h</b> presets</li><li>All-day events cleanly separated in the day timeline</li><li>Direct date linking from notes to calendar</li></ul>`,
          tags: ['meetings', 'todo'],
          color: 'emerald',
          pinned: false,
          linkedDate: todayStr,
          updatedAt: Date.now() - 7200000
        },
        {
          id: 'note-3',
          title: 'Tailscale Mobile Configuration Guide',
          htmlContent: `<h3>Connecting Phone over Tailscale</h3><p>Step-by-step instructions for quick mobile access:</p><ol><li>Start local server: <code>python3 run.py</code></li><li>Open Safari on iPhone or Chrome on Android</li><li>Navigate to your Tailscale 100.x IP</li><li>Tap <b>Share &gt; Add to Home Screen</b> for native app feel</li></ol>`,
          tags: ['mobile', 'guides'],
          color: 'purple',
          pinned: false,
          linkedDate: null,
          updatedAt: Date.now() - 14400000
        }
      ];
      this.saveNotes();
    }
  },

  saveNotes() {
    localStorage.setItem('calnotes_notes', JSON.stringify(this.notes));
    this.renderTags();
    if (window.App && typeof App.updateStats === 'function') {
      App.updateStats();
    }
  },

  getColorStyles(colorKey) {
    switch (colorKey) {
      case 'blue':
        return { cardBg: 'bg-blue-950/40', border: 'border-blue-800/40', accent: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' };
      case 'emerald':
        return { cardBg: 'bg-emerald-950/40', border: 'border-emerald-800/40', accent: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' };
      case 'amber':
        return { cardBg: 'bg-amber-950/40', border: 'border-amber-800/40', accent: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' };
      case 'purple':
        return { cardBg: 'bg-purple-950/40', border: 'border-purple-800/40', accent: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' };
      default:
        return { cardBg: 'bg-slate-900/70', border: 'border-slate-800/80', accent: 'text-slate-300', badge: 'bg-slate-800 text-slate-300' };
    }
  },

  setFilterTag(tag) {
    this.selectedTag = tag;
    this.renderTags();
    this.renderNotes();
  },

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.renderNotes();
  },

  getAllTags() {
    const tagsSet = new Set();
    this.notes.forEach(n => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach(t => tagsSet.add(t.toLowerCase().trim()));
      }
    });
    return Array.from(tagsSet).filter(Boolean);
  },

  renderTags() {
    const container = document.getElementById('notes-tags-bar');
    if (!container) return;

    const allTags = this.getAllTags();
    let html = `
      <button onclick="Notes.setFilterTag('all')" 
        class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
          this.selectedTag === 'all'
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
        }">
        All Notes (${this.notes.length})
      </button>
    `;

    allTags.forEach(tag => {
      const isSelected = (this.selectedTag === tag);
      html += `
        <button onclick="Notes.setFilterTag('${tag}')" 
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
            isSelected
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }">
          #${tag}
        </button>
      `;
    });

    container.innerHTML = html;
  },

  renderNotes() {
    const container = document.getElementById('notes-list-container');
    if (!container) return;

    let filtered = [...this.notes];

    if (this.selectedTag !== 'all') {
      filtered = filtered.filter(n => n.tags && n.tags.includes(this.selectedTag));
    }

    if (this.searchQuery) {
      filtered = filtered.filter(n => {
        const titleMatch = (n.title && n.title.toLowerCase().includes(this.searchQuery));
        const contentText = extractPlainText(n.htmlContent).toLowerCase();
        return titleMatch || contentText.includes(this.searchQuery);
      });
    }

    // Sort: pinned first, then updated
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <i data-lucide="file-text" class="w-10 h-10 mb-2 opacity-40 text-blue-400"></i>
          <p class="text-sm font-semibold text-slate-300">No notes found</p>
          <p class="text-xs text-slate-500 mt-1">Create a note to jot down ideas, meeting items, or checklists.</p>
          <button onclick="Notes.openEditor()" class="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition">
            + New Note
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(note => {
      const colorStyle = this.getColorStyles(note.color || 'slate');
      const timeAgo = formatTimeAgo(note.updatedAt);

      return `
        <div class="group relative flex flex-col justify-between p-4 md:p-5 rounded-2xl ${colorStyle.cardBg} border ${colorStyle.border} hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-xl cursor-pointer"
             onclick="Notes.openEditor('${note.id}')">
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-sm md:text-base font-bold text-slate-100 group-hover:text-blue-400 transition leading-snug">
                ${escapeHtml(note.title || 'Untitled Note')}
              </h3>
              <div class="flex items-center gap-1" onclick="event.stopPropagation()">
                <button onclick="Notes.togglePin('${note.id}')" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 ${note.pinned ? 'text-amber-400' : 'opacity-40 hover:opacity-100'}" title="${note.pinned ? 'Unpin' : 'Pin'}">
                  <i data-lucide="pin" class="w-4 h-4"></i>
                </button>
                <button onclick="Notes.deleteNote('${note.id}')" class="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 opacity-60 hover:opacity-100" title="Delete">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Content Preview with interactive tasks -->
            <div class="note-preview-content text-xs text-slate-300 space-y-1.5 mb-3 line-clamp-4 leading-relaxed font-normal" onclick="Notes.handlePreviewClick(event, '${note.id}')">
              ${note.htmlContent || '<p class="text-slate-500 italic">Empty note...</p>'}
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-500">
            <div class="flex flex-wrap items-center gap-1.5">
              ${(note.tags || []).map(t => `<span class="px-2 py-0.5 rounded-lg ${colorStyle.badge} font-medium">#${escapeHtml(t)}</span>`).join('')}
              ${note.linkedDate ? `
                <span class="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 font-medium">
                  <i data-lucide="calendar" class="w-2.5 h-2.5"></i>${note.linkedDate}
                </span>` : ''}
            </div>
            <span class="text-slate-500 font-mono text-[10px]">${timeAgo}</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  handlePreviewClick(event, noteId) {
    // If user clicks a checkbox directly on the card, toggle it and stop propagation!
    if (event.target && event.target.classList.contains('task-checkbox')) {
      event.stopPropagation();
      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = note.htmlContent;
      const checkboxes = tempDiv.querySelectorAll('.task-checkbox');

      // Find index
      const cardCheckboxes = event.currentTarget.querySelectorAll('.task-checkbox');
      const clickedIdx = Array.from(cardCheckboxes).indexOf(event.target);

      if (clickedIdx !== -1 && checkboxes[clickedIdx]) {
        if (event.target.checked) {
          checkboxes[clickedIdx].setAttribute('checked', 'checked');
          checkboxes[clickedIdx].closest('.task-item')?.classList.add('task-checked');
        } else {
          checkboxes[clickedIdx].removeAttribute('checked');
          checkboxes[clickedIdx].closest('.task-item')?.classList.remove('task-checked');
        }
        note.htmlContent = tempDiv.innerHTML;
        note.updatedAt = Date.now();
        this.saveNotes();
        this.renderNotes();
      }
    }
  },

  openEditor(noteId = null) {
    this.editingNoteId = noteId;
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title-input');
    const editorCanvas = document.getElementById('note-editor-canvas');
    const tagsInput = document.getElementById('note-tags-input');
    const dateInput = document.getElementById('note-link-date');

    if (noteId) {
      const note = this.notes.find(n => n.id === noteId);
      if (note) {
        titleInput.value = note.title || '';
        editorCanvas.innerHTML = note.htmlContent || '';
        tagsInput.value = (note.tags || []).join(', ');
        dateInput.value = note.linkedDate || '';
        this.selectEditorColor(note.color || 'slate');
      }
    } else {
      titleInput.value = '';
      editorCanvas.innerHTML = '';
      tagsInput.value = '';
      dateInput.value = Calendar.selectedDate || '';
      this.selectEditorColor('slate');
    }

    modal.classList.remove('hidden');
    titleInput.focus();
  },

  selectEditorColor(colorKey) {
    this.activeColor = colorKey;
    document.querySelectorAll('[data-note-color-btn]').forEach(btn => {
      const key = btn.getAttribute('data-note-color-btn');
      if (key === colorKey) {
        btn.classList.add('ring-2', 'ring-white', 'scale-110');
      } else {
        btn.classList.remove('ring-2', 'ring-white', 'scale-110');
      }
    });
  },

  // Formatting Toolbar Commands
  formatDoc(cmd, val = null) {
    const canvas = document.getElementById('note-editor-canvas');
    canvas.focus();
    document.execCommand(cmd, false, val);
  },

  insertHeading(level) {
    const canvas = document.getElementById('note-editor-canvas');
    canvas.focus();
    document.execCommand('formatBlock', false, level === 1 ? '<h1>' : '<h2>');
  },

  insertChecklist() {
    const canvas = document.getElementById('note-editor-canvas');
    canvas.focus();
    const taskHtml = `
      <div class="task-item">
        <input type="checkbox" class="task-checkbox">
        <span class="task-text">&nbsp;Task item</span>
      </div>
    `;
    document.execCommand('insertHTML', false, taskHtml);
  },

  insertQuote() {
    this.formatDoc('formatBlock', '<blockquote>');
  },

  saveCurrentNote() {
    const titleInput = document.getElementById('note-title-input');
    const editorCanvas = document.getElementById('note-editor-canvas');
    const tagsInput = document.getElementById('note-tags-input');
    const dateInput = document.getElementById('note-link-date');

    const title = titleInput.value.trim() || 'Untitled Note';
    const htmlContent = editorCanvas.innerHTML.trim();
    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const linkedDate = dateInput.value || null;

    if (this.editingNoteId) {
      const idx = this.notes.findIndex(n => n.id === this.editingNoteId);
      if (idx !== -1) {
        this.notes[idx].title = title;
        this.notes[idx].htmlContent = htmlContent;
        this.notes[idx].tags = tags;
        this.notes[idx].color = this.activeColor;
        this.notes[idx].linkedDate = linkedDate;
        this.notes[idx].updatedAt = Date.now();
      }
    } else {
      this.notes.unshift({
        id: 'note-' + Date.now(),
        title,
        htmlContent,
        tags,
        color: this.activeColor,
        pinned: false,
        linkedDate,
        updatedAt: Date.now()
      });
    }

    this.saveNotes();
    this.renderNotes();
    this.closeEditor();

    // Re-render calendar day events if linked to current date
    if (linkedDate === Calendar.selectedDate) {
      Calendar.renderDayEvents(Calendar.selectedDate);
    }

    App.showToast('Note saved!');
  },

  closeEditor() {
    const modal = document.getElementById('note-modal');
    modal.classList.add('hidden');
    this.editingNoteId = null;
  },

  togglePin(id) {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      this.saveNotes();
      this.renderNotes();
    }
  },

  deleteNote(id) {
    if (confirm('Delete this note?')) {
      this.notes = this.notes.filter(n => n.id !== id);
      this.saveNotes();
      this.renderNotes();
      Calendar.renderDayEvents(Calendar.selectedDate);
      App.showToast('Note deleted');
    }
  }
};

function extractPlainText(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
