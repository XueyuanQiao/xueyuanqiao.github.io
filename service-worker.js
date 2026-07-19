---
layout: null
permalink: /service-worker.js
sitemap: false
---
"use strict";

var MUSIC_CACHE_PREFIX = "xueyuan-music-";
var MUSIC_CACHE = MUSIC_CACHE_PREFIX + "v{{ site.music_cache_version | default: 1 }}";
var MUSIC_FILES = [
{% for track in site.music_tracks %}  {{ track.file | relative_url | jsonify }}{% unless forloop.last %},{% endunless %}
{% endfor %}];
var MUSIC_PATHS = new Set(MUSIC_FILES.map(function (file) {
  return new URL(file, self.location.origin).pathname;
}));

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf(MUSIC_CACHE_PREFIX) === 0 && key !== MUSIC_CACHE) {
          return caches.delete(key);
        }
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try { url = new URL(request.url); } catch (error) { return; }
  if (url.origin !== self.location.origin || !MUSIC_PATHS.has(url.pathname)) return;

  event.respondWith(handleMusicRequest(event, request, url));
});

self.addEventListener("message", function (event) {
  var data = event.data || {};
  if (data.type === "MUSIC_CACHE_STATUS") {
    event.waitUntil(cacheStatus(data.url).then(function (cached) {
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: "MUSIC_CACHE_STATUS",
          url: normalizedPath(data.url),
          cached: cached
        });
      }
    }).catch(function () {}));
    return;
  }

  if (data.type === "MUSIC_CACHE_TRACK") {
    event.waitUntil(cacheTrack(data.url).catch(function () { return false; }));
  }
});

async function handleMusicRequest(event, request, url) {
  var cache = await caches.open(MUSIC_CACHE);
  var key = cacheKey(url.pathname);
  var cached = await cache.match(key);
  var range = request.headers.get("range");

  if (cached) {
    if (range) return rangeResponse(cached, range);
    return cached;
  }

  return fetch(request);
}

async function rangeResponse(response, rangeHeader) {
  var buffer = await response.arrayBuffer();
  var size = buffer.byteLength;
  var range = parseRange(rangeHeader, size);
  if (!range) {
    return new Response(null, {
      status: 416,
      statusText: "Range Not Satisfiable",
      headers: { "Content-Range": "bytes */" + size }
    });
  }

  var chunk = buffer.slice(range.start, range.end + 1);
  var headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.set("accept-ranges", "bytes");
  headers.set("content-range", "bytes " + range.start + "-" + range.end + "/" + size);
  headers.set("content-length", String(chunk.byteLength));
  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers: headers
  });
}

function parseRange(value, size) {
  var match = /^bytes=(\d*)-(\d*)$/i.exec(String(value || "").trim());
  if (!match || (!match[1] && !match[2])) return null;

  var start;
  var end;
  if (!match[1]) {
    var suffix = parseInt(match[2], 10);
    if (!isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = parseInt(match[1], 10);
    end = match[2] ? parseInt(match[2], 10) : size - 1;
  }

  if (!isFinite(start) || !isFinite(end) || start < 0 || start >= size || end < start) return null;
  return { start: start, end: Math.min(end, size - 1) };
}

async function cacheTrack(value) {
  var path = normalizedPath(value);
  if (!MUSIC_PATHS.has(path)) return false;

  var cache = await caches.open(MUSIC_CACHE);
  var key = cacheKey(path);
  if (await cache.match(key)) {
    await notifyClients(path);
    return true;
  }

  var response = await fetch(key);
  if (!response.ok || response.status !== 200) return false;
  await cache.put(key, response);
  await notifyClients(path);
  return true;
}

async function cacheStatus(value) {
  var path = normalizedPath(value);
  if (!MUSIC_PATHS.has(path)) return false;
  var cache = await caches.open(MUSIC_CACHE);
  return Boolean(await cache.match(cacheKey(path)));
}

async function notifyClients(path) {
  var clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach(function (client) {
    client.postMessage({ type: "MUSIC_CACHED", url: path });
  });
}

function cacheKey(value) {
  var url = new URL(value, self.location.origin);
  url.search = "";
  url.hash = "";
  return new Request(url.href, { method: "GET", credentials: "same-origin" });
}

function normalizedPath(value) {
  try { return new URL(value, self.location.origin).pathname; }
  catch (error) { return ""; }
}
