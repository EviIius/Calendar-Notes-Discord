/**
 * Notes Module - Calendar-Notes-Discord
 * Handles markdown notes, live preview, tagging, search, and local storage sync.
 */

const Notes = {
  notes: [],
  selectedTag: 'all',
  searchQuery: '',
  editingNoteId: null,

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
          title: '📌 Welcome to your Open Source Notes',
          content: `# Personal Notes & Ideas\n\nThis is a lightweight, mobile-first note system.\n\n### Features\n- [x] Full **Markdown** support\n- [x] Tag-based organization\n- [x] Fast instant search\n- [ ] Connected to Discord alerts & bot\n\n> "Simplicity is prerequisite for reliability."\n\nYou can edit this note or create a new one anytime!`,
          tags: ['welcome', 'guide'],
          pinned: true,
          linkedDate: todayStr,
          updatedAt: Date.now() - 3600000
        },
        {
          id: 'note-2',
          title: 'Discord Integration Architecture',
          content: `## Discord Alerts Plan\n\n1. **Webhooks:** Instant, zero-overhead embeds for reminders.\n2. **Slash Commands:**\n   - \`/calendar upcoming\`\n   - \`/note quick <text>\`\n3. **Scheduled Dispatcher:** Python background loop checks active reminders.`,
          tags: ['discord', 'architecture'],
          pinned: false,
          linkedDate: null,
          updatedAt: Date.now() - 7200000
        },
        {
          id: 'note-3',
          title: 'Tailscale & Mobile Access',
          content: `### Accessing from Mobile\n\nWhen running \`python3 run.py\`:\n- Access via your **Tailscale 100.x.y.z:8000** IP\n- In Safari on iOS: Tap **Share > Add to Home Screen**\n- In Chrome on Android: Tap **Install App**`,
          tags: ['mobile', 'tailscale'],
          pinned: false,
          linkedDate: null,
          updatedAt: Date.now() - 10800000
        }
      ];
      this.saveNotes();
    }
  },

  saveNotes() {
    localStorage.setItem('calnotes_notes', JSON.stringify(this.notes));
    this.renderTags();
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
        class="px-3 py-1 text-xs font-medium rounded-full transition whitespace-nowrap ${
          this.selectedTag === 'all'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
        }">
        All Notes (${this.notes.length})
      </button>
    `;

    allTags.forEach(tag => {
      const isSelected = (this.selectedTag === tag);
      html += `
        <button onclick="Notes.setFilterTag('${tag}')" 
          class="px-3 py-1 text-xs font-medium rounded-full transition whitespace-nowrap ${
            isSelected
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
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

    // Filter by tag
    if (this.selectedTag !== 'all') {
      filtered = filtered.filter(n => n.tags && n.tags.includes(this.selectedTag));
    }

    // Filter by search
    if (this.searchQuery) {
      filtered = filtered.filter(n => 
        (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
        (n.content && n.content.toLowerCase().includes(this.searchQuery))
      );
    }

    // Sort: pinned first, then newest updated
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-slate-700/60 rounded-2xl bg-slate-900/30">
          <i data-lucide="file-question" class="w-10 h-10 mb-2 opacity-50"></i>
          <p class="text-sm font-medium text-slate-400">No notes found</p>
          <p class="text-xs text-slate-500 mt-1">Tap "+ Note" to create a new markdown note or clear your search filters.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(note => {
      // Render preview snippet
      const cleanSnippet = note.content
        ? note.content.replace(/[#*`_~>[\]]/g, '').slice(0, 140) + (note.content.length > 140 ? '...' : '')
        : 'No content...';

      const timeAgo = formatTimeAgo(note.updatedAt);

      return `
        <div class="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 cursor-pointer"
             onclick="Notes.openEditor('${note.id}')">
          <div>
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <h3 class="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition leading-snug">
                ${escapeHtml(note.title || 'Untitled Note')}
              </h3>
              <div class="flex items-center gap-1" onclick="event.stopPropagation()">
                <button onclick="Notes.togglePin('${note.id}')" class="p-1 rounded-lg hover:bg-slate-700 text-slate-400 ${note.pinned ? 'text-amber-400' : ''}" title="${note.pinned ? 'Unpin' : 'Pin'}">
                  <i data-lucide="pin" class="w-4 h-4"></i>
                </button>
                <button onclick="Notes.deleteNote('${note.id}')" class="p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-rose-400" title="Delete">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <p class="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed font-normal">
              ${escapeHtml(cleanSnippet)}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/40 text-[11px] text-slate-500">
            <div class="flex flex-wrap items-center gap-1">
              ${(note.tags || []).map(t => `<span class="px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-400">#${escapeHtml(t)}</span>`).join('')}
              ${note.linkedDate ? `<span class="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 flex items-center gap-1"><i data-lucide="calendar" class="w-2.5 h-2.5"></i>${note.linkedDate}</span>` : ''}
            </div>
            <span class="text-slate-500">${timeAgo}</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  openEditor(noteId = null) {
    this.editingNoteId = noteId;
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const tagsInput = document.getElementById('note-tags-input');
    const previewContainer = document.getElementById('note-preview-pane');

    if (noteId) {
      const note = this.notes.find(n => n.id === noteId);
      if (note) {
        titleInput.value = note.title || '';
        contentInput.value = note.content || '';
        tagsInput.value = (note.tags || []).join(', ');
      }
    } else {
      titleInput.value = '';
      contentInput.value = '';
      tagsInput.value = '';
    }

    this.updatePreview();
    modal.classList.remove('hidden');
    titleInput.focus();
  },

  updatePreview() {
    const contentInput = document.getElementById('note-content-input');
    const preview = document.getElementById('note-preview-pane');
    if (!contentInput || !preview) return;

    const raw = contentInput.value || '*No content yet...*';
    if (window.marked) {
      preview.innerHTML = window.marked.parse(raw);
    } else {
      preview.textContent = raw;
    }
  },

  saveCurrentNote() {
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const tagsInput = document.getElementById('note-tags-input');

    const title = titleInput.value.trim() || 'Untitled Note';
    const content = contentInput.value.trim();
    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (this.editingNoteId) {
      const idx = this.notes.findIndex(n => n.id === this.editingNoteId);
      if (idx !== -1) {
        this.notes[idx].title = title;
        this.notes[idx].content = content;
        this.notes[idx].tags = tags;
        this.notes[idx].updatedAt = Date.now();
      }
    } else {
      this.notes.unshift({
        id: 'note-' + Date.now(),
        title,
        content,
        tags,
        pinned: false,
        linkedDate: Calendar.selectedDate || null,
        updatedAt: Date.now()
      });
    }

    this.saveNotes();
    this.renderNotes();
    this.closeEditor();
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
      App.showToast('Note deleted');
    }
  }
};

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
