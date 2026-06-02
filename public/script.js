(function () {
    'use strict';

    try {
        if (window.__analyticosLoaded) return;

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
        )
            return;

        window.__analyticosLoaded = true;

        var endpoint = new URL(el.src).origin + '/api/collect';
        var lastUrl = '';

        function send() {
            var url = location.origin + location.pathname;
            if (url === lastUrl) return;
            lastUrl = url;

            var payload = JSON.stringify({
                key: key,
                url: url,
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
        }

        send();

        var originalPushState = history.pushState;
        history.pushState = function () {
            var ret = originalPushState.apply(this, arguments);
            window.dispatchEvent(new Event('analyticos:locationchange'));
            return ret;
        };

        var originalReplaceState = history.replaceState;
        history.replaceState = function () {
            var ret = originalReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('analyticos:locationchange'));
            return ret;
        };

        window.addEventListener('popstate', function () {
            window.dispatchEvent(new Event('analyticos:locationchange'));
        });

        window.addEventListener('analyticos:locationchange', send);
    } catch {}
})();
