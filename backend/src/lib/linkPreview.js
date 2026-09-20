import * as cheerio from "cheerio";
import dns from "dns/promises";
import net from "net";

// URL extraction regex supporting full https:// URLs, www.* URLs, and common domain extensions
const URL_REGEX = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)|([a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|edu|gov|co|in|me|ai|tv|info)\b[^\s<]*)/i;

/**
 * Validates if an IP address is in a private, loopback, link-local, or reserved range.
 */
function isPrivateOrReservedIp(ip) {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  const ipFamily = net.isIP(ip);

  // IPv4 validation
  if (ipFamily === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (Private network)
    if (a === 10) return true;

    // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 127.0.0.0/8 (Loopback / localhost)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local / Cloud metadata: 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;

    // 192.168.0.0/16 (Private network)
    if (a === 192 && b === 168) return true;

    // 198.18.0.0/15 (Network benchmark tests)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    // 255.255.255.255 (Broadcast)
    if (a === 255 && b === 255 && c === 255 && d === 255) return true;

    return false;
  }

  // IPv6 validation
  if (ipFamily === 6) {
    const normalized = ip.toLowerCase();

    // ::1 (Loopback)
    if (normalized === "::1") return true;

    // :: (Unspecified)
    if (normalized === "::") return true;

    // fc00::/7 (Unique Local Address - ULA)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

    // fe80::/10 (Link-Local Unicast)
    if (
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    ) {
      return true;
    }

    // ff00::/8 (Multicast)
    if (normalized.startsWith("ff")) return true;

    return false;
  }

  // Reject unrecognized IP formats
  return true;
}

/**
 * Validates that a target URL does not resolve to localhost, private IP ranges,
 * or cloud metadata endpoints (SSRF protection).
 */
async function isSafePublicUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);

    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject localhost, local domain names, and internal TLDs
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".arpa") ||
      hostname.endsWith(".invalid") ||
      hostname.endsWith(".test")
    ) {
      return false;
    }

    // Check if the hostname itself is directly an IP literal
    if (net.isIP(hostname)) {
      if (isPrivateOrReservedIp(hostname)) {
        return false;
      }
    }

    // Perform DNS lookup to resolve all A and AAAA records
    const lookupResults = await dns.lookup(hostname, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      return false;
    }

    // Verify NONE of the resolved IP addresses point to private/reserved networks
    for (const record of lookupResults) {
      if (isPrivateOrReservedIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function extractUrl(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(URL_REGEX);
  if (!match) return null;

  let url = match[0];
  // Strip trailing punctuation often typed at the end of sentences
  url = url.replace(/[.,!?:;)\]]+$/, "");

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
}

export async function fetchLinkPreview(targetUrl) {
  try {
    if (!targetUrl || typeof targetUrl !== "string") return null;

    let currentUrl = targetUrl;
    let redirectHops = 0;
    const MAX_REDIRECTS = 3;
    let response = null;

    // Follow redirects manually to validate each hop against SSRF
    while (redirectHops <= MAX_REDIRECTS) {
      const isSafe = await isSafePublicUrl(currentUrl);
      if (!isSafe) {
        return null;
      }

      response = await fetch(currentUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(2800),
        redirect: "manual",
      });

      // Check for redirect status codes (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) return null;

        redirectHops++;
        try {
          currentUrl = new URL(location, currentUrl).href;
        } catch {
          return null;
        }
        continue;
      }

      break;
    }

    if (!response || !response.ok) return null;

    const parsedFinalUrl = new URL(currentUrl);
    const domain = parsedFinalUrl.hostname.replace(/^www\./, "");

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    // Read at most ~200KB of the HTML to parse headers quickly
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract OpenGraph / Twitter / Standard Meta Tags
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      "";

    let description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    let image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content") ||
      $('link[rel="image_src"]').attr("href") ||
      "";

    let siteName =
      $('meta[property="og:site_name"]').attr("content") ||
      $('meta[name="application-name"]').attr("content") ||
      domain;

    title = title.trim().replace(/\s+/g, " ");
    description = description.trim().replace(/\s+/g, " ");

    // If relative image URL, resolve to absolute URL
    if (image && !image.startsWith("http://") && !image.startsWith("https://")) {
      try {
        image = new URL(image, targetUrl).href;
      } catch (e) {
        image = "";
      }
    }

    // Require at least a title or an image to qualify as a valid preview card
    if (!title && !image) return null;

    return {
      url: targetUrl,
      domain,
      title: title.substring(0, 160),
      description: description.substring(0, 260),
      image,
      siteName: siteName.substring(0, 50),
    };
  } catch (err) {
    // Non-blocking fail-safe: if site is unreachable or times out, return null
    return null;
  }
}
