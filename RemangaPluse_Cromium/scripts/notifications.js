window.reExtNotif = {
    currentPage: 2,
    isFetching: false,
    hasMore: true,
    urlContext: '',
    loader: null,
    
    TYPES: {
        'social-comments-personal': ['new_reply_on_your_comment', 'new_comment_under_post'],
        'social-updates-personal': ['comment_rank', 'new_post_by_user', 'new_friendship_request', 'friendship_request_accepted', 'friendship_request_rejected', 'new_exchange_request', 'exchange_request_accepted', 'exchange_request_rejected', 'you_got_something', 'happy_birthday', 'two_factor_authentication', 'your_card_was_dropped_in_random_deck', 'your_was_invited_to_publisher'],
        'social-updates-publisher': ['new_post_by_publisher'],
        'social-updates-club': ['new_post_by_club', 'club_level_up', 'club_new_regression', 'you_were_kicked', 'delay_club_deleting', 'club_was_deleted', 'new_club_invite_request', 'club_invite_rejected', 'you_joined_club', 'your_weekly_club_reward_card_gift'],
        'social-general': ['bp_new_season', 'bp_end_season', 'bp_can_claim_reward', 'bp_remind_reward'],
        'important-payments': ['payment_success', 'payment_failure', 'payment_success_with_bonus', 'success_adv_purchase', 'success_buy_premium', 'success_continue_premium', 'failure_continue_premium', 'premium_was_ended', 'premium_will_continue_tomorrow', 'not_enough_money_to_continue_premium_tomorrow', 'not_enough_money_to_continue_premium', 'partial_refunded', 'full_refunded', 'double_refund', 'refund_for_some_bought_chapters', 'special_offer', 'burn_tickets', 'free_tickets', 'not_enough_money_on_your_card', 'your_card_was_lost'],
        'important-system': ['custom_notification', 'panel_request_notification', 'new_request_to_monetization', 'monetization_request_accepted', 'monetization_request_rejected', 'tech_work', 'your_report_reaction', 'your_scan_was_rejected', 'your_team_got_strike', 'your_card_was_deleted', 'cannot_add_new_card']
    },

    init() {
        const currentUrl = window.location.href;
        
        // Проверяем, изменилась ли вкладка (через URL)
        if (this.urlContext !== currentUrl) {
            this.urlContext = currentUrl;
            this.reset();
        }

        if (!this.loader) {
            this.loader = document.createElement('div');
            this.loader.id = 'ext-notifications-loader';
            this.loader.style = 'text-align: center; padding: 25px; color: #ff9900; font-weight: bold; width: 100%; clear: both; order: 99999;';
            this.loader.innerText = 'Загрузка истории...';
            
            this.observer = new IntersectionObserver(e => {
                if (e[0].isIntersecting && !this.isFetching && this.hasMore) {
                    this.fetchNext();
                }
            }, { rootMargin: '400px' });
        }

        const container = this.getContainer();
        if (container) {
            // Если лоадера нет в текущем контейнере или он не в конце - перемещаем вниз
            if (container.lastElementChild !== this.loader) {
                container.appendChild(this.loader);
                this.observer.observe(this.loader);
            }
            this.loader.style.display = 'block';
        }
    },

    reset() {
        this.currentPage = 2;
        this.hasMore = true;
        this.isFetching = false;
        // Удаляем только те элементы, которые добавило расширение
        document.querySelectorAll('.remanga-ext-item').forEach(el => el.remove());
        if (this.loader) {
            this.loader.innerText = 'Загрузка истории...';
            this.loader.style.color = '#ff9900';
        }
    },

    getContainer() {
        // Ищем контейнер, где лежат карточки уведомлений
        const selectors = [
            'div[data-sentry-component="FlatListLayout"]',
            'div[data-sentry-component="NotificationListAggregated"] > div',
            'div[data-slot="card"]'
        ];

        for (let s of selectors) {
            const el = document.querySelector(s);
            if (el) return el.hasAttribute('data-slot') ? el.parentElement : el;
        }
        return null;
    },

    fetchNext() {
        if (this.isFetching || !this.hasMore) return;
        
        this.isFetching = true;
        const url = new URL(window.location.href);
        const subTab = url.searchParams.get('subTab') || 'social-all';
        const isRead = url.searchParams.get('status') === '1';
        
        let types = [];
        if (subTab === 'social-all') {
            types = [
                ...this.TYPES['social-comments-personal'], 
                ...this.TYPES['social-updates-personal'], 
                ...this.TYPES['social-updates-publisher'], 
                ...this.TYPES['social-updates-club'], 
                ...this.TYPES['social-general']
            ];
        } else {
            types = this.TYPES[subTab] || [];
        }

        const params = new URLSearchParams();
        params.append('is_read', isRead);
        params.append('page', this.currentPage);
        types.forEach(t => params.append('types', t));

        const apiUrl = `https://api.remanga.org/api/v2/users/notifications/?${params.toString()}`;

        chrome.runtime.sendMessage({ action: "fetch_api", url: apiUrl, token: window.reExt.getAuthToken() }, res => {
            if (res?.success) {
                const data = res.data.content || res.data || [];
                const items = Array.isArray(data) ? data : (data.results || []);
                
                if (items.length === 0) {
                    this.hasMore = false;
                    this.loader.innerText = 'Вся история загружена';
                    this.loader.style.color = '#555';
                } else {
                    this.render(items);
                    this.currentPage++;
                }
            } else {
                this.loader.innerText = 'Ошибка API. Попробуйте позже.';
            }
            this.isFetching = false;
        });
    },

    render(items) {
        const container = this.getContainer();
        if (!container) return;

        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const dateStr = new Date(item.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            let img = 'https://remanga.org/media/512logo.png';
            if (item.attachment) img = `https://remanga.org/media/${item.attachment}`;
            else if (item.image?.mid) img = `https://remanga.org/media/${item.image.mid}`;
            else if (item.sender?.avatar?.mid) img = `https://remanga.org/media/${item.sender.avatar.mid}`;

            const div = document.createElement('div');
            // Применяем родные классы ReManga для совместимости
            div.className = 'remanga-ext-item rounded-md border border-border bg-card p-3 mt-2 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer w-full';
            div.setAttribute('data-slot', 'card');
            
            const link = item.link || item.action_url || '#';

            div.innerHTML = `
                <a href="${link}" class="flex items-center gap-3 w-full">
                    <img src="${img}" style="width:40px; height:52px; border-radius:4px; object-fit:cover; flex-shrink:0;" onerror="this.src='https://remanga.org/media/512logo.png'">
                    <div style="flex:1; min-width:0;">
                        <p class="text-md font-normal text-foreground break-words leading-tight" style="overflow-wrap: anywhere;">${item.text || item.message || ''}</p>
                        <p class="text-[11px] text-muted-foreground mt-1">${dateStr}</p>
                    </div>
                </a>
            `;
            fragment.appendChild(div);
        });

        // Вставляем все новые элементы СТРОГО перед лоадером
        container.insertBefore(fragment, this.loader);
    }
};