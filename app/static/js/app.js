/**
 * Main Application Orchestrator - Calendar-Notes-Discord
 * Manages tab switching, modals, toast alerts, settings, and service worker registration.
 */

const App = {
  currentTab: 'calendar',

  init() {
    this.setupNavigation();
    this.setupModals();
    this.setupDiscordSettings();
    this.registerServiceWorker();

    // Initialize modules
    Calendar.init();
    Notes.init();

    // Default tab
    this.switchTab('calendar');
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    // View containers
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

    // Update bottom nav & desktop nav highlights
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

    // Re-render icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  setupNavigation() {
    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-nav-tab');
        this.switchTab(tab);
      });
    });
  },

  setupModals() {
    // Event modal handlers
    const eventModal = document.getElementById('event-modal');
    const openEventBtn = document.getElementById('btn-open-new-event');
    const closeEventBtn = document.getElementById('btn-close-event-modal');
    const eventForm = document.getElementById('event-form');

    if (openEventBtn) {
      openEventBtn.addEventListener('click', () => {
        document.getElementById('event-date-input').value = Calendar.selectedDate || new Date().toISOString().split('T')[0];
        eventModal.classList.remove('hidden');
      });
    }

    if (closeEventBtn) {
      closeEventBtn.addEventListener('click', () => {
        eventModal.classList.add('hidden');
      });
    }

    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title-input').value.trim();
        const date = document.getElementById('event-date-input').value;
        const startTime = document.getElementById('event-time-start').value;
        const endTime = document.getElementById('event-time-end').value;
        const category = document.getElementById('event-category-select').value;
        const description = document.getElementById('event-desc-input').value.trim();
        const notifyDiscord = document.getElementById('event-discord-toggle').checked;
        const discordAlertTime = document.getElementById('event-discord-timing').value;

        if (!title || !date) {
          alert('Please enter a title and date.');
          return;
        }

        Calendar.addEvent({
          title,
          date,
          startTime,
          endTime,
          category,
          description,
          notifyDiscord,
          discordAlertTime
        });

        eventForm.reset();
        eventModal.classList.add('hidden');
      });
    }

    // Note editor modal handlers
    const openNoteBtn = document.getElementById('btn-open-new-note');
    const closeNoteBtn = document.getElementById('btn-close-note-modal');
    const saveNoteBtn = document.getElementById('btn-save-note');
    const noteContentInput = document.getElementById('note-content-input');

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
      });
    }

    if (noteContentInput) {
      noteContentInput.addEventListener('input', () => {
        Notes.updatePreview();
      });
    }
  },

  setupDiscordSettings() {
    const webhookInput = document.getElementById('discord-webhook-url');
    const saveWebhookBtn = document.getElementById('btn-save-discord-webhook');
    const testWebhookBtn = document.getElementById('btn-test-discord-webhook');

    // Load saved webhook
    const savedUrl = localStorage.getItem('calnotes_discord_webhook') || '';
    if (webhookInput) {
      webhookInput.value = savedUrl;
    }

    if (saveWebhookBtn) {
      saveWebhookBtn.addEventListener('click', () => {
        const url = webhookInput.value.trim();
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

        App.showToast('Sending test alert to Discord...');

        try {
          const payload = {
            embeds: [
              {
                title: "📅 Calendar Alert: Test Notification",
                description: "Your **Calendar-Notes-Discord** integration is successfully connected!",
                color: 3870678, // #3b82f6
                fields: [
                  { name: "Time", value: "Now", inline: true },
                  { name: "Status", value: "Active", inline: true }
                ],
                footer: { text: "Calendar-Notes-Discord Open Source System" },
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
            App.showToast('Test notification delivered to Discord!');
          } else {
            alert(`Discord responded with error status: ${res.status}`);
          }
        } catch (err) {
          alert(`Could not deliver to webhook (likely blocked by CORS in pure browser mode). In production, the Python backend sends this server-side! Error: ${err.message}`);
        }
      });
    }
  },

  updateDiscordPreview() {
    const previewEl = document.getElementById('discord-embed-preview');
    if (!previewEl) return;

    // Show simulated next alert
    const nextAlertEvent = Calendar.events.find(e => e.notifyDiscord) || Calendar.events[0];
    if (nextAlertEvent) {
      document.getElementById('discord-preview-title').textContent = `📅 Calendar Alert: ${nextAlertEvent.title}`;
      document.getElementById('discord-preview-time').textContent = `${nextAlertEvent.date} at ${nextAlertEvent.startTime || 'All Day'}`;
      document.getElementById('discord-preview-desc').textContent = nextAlertEvent.description || 'No description';
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
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup downloaded successfully!');
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
