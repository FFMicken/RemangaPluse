window.reExtOnline = {
    checkedUsers: new Map(),

    async check() {
        if (!window.location.href.includes('/card/')) return;
        const nodes = document.querySelectorAll('div[data-index]:not([data-farmer-checked])');
        for (const node of nodes) {
            const userId = node.getAttribute('data-index');
            if (!userId || !/^\d+$/.test(userId)) continue;
            node.setAttribute('data-farmer-checked', 'pending');
            
            let isOnline = false;
            if (this.checkedUsers.has(userId)) {
                isOnline = this.checkedUsers.get(userId);
            } else {
                const res = await new Promise(r => chrome.runtime.sendMessage({ action: "check_online_status", userId }, r));
                isOnline = res?.isOnline || false;
                this.checkedUsers.set(userId, isOnline);
            }
            
            this.injectBadge(node, isOnline);
            node.setAttribute('data-farmer-checked', 'true');
        }
    },

    injectBadge(node, isOnline) {
        const container = node.querySelector('span[data-sentry-component="Avatar"]') || node.querySelector('.h-full.w-full') || node.querySelector('img')?.parentElement;
        if (!container || container.querySelector('.online-status-dot')) return;
        const dot = document.createElement('span');
        dot.className = 'online-status-dot';
        dot.style = `position: absolute; bottom: 5%; right: 5%; width: 11px; height: 11px; border-radius: 50%; border: 2px solid #1a1a1d; z-index: 10; background-color: ${isOnline ? '#22c55e' : '#ef4444'}; box-shadow: 0 0 3px rgba(0,0,0,0.5);`;
        if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
        container.appendChild(dot);
    }
};