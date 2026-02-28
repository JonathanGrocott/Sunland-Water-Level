import https from 'node:https';
import axios from 'axios';

const TLS_ERROR_CODES = new Set([
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'CERT_HAS_EXPIRED',
    'ERR_TLS_CERT_ALTNAME_INVALID'
]);

const USER_AGENT = 'Sunland-Water-Level/1.0 (+https://sunland-water-level.vercel.app)';
const REQUEST_TIMEOUT_MS = 20000;

function isTlsCertificateError(error) {
    const code = error?.cause?.code || error?.code || '';
    const message = String(error?.message || '');

    if (TLS_ERROR_CODES.has(code)) return true;
    return /certificate|tls|ssl|fetch failed/i.test(message);
}

export async function fetchUsaceJson(url) {
    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json, text/plain, */*',
                'User-Agent': USER_AGENT
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (!response.ok) {
            throw new Error(`USACE API responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (!isTlsCertificateError(error)) {
            throw error;
        }

        // TLS certificate chain issues on the USACE endpoint can fail in Node runtime.
        // Fallback to an HTTPS client that ignores the broken chain for this public data source.
        const insecureAgent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(url, {
            httpsAgent: insecureAgent,
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                Accept: 'application/json, text/plain, */*',
                'User-Agent': USER_AGENT
            }
        });

        return response.data;
    }
}
