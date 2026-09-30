/**
 * Calendar Module - Calendar-Notes-Discord
 * Handles month navigation, day selection, event management, and local storage sync.
 */

const Calendar = {
  currentDate: new Date(),
  selectedDate: new Date().toISOString().split('T')[0],
  events: [],

  init() {
    this.loadEvents();
    this.renderMonth();
    this.selectDate(this.selectedDate);
  },

  loadEvents() {
    const saved = localStorage.getItem('calnotes_events');
    if (saved) {
      try {
        this.events = JSON.parse(saved);
      } catch (e) {
        this.events = [];
      }
    } else {
      // Starter sample events
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      this.events = [
        {
          id: 'evt-1',
          title: 'Welcome to Calendar-Notes-Discord',
          date: todayStr,
          startTime: '09:00',
          endTime: '10:00',
          category: 'work',
          description: 'Explore your self-hosted mobile calendar and notes system!',
          notifyDiscord: true,
          discordAlertTime: '15m'
        },
        {
          id: 'evt-2',
          title: 'Review Discord Alert Webhook',
          date: todayStr,
          startTime: '14:30',
          endTime: '15:00',
          category: 'urgent',
          description: 'Configure Discord channel integration for calendar reminders.',
          notifyDiscord: true,
          discordAlertTime: 'at_time'
        },
        {
          id: 'evt-3',
          title: 'Tailscale Mobile Test',
          date: tomorrowStr,
          startTime: '11:00',
          endTime: '11:45',
          category: 'personal',
          description: 'Add this web app to iPhone/Android home screen over Tailscale.',
          notifyDiscord: false,
          discordAlertTime: '1h'
        }
      ];
      this.saveEvents();
    }
  },

  saveEvents() {
    localStorage.setItem('calnotes_events', JSON.stringify(this.events));
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderMonth();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderMonth();
  },

  goToToday() {
    this.currentDate = new Date();
    const todayStr = this.currentDate.toISOString().split('T')[0];
    this.renderMonth();
    this.selectDate(todayStr);
  },

  getCategoryColor(category) {
    switch (category) {
      case 'work': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', dot: 'bg-blue-400' };
      case 'personal': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: 'bg-emerald-400' };
      case 'urgent': return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', dot: 'bg-rose-400' };
      case 'routine': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', dot: 'bg-purple-400' };
      default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/40', dot: 'bg-slate-400' };
    }
  },

  renderMonth() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const titleEl = document.getElementById('calendar-month-title');
    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell flex flex-col items-center justify-start p-1 rounded-lg text-slate-600 opacity-40 hover:opacity-60 cursor-pointer text-xs md:text-sm';
      cell.innerHTML = `<span>${dayNum}</span>`;
      grid.appendChild(cell);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = (dateStr === todayStr);
      const isSelected = (dateStr === this.selectedDate);

      // Check events on this day
      const dayEvents = this.events.filter(e => e.date === dateStr);

      const cell = document.createElement('div');
      let baseClass = 'calendar-day-cell relative flex flex-col items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all duration-150 ';

      if (isSelected) {
        baseClass += 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-semibold ring-2 ring-blue-400 ';
      } else if (isToday) {
        baseClass += 'bg-slate-800 text-blue-400 font-bold border border-blue-500/40 hover:bg-slate-700 ';
      } else {
        baseClass += 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 border border-slate-700/30 ';
      }

      cell.className = baseClass;
      cell.onclick = () => this.selectDate(dateStr);

      // Dots or badges for events
      let indicatorHtml = '';
      if (dayEvents.length > 0) {
        const dots = dayEvents.slice(0, 3).map(e => {
          const col = this.getCategoryColor(e.category);
          return `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : col.dot}"></span>`;
        }).join('');

        indicatorHtml = `<div class="flex items-center gap-0.5 mt-1">${dots}${dayEvents.length > 3 ? '<span class="text-[9px] leading-none">+</span>' : ''}</div>`;
      }

      cell.innerHTML = `
        <span class="text-xs md:text-sm leading-none">${day}</span>
        ${indicatorHtml}
      `;

      grid.appendChild(cell);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.renderMonth();
    this.renderDayEvents(dateStr);

    // Update note-link date if available
    const noteDateBadge = document.getElementById('selected-date-badge');
    if (noteDateBadge) {
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      noteDateBadge.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  },

  renderDayEvents(dateStr) {
    const container = document.getElementById('day-events-container');
    const headerEl = document.getElementById('day-events-header');
    if (!container) return;

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const formattedDate = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    if (headerEl) {
      headerEl.textContent = `Schedule for ${formattedDate}`;
    }

    const dayEvents = this.events.filter(e => e.date === dateStr);

    if (dayEvents.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-700/60 rounded-2xl bg-slate-900/30">
          <i data-lucide="calendar-x" class="w-8 h-8 mb-2 opacity-50"></i>
          <p class="text-sm font-medium text-slate-400">No events scheduled for this day</p>
          <p class="text-xs text-slate-500 mt-1">Tap "+ Event" to add a meeting, reminder, or Discord alert.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Sort by startTime
    dayEvents.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    container.innerHTML = dayEvents.map(event => {
      const col = this.getCategoryColor(event.category);
      return `
        <div class="flex items-start justify-between p-3.5 rounded-xl ${col.bg} border ${col.border} transition hover:scale-[1.01]">
          <div class="flex-1 pr-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${col.dot}"></span>
              <h4 class="text-sm font-semibold text-slate-100">${escapeHtml(event.title)}</h4>
              ${event.notifyDiscord ? `
                <span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <i data-lucide="bell" class="w-2.5 h-2.5"></i> Discord Alert
                </span>
              ` : ''}
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span class="font-mono text-slate-300">
                ${event.startTime ? `${event.startTime} - ${event.endTime || 'End'}` : 'All Day'}
              </span>
              <span>•</span>
              <span class="capitalize text-slate-400">${event.category}</span>
            </div>
            ${event.description ? `<p class="text-xs text-slate-300 mt-1.5 leading-relaxed">${escapeHtml(event.description)}</p>` : ''}
          </div>
          <button onclick="Calendar.deleteEvent('${event.id}')" class="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition" title="Delete event">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  addEvent(event) {
    this.events.push({
      ...event,
      id: 'evt-' + Date.now()
    });
    this.saveEvents();
    this.renderMonth();
    this.renderDayEvents(this.selectedDate);
    App.showToast('Event added successfully!');
  },

  deleteEvent(id) {
    if (confirm('Delete this event?')) {
      this.events = this.events.filter(e => e.id !== id);
      this.saveEvents();
      this.renderMonth();
      this.renderDayEvents(this.selectedDate);
      App.showToast('Event removed');
    }
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
