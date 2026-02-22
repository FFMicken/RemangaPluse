(function() {
    let prevUrl = '';

    function initUpgradeUI() {
        if (document.getElementById('ext-upgrade-ui')) return;

        const div = document.createElement('div');
        div.id = 'ext-upgrade-ui';
        div.style = `
            position: fixed; bottom: 20px; right: 20px; z-index: 10000;
            background: #1a1a1d; color: #fff; padding: 15px;
            border-radius: 12px; border: 1px solid #ff9900;
            font-family: sans-serif; width: 240px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; gap: 10px;
        `;

        div.innerHTML = `
            <div style="font-weight:bold; color:#ff9900; text-align:center; border-bottom:1px solid #333; padding-bottom:5px;">⚙️ ИНВЕНТАРЬ+</div>
            
            <div id="ext-upg-scan-block">
                <button id="ext-upg-scan-btn" style="width:100%; background:#ff9900; border:none; color:#000; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">
                    ЗАГРУЗИТЬ ЧЕРЕЗ API
                </button>
                <div id="ext-upg-status" style="font-size:11px; text-align:center; margin-top:8px; color:#aaa;"></div>
            </div>

            <div id="ext-upg-filters-block" style="display:none; flex-direction:column; gap:10px;">
                <div>
                    <div style="font-size:11px; color:#888; margin-bottom:4px;">Ранги:</div>
                    <div id="ext-upg-ranks-container" style="display:flex; flex-wrap:wrap; gap:5px;"></div>
                </div>

                <select id="ext-upg-title-select" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:6px; border-radius:4px; font-size:12px;"></select>

                <select id="ext-upg-sort-select" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:6px; border-radius:4px; font-size:12px;">
                    <option value="rank_desc">По убыванию (ранг)</option>
                    <option value="rank_asc">По возрастанию (ранг)</option>
                    <option value="newest">Сначала новые</option>
                </select>

                <div style="font-size:11px; color:#555; text-align:center; border-top:1px solid #333; padding-top:8px;">
                    Видно: <span id="ext-upg-count">0</span>
                </div>
            </div>
        `;

        document.body.appendChild(div);

        document.getElementById('ext-upg-scan-btn').addEventListener('click', () => window.reExtUpgrade.startScan());
        document.getElementById('ext-upg-title-select').addEventListener('change', () => window.reExtUpgrade.applyFilters());
        document.getElementById('ext-upg-sort-select').addEventListener('change', () => window.reExtUpgrade.applyFilters());
    }

    setInterval(() => {
        const url = window.location.href;
        
        window.reExtOnline.check();

        if (url.includes('/user/notifications/')) {
            window.reExtNotif.init();
        }

        if (url.includes('/user/inventory/cards-upgrade')) {
            initUpgradeUI();
            document.getElementById('ext-upgrade-ui').style.display = 'flex';
        } else if (document.getElementById('ext-upgrade-ui')) {
            document.getElementById('ext-upgrade-ui').style.display = 'none';
        }

        if (url !== prevUrl) {
            prevUrl = url;
            if (!url.includes('/cards-upgrade')) {
                window.reExtUpgrade.data.isScanned = false;
                window.reExtUpgrade.data.selectedIds.clear();
            }
        }
    }, 1000);
})();