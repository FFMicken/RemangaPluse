window.reExtUpgrade = {
    data: {
        apiCardsMap: new Map(),
        allRanks: new Set(),
        allTitles: new Map(),
        isApiLoaded: false
    },

    RANK_WEIGHT: {
        'rank_re': 8, 'rank_s': 7, 'rank_a': 6, 'rank_b': 5,
        'rank_c': 4, 'rank_d': 3, 'rank_e': 2, 'rank_f': 1
    },

    isInternalDomUpdate: false,
    isInteractingWithGrid: false,
    pendingSortAfterInteraction: false,
    gridInteractionBound: false,

    async startScan() {
        const status = document.getElementById('ext-upg-status');
        const btn = document.getElementById('ext-upg-scan-btn');
        const userId = await window.reExt.fetchCurrentUserId();

        if (!userId) {
            status.innerText = "Ошибка: не найден ID";
            return;
        }

        btn.disabled = true;
        btn.style.opacity = '0.5';

        this.data.apiCardsMap.clear();
        this.data.allRanks.clear();
        this.data.allTitles.clear();

        let page = 1;
        let hasNext = true;
        const baseUrl = `https://api.remanga.org/api/v2/inventory/${userId}/?count=100&exclude_card__rank__in=rank_a&exclude_card__rank__in=rank_re&exclude_card__rank__in=rank_s&type=cards`;

        try {
            while (hasNext) {
                status.innerText = `Загрузка списка из API... ${page}`;
                const res = await new Promise(r => chrome.runtime.sendMessage({
                    action: "fetch_api",
                    url: `${baseUrl}&page=${page}`,
                    token: window.reExt.getAuthToken()
                }, r));

                if (!res?.success) break;

                const results = res.data.results || [];
                results.forEach(item => {
                    const fileName = item.card.cover.mid.split('/').pop();
                    if (!fileName) return;

                    this.data.apiCardsMap.set(fileName, item);
                    this.data.allRanks.add(item.card.rank);
                    this.data.allTitles.set(item.card.title.dir, item.card.title.main_name);
                });

                hasNext = !!res.data.next;
                page++;
            }

            this.data.isApiLoaded = true;
            this.fillFilters();

            document.getElementById('ext-upg-scan-block').style.display = 'none';
            document.getElementById('ext-upg-filters-block').style.display = 'flex';

            this.applyFilters();
            this.initObserver();

            status.innerText = "Готово! Листайте вниз";
        } catch (e) {
            status.innerText = "Ошибка API";
            btn.disabled = false;
        }
    },

    fillFilters() {
        const rc = document.getElementById('ext-upg-ranks-container');
        rc.innerHTML = '';

        const sortedRanks = [...this.data.allRanks].sort((a, b) => (this.RANK_WEIGHT[b] || 0) - (this.RANK_WEIGHT[a] || 0));

        sortedRanks.forEach(rank => {
            const label = document.createElement('label');
            label.style = "font-size:10px; background:#333; padding:2px 5px; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:3px;";
            label.innerHTML = `<input type="checkbox" value="${rank}" checked> ${rank.replace('rank_', '').toUpperCase()}`;
            label.querySelector('input').addEventListener('change', () => this.applyFilters());
            rc.appendChild(label);
        });

        const ts = document.getElementById('ext-upg-title-select');
        ts.innerHTML = '<option value="all">Все тайтлы</option>';
        [...this.data.allTitles.entries()].sort((a, b) => a[1].localeCompare(b[1])).forEach(([dir, name]) => {
            ts.innerHTML += `<option value="${dir}">${name}</option>`;
        });
    },

    processNode(node) {
        if (!this.data.isApiLoaded) return;

        const img = node.querySelector('img');
        if (!img) return;

        const src = img.getAttribute('src') || "";
        const fileName = src.split('/').pop();
        const info = this.data.apiCardsMap.get(fileName);

        if (!info) return;

        const checkedRanks = Array.from(document.querySelectorAll('#ext-upg-ranks-container input:checked')).map(i => i.value);
        const selectedTitle = document.getElementById('ext-upg-title-select').value;

        const matchRank = checkedRanks.includes(info.card.rank);
        const matchTitle = selectedTitle === 'all' || info.card.title.dir === selectedTitle;

        if (matchRank && matchTitle) {
            node.style.display = '';
            node.setAttribute('data-rank-weight', this.RANK_WEIGHT[info.card.rank] || 0);
            node.setAttribute('data-created-at', info.created_at);
        } else {
            node.style.display = 'none';
        }
    },

    applyFilters() {
        const grid = document.querySelector('div.grid.grid-cols-3');
        if (!grid) return;

        this.bindGridInteraction(grid);

        Array.from(grid.children).forEach(node => {
            if (node.nodeType === 1) this.processNode(node);
        });

        this.sortNodes();
    },

    sortNodes() {
        const grid = document.querySelector('div.grid.grid-cols-3');
        if (!grid) return;

        const sortMode = document.getElementById('ext-upg-sort-select').value;
        const children = Array.from(grid.children).filter(c => c.hasAttribute('data-rank-weight'));

        if (this.isInteractingWithGrid) {
            this.pendingSortAfterInteraction = true;
            const visibleCountWhileInteracting = children.filter(c => c.style.display !== 'none').length;
            document.getElementById('ext-upg-count').innerText = visibleCountWhileInteracting;
            return;
        }

        const sorted = [...children];
        sorted.sort((a, b) => {
            const valA = parseInt(a.getAttribute('data-rank-weight') || 0, 10);
            const valB = parseInt(b.getAttribute('data-rank-weight') || 0, 10);
            const dateA = new Date(a.getAttribute('data-created-at') || 0);
            const dateB = new Date(b.getAttribute('data-created-at') || 0);

            if (sortMode === 'rank_desc') return valB - valA;
            if (sortMode === 'rank_asc') return valA - valB;
            if (sortMode === 'newest') return dateB - dateA;
            return 0;
        });

        const orderChanged = sorted.some((node, index) => node !== children[index]);
        if (orderChanged) {
            this.isInternalDomUpdate = true;
            sorted.forEach(child => grid.appendChild(child));
            this.isInternalDomUpdate = false;
        }

        const visibleCount = children.filter(c => c.style.display !== 'none').length;
        document.getElementById('ext-upg-count').innerText = visibleCount;
    },

    initObserver() {
        if (this.observer) this.observer.disconnect();

        const grid = document.querySelector('div.grid.grid-cols-3');
        if (!grid) return;

        this.bindGridInteraction(grid);

        this.observer = new MutationObserver((mutations) => {
            if (this.isInternalDomUpdate) return;

            let hasNewNodes = false;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        this.processNode(node);
                        hasNewNodes = true;
                    }
                }
            }

            if (hasNewNodes) {
                clearTimeout(this.sortDelay);
                this.sortDelay = setTimeout(() => this.sortNodes(), 120);
            }
        });

        this.observer.observe(grid, { childList: true });
    },

    bindGridInteraction(grid) {
        if (this.gridInteractionBound || !grid) return;

        grid.addEventListener('mouseenter', () => {
            this.isInteractingWithGrid = true;
        });

        grid.addEventListener('mouseleave', () => {
            this.isInteractingWithGrid = false;
            if (this.pendingSortAfterInteraction) {
                this.pendingSortAfterInteraction = false;
                this.sortNodes();
            }
        });

        this.gridInteractionBound = true;
    }
};
