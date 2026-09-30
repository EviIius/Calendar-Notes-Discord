/**
 * Application Orchestrator - Calendar-Notes-Discord
 * Coordinates routing, event form duration calculators, rich text formatting bar,
 * stats overview, Discord webhooks, and backup utilities.
 */

const App = {
  currentTab: 'calendar',

  init() {
    this.setupNavigation();
    this.setupEventModalHandlers();
    this.setupNoteEditorToolbar();
    this.setupDiscordSettings();
    this.registerServiceWorker();

    // Initialize modules
    Calendar.init();
    Notes.init();
    this.updateStats();

    // Default tab
    this.switchTab('calendar');
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    const tabs = ['calendar', 'notes', 'discord', 'settings'];
    tabs.forEach(t => {
      const el = document.getElementById(`view-${t}`);
      if (el) {
        if (t === tabName) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Update bottom navigation & desktop navigation tabs
    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
      const target = btn.getAttribute('data-nav-tab');
      if (target === tabName) {
        btn.classList.add('text-blue-500', 'font-semibold');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('text-blue-500', 'font-semibold');
        btn.classList.add('text-slate-400');
      }
    });

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  updateStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = Calendar.events.filter(e => e.date === todayStr);

    const eventBadge = document.getElementById('stat-events-count');
    if (eventBadge) {
      eventBadge.textContent = `${todayEvents.length} today`;
    }

    const notesBadge = document.getElementById('stat-notes-count');
    if (notesBadge) {
      notesBadge.textContent = `${Notes.notes.length} notes`;
    }

    this.updateDiscordPreview();
  },

  setupNavigation() {
    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-nav-tab');
        this.switchTab(tab);
      });
    });
  },

  setupEventModalHandlers() {
    const eventModal = document.getElementById('event-modal');
    const openEventBtn = document.getElementById('btn-open-new-event');
    const closeEventBtn = document.getElementById('btn-close-event-modal');
    const eventForm = document.getElementById('event-form');
    const allDayToggle = document.getElementById('event-allday-toggle');
    const timeInputsContainer = document.getElementById('time-inputs-container');

    if (openEventBtn) {
      openEventBtn.addEventListener('click', () => {
        Calendar.openNewEventModal();
      });
    }

    if (closeEventBtn) {
      closeEventBtn.addEventListener('click', () => {
        eventModal.classList.add('hidden');
      });
    }

    // All-day switch toggle
    if (allDayToggle) {
      allDayToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          timeInputsContainer.classList.add('opacity-40', 'pointer-events-none');
        } else {
          timeInputsContainer.classList.remove('opacity-40', 'pointer-events-none');
        }
      });
    }

    // Duration preset chips
    document.querySelectorAll('[data-duration-pill]').forEach(pill => {
      pill.addEventListener('click', () => {
        const min = parseInt(pill.getAttribute('data-duration-pill'), 10);
        Calendar.setDurationPreset(min);
      });
    });

    // Auto-update end time when start time changes
    const startTimeInput = document.getElementById('event-time-start');
    if (startTimeInput) {
      startTimeInput.addEventListener('change', () => {
        // Keep current selected duration
        const activePill = document.querySelector('[data-duration-pill].bg-blue-600');
        const min = activePill ? parseInt(activePill.getAttribute('data-duration-pill'), 10) : 60;
        Calendar.setDurationPreset(min);
      });
    }

    // Submit event form
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title-input').value.trim();
        const date = document.getElementById('event-date-input').value;
        const allDay = document.getElementById('event-allday-toggle').checked;
        const startTime = allDay ? '' : document.getElementById('event-time-start').value;
        const endTime = allDay ? '' : document.getElementById('event-time-end').value;
        const category = document.getElementById('event-category-select').value;
        const location = document.getElementById('event-location-input').value.trim();
        const description = document.getElementById('event-desc-input').value.trim();
        const notifyDiscord = document.getElementById('event-discord-toggle').checked;
        const discordAlertTime = document.getElementById('event-discord-timing').value;

        if (!title || !date) {
          alert('Please enter a title and date.');
          return;
        }

        Calendar.addOrUpdateEvent({
          title,
          date,
          allDay,
          startTime,
          endTime,
          category,
          location,
          description,
          notifyDiscord,
          discordAlertTime
        });

        eventForm.reset();
        eventModal.classList.add('hidden');
        App.updateStats();
      });
    }
  },

  setupNoteEditorToolbar() {
    const openNoteBtn = document.getElementById('btn-open-new-note');
    const closeNoteBtn = document.getElementById('btn-close-note-modal');
    const saveNoteBtn = document.getElementById('btn-save-note');

    if (openNoteBtn) {
      openNoteBtn.addEventListener('click', () => {
        Notes.openEditor();
      });
    }

    if (closeNoteBtn) {
      closeNoteBtn.addEventListener('click', () => {
        Notes.closeEditor();
      });
    }

    if (saveNoteBtn) {
      saveNoteBtn.addEventListener('click', () => {
        Notes.saveCurrentNote();
        App.updateStats();
      });
    }

    // Color selector buttons in note editor
    document.querySelectorAll('[data-note-color-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.getAttribute('data-note-color-btn');
        Notes.selectEditorColor(col);
      });
    });

    // Prevent editor from losing focus on toolbar clicks
    document.querySelectorAll('.rich-toolbar-btn').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
    });
  },

  setupDiscordSettings() {
    const webhookInput = document.getElementById('discord-webhook-url');
    const saveWebhookBtn = document.getElementById('btn-save-discord-webhook');
    const testWebhookBtn = document.getElementById('btn-test-discord-webhook');

    const savedUrl = localStorage.getItem('calnotes_discord_webhook') || '';
    if (webhookInput) {
      webhookInput.value = savedUrl;
    }

    if (saveWebhookBtn) {
      saveWebhookBtn.addEventListener('click', () => {
        const url = (webhookInput.value || '').trim();
        localStorage.setItem('calnotes_discord_webhook', url);
        App.showToast('Discord webhook URL saved!');
        App.updateDiscordPreview();
      });
    }

    if (testWebhookBtn) {
      testWebhookBtn.addEventListener('click', async () => {
        const url = (webhookInput.value || '').trim();
        if (!url) {
          alert('Please enter a Discord Webhook URL first.');
          return;
        }

        App.showToast('Dispatching test alert to Discord...');

        try {
          const nextEvent = Calendar.events[0] || {
            title: "Test Calendar Reminder",
            date: new Date().toISOString().split('T')[0],
            startTime: "12:00 PM",
            category: "work",
            description: "Testing Discord alert integration."
          };

          const payload = {
            embeds: [
              {
                title: `📅 Calendar Alert: ${nextEvent.title}`,
                description: nextEvent.description || "You have an upcoming event scheduled in Calendar-Notes-Discord.",
                color: 5793266, // Discord Blurple (#5865f2)
                fields: [
                  { name: "Date", value: nextEvent.date, inline: true },
                  { name: "Time", value: nextEvent.startTime || "All Day", inline: true },
                  { name: "Category", value: nextEvent.category.toUpperCase(), inline: true }
                ],
                footer: { text: "Calendar-Notes-Discord • Open Source System" },
                timestamp: new Date().toISOString()
              }
            ]
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            App.showToast('Alert delivered to Discord channel!');
          } else {
            alert(`Discord responded with error status: ${res.status}`);
          }
        } catch (err) {
          alert(`Test dispatched! Note: Direct browser requests to Discord webhooks can trigger CORS in purely static mode. In full backend mode, Python dispatches this server-side without CORS restrictions!`);
        }
      });
    }
  },

  updateDiscordPreview() {
    const previewTitle = document.getElementById('discord-preview-title');
    const previewTime = document.getElementById('discord-preview-time');
    const previewDesc = document.getElementById('discord-preview-desc');
    const previewCat = document.getElementById('discord-preview-category');

    if (!previewTitle) return;

    const nextEvent = Calendar.events.find(e => e.notifyDiscord) || Calendar.events[0];
    if (nextEvent) {
      previewTitle.textContent = `📅 Calendar Alert: ${nextEvent.title}`;
      previewTime.textContent = `${nextEvent.date} • ${nextEvent.allDay ? 'All Day' : (nextEvent.startTime || 'Scheduled')}`;
      previewDesc.textContent = nextEvent.description || 'No description provided';
      if (previewCat) {
        previewCat.textContent = (nextEvent.category || 'work').toUpperCase();
      }
    }
  },

  showToast(message) {
    const toast = document.getElementById('app-toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 2800);
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  },

  exportBackup() {
    const data = {
      events: Calendar.events,
      notes: Notes.notes,
      exportedAt: new Date().toISOString(),
      version: '0.2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup file downloaded!');
  },

  importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.events)) {
          Calendar.events = data.events;
          Calendar.saveEvents();
          Calendar.renderMonth();
          Calendar.renderDayEvents(Calendar.selectedDate);
        }
        if (Array.isArray(data.notes)) {
          Notes.notes = data.notes;
          Notes.saveNotes();
          Notes.renderNotes();
          Notes.renderTags();
        }
        App.updateStats();
        this.showToast('Backup restored successfully!');
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
