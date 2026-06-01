(function () {
    'use strict';

    try {
        var el =
            document.currentScript ||
            document.querySelector('script[data-key]');
        if (!el) return;

        var key = el.getAttribute('data-key');
        if (!key) return;

        var host = location.hostname;
        if (
            !host ||
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host === '0.0.0.0' ||
            host === '::1' ||
            location.protocol === 'file:'
        ) return;

        var endpoint = new URL(el.src).origin + '/api/collect';

        var payload = JSON.stringify({
            key: key,
            url: location.origin + location.pathname,
            referrer: document.referrer || '',
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, payload);
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: payload,
                keepalive: true,
                mode: 'no-cors',
            });
        }
    } catch (e) {}
})();
