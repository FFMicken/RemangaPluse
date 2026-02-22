window.reExt = {
    getAuthToken: function() {
        let token = localStorage.getItem('access_token');
        if (!token) {
            try {
                const persistAuth = JSON.parse(localStorage.getItem('persist:auth'));
                if (persistAuth && persistAuth.token) token = JSON.parse(persistAuth.token);
            } catch(e) {}
        }
        return token;
    },

    currentUserId: null,
    fetchCurrentUserId: async function() {
        if (this.currentUserId) return this.currentUserId;
        const avatar = document.querySelector('img[src*="/media/users/"]');
        if (avatar) {
            const match = avatar.src.match(/users\/(\d+)\//);
            if (match) return this.currentUserId = match[1];
        }
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ 
                action: "fetch_api", 
                url: "https://api.remanga.org/api/v2/users/current/",
                token: this.getAuthToken()
            }, (res) => {
                resolve(this.currentUserId = (res?.success && res.data?.id) || null);
            });
        });
    }
};