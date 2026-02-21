window.reExtUpgrade = {
    data: { allCards: [], selectedIds: new Set(), isScanned: false },
    // Веса для правильной сортировки (чем больше число, тем выше ранг)
    RANK_WEIGHT: { 
        'rank_re': 8, 'rank_s': 7, 'rank_a': 6, 'rank_b': 5, 
        'rank_c': 4, 'rank_d': 3, 'rank_e': 2, 'rank_f': 1 
    },

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

        this.data.allCards = [];
        let page = 1, hasNext = true;
        const baseUrl = `https://api.remanga.org/api/v2/inventory/${userId}/?count=100&exclude_card__rank__in=rank_a&exclude_card__rank__in=rank_re&exclude_card__rank__in=rank_s&type=cards`;

        try {
            while (hasNext) {
                status.innerText = `Загрузка страницы ${page}...`;
                const res = await new Promise(r => chrome.runtime.sendMessage({ 
                    action: "fetch_api", 
                    url: `${baseUrl}&page=${page}`, 
                    token: window.reExt.getAuthToken() 
                }, r));

                if (res?.success) {
                    const results = res.data.results || [];
                    this.data.allCards.push(...results);
                    hasNext = !!res.data.next;
                    page++;
                } else break;
            }

            this.data.isScanned = true;
            this.fillFilters();
            this.applyFilters();
            
            document.getElementById('ext-upg-scan-block').style.display = 'none';
            document.getElementById('ext-upg-filters-block').style.display = 'flex';
        } catch (e) {
            status.innerText = "Ошибка API";
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    },

    fillFilters() {
        const titles = new Map();
        const ranks = new Set();
        this.data.allCards.forEach(c => {
            ranks.add(c.card.rank);
            titles.set(c.card.title.dir, c.card.title.main_name);
        });

        const rc = document.getElementById('ext-upg-ranks-container');
        rc.innerHTML = '';
        
        // Сортируем ранги так, чтобы B был первым (от большего веса к меньшему)
        const sortedRanks = [...ranks].sort((a, b) => (this.RANK_WEIGHT[b] || 0) - (this.RANK_WEIGHT[a] || 0));

        sortedRanks.forEach(rank => {
            const label = document.createElement('label');
            label.style = "font-size:10px; background:#333; padding:2px 5px; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:3px;";
            label.innerHTML = `<input type="checkbox" value="${rank}" checked> ${rank.replace('rank_', '').toUpperCase()}`;
            label.querySelector('input').addEventListener('change', () => this.applyFilters());
            rc.appendChild(label);
        });

        const ts = document.getElementById('ext-upg-title-select');
        ts.innerHTML = '<option value="all">Все тайтлы</option>';
        [...titles.entries()].sort((a,b) => a[1].localeCompare(b[1])).forEach(([dir, name]) => {
            const opt = document.createElement('option');
            opt.value = dir;
            opt.innerText = name;
            ts.appendChild(opt);
        });
    },

    applyFilters() {
        if (!this.data.isScanned) return;
        const checkedRanks = Array.from(document.querySelectorAll('#ext-upg-ranks-container input:checked')).map(i => i.value);
        const titleDir = document.getElementById('ext-upg-title-select').value;
        const sortMode = document.getElementById('ext-upg-sort-select').value;

        let filtered = this.data.allCards.filter(c => 
            checkedRanks.includes(c.card.rank) && 
            (titleDir === 'all' || c.card.title.dir === titleDir)
        );

        filtered.sort((a, b) => {
            const wA = this.RANK_WEIGHT[a.card.rank] || 0;
            const wB = this.RANK_WEIGHT[b.card.rank] || 0;
            if (sortMode === 'rank_desc') return wB - wA; // По убыванию (B -> F)
            if (sortMode === 'rank_asc') return wA - wB;  // По возрастанию (F -> B)
            if (sortMode === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            return 0;
        });

        this.render(filtered);
    },

    render(cards) {
        let grid = document.querySelector('div.grid.grid-cols-3');
        if (!grid) {
            const anyCard = document.querySelector('div.border-border.relative');
            if (anyCard) grid = anyCard.parentElement;
        }
        if (!grid) return;
        
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        
        cards.forEach(c => {
            const el = document.createElement('div');
            el.className = "border-border relative rounded-xs border cursor-pointer hover:opacity-80 transition-all";
            el.style.aspectRatio = "2/3";
            
            if (this.data.selectedIds.has(c.id)) {
                el.style.outline = "3px solid #ff9900";
                el.style.outlineOffset = "-3px";
            }
            
            el.innerHTML = `
                <img src="https://remanga.org/media/${c.card.cover.mid}" class="h-full w-full object-cover rounded-xs" loading="lazy">
                <div class="absolute bottom-0 w-full bg-black/70 text-[10px] text-center py-0.5">
                    ${c.card.rank.replace('rank_', '').toUpperCase()}
                </div>`;
            
            el.addEventListener('click', () => {
                if (this.data.selectedIds.has(c.id)) {
                    this.data.selectedIds.delete(c.id);
                    el.style.outline = "none";
                } else {
                    this.data.selectedIds.add(c.id);
                    el.style.outline = "3px solid #ff9900";
                    el.style.outlineOffset = "-3px";
                }
            });
            frag.appendChild(el);
        });
        
        grid.appendChild(frag);
        document.getElementById('ext-upg-count').innerText = cards.length;
    }
};