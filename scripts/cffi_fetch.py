"""Fetch a URL using curl_cffi with Chrome TLS/HTTP2 fingerprint impersonation.

Usage: python cffi_fetch.py <url> <timeout_ms> [accept_language]

Output format (matches curl -w):
  <body>\n<http_status_code>\n<retry_after>
"""

import sys


def main():
    if len(sys.argv) < 3:
        print("Usage: cffi_fetch.py <url> <timeout_ms> [accept_language]", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    timeout_s = max(1, int(sys.argv[2]) // 1000)
    accept_lang = sys.argv[3] if len(sys.argv) > 3 else None

    from curl_cffi import requests as cffi_requests

    headers = {}
    if accept_lang:
        headers["Accept-Language"] = accept_lang

    try:
        r = cffi_requests.get(
            url,
            impersonate="chrome",
            timeout=timeout_s,
            allow_redirects=True,
            headers=headers,
        )
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    body = r.text
    retry_after = r.headers.get("retry-after", "")

    sys.stdout.write(body)
    sys.stdout.write(f"\n{r.status_code}\n{retry_after}")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
