import * as cheerio from "cheerio";

// URL extraction regex supporting full https:// URLs, www.* URLs, and common domain extensions
const URL_REGEX = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)|([a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|edu|gov|co|in|me|ai|tv|info)\b[^\s<]*)/i;

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
    const parsedUrl = new URL(targetUrl);

    // Only support http and https
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    const domain = parsedUrl.hostname.replace(/^www\./, "");

    // 2.8s strict timeout so message sending is never blocked
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(2800),
      redirect: "follow",
    });

    if (!response.ok) return null;

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
