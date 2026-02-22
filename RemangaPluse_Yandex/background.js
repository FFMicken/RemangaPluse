chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "check_online_status") {
        const apiUrl = `https://api.remanga.org/api/v2/users/${message.userId}/`;
        fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
        .then(res => res.ok ? res.json() : { is_online: false })
        .then(data => {
            const online = data.hasOwnProperty('is_online') ? data.is_online : (data.content?.is_online || false);
            sendResponse({ isOnline: online });
        })
        .catch(() => sendResponse({ isOnline: false }));
        return true; 
    }

    if (message.action === "fetch_api") {
        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        };
        if (message.token) headers['Authorization'] = `Bearer ${message.token}`;

        fetch(message.url, { method: 'GET', headers: headers })
        .then(async (res) => {
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            const data = await res.json();
            sendResponse({ success: true, data: data });
        })
        .catch(err => sendResponse({ success: false, error: err.toString() }));
        return true; 
    }
});