var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
    globalThis.fetch = fetch;
    globalThis.Response = Response;
    globalThis.Request = Request;
    globalThis.Headers = Headers;
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/vanilla-lazyload/dist/lazyload.min.js
var require_lazyload_min = __commonJS({
  "node_modules/vanilla-lazyload/dist/lazyload.min.js"(exports, module2) {
    init_shims();
    !function(n, t) {
      typeof exports == "object" && typeof module2 != "undefined" ? module2.exports = t() : typeof define == "function" && define.amd ? define(t) : (n = typeof globalThis != "undefined" ? globalThis : n || self).LazyLoad = t();
    }(exports, function() {
      "use strict";
      function n() {
        return n = Object.assign || function(n2) {
          for (var t2 = 1; t2 < arguments.length; t2++) {
            var e2 = arguments[t2];
            for (var i2 in e2)
              Object.prototype.hasOwnProperty.call(e2, i2) && (n2[i2] = e2[i2]);
          }
          return n2;
        }, n.apply(this, arguments);
      }
      var t = typeof window != "undefined", e = t && !("onscroll" in window) || typeof navigator != "undefined" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent), i = t && "IntersectionObserver" in window, o = t && "classList" in document.createElement("p"), a = t && window.devicePixelRatio > 1, r = { elements_selector: ".lazy", container: e || t ? document : null, threshold: 300, thresholds: null, data_src: "src", data_srcset: "srcset", data_sizes: "sizes", data_bg: "bg", data_bg_hidpi: "bg-hidpi", data_bg_multi: "bg-multi", data_bg_multi_hidpi: "bg-multi-hidpi", data_poster: "poster", class_applied: "applied", class_loading: "loading", class_loaded: "loaded", class_error: "error", class_entered: "entered", class_exited: "exited", unobserve_completed: true, unobserve_entered: false, cancel_on_exit: true, callback_enter: null, callback_exit: null, callback_applied: null, callback_loading: null, callback_loaded: null, callback_error: null, callback_finish: null, callback_cancel: null, use_native: false }, c = function(t2) {
        return n({}, r, t2);
      }, u = function(n2, t2) {
        var e2, i2 = "LazyLoad::Initialized", o2 = new n2(t2);
        try {
          e2 = new CustomEvent(i2, { detail: { instance: o2 } });
        } catch (n3) {
          (e2 = document.createEvent("CustomEvent")).initCustomEvent(i2, false, false, { instance: o2 });
        }
        window.dispatchEvent(e2);
      }, l = "src", s2 = "srcset", f = "sizes", d = "poster", _ = "llOriginalAttrs", g = "loading", v = "loaded", b = "applied", p = "error", h = "native", m = "data-", E = "ll-status", I = function(n2, t2) {
        return n2.getAttribute(m + t2);
      }, y = function(n2) {
        return I(n2, E);
      }, A = function(n2, t2) {
        return function(n3, t3, e2) {
          var i2 = "data-ll-status";
          e2 !== null ? n3.setAttribute(i2, e2) : n3.removeAttribute(i2);
        }(n2, 0, t2);
      }, k = function(n2) {
        return A(n2, null);
      }, L = function(n2) {
        return y(n2) === null;
      }, w = function(n2) {
        return y(n2) === h;
      }, x = [g, v, b, p], O = function(n2, t2, e2, i2) {
        n2 && (i2 === void 0 ? e2 === void 0 ? n2(t2) : n2(t2, e2) : n2(t2, e2, i2));
      }, N = function(n2, t2) {
        o ? n2.classList.add(t2) : n2.className += (n2.className ? " " : "") + t2;
      }, C = function(n2, t2) {
        o ? n2.classList.remove(t2) : n2.className = n2.className.replace(new RegExp("(^|\\s+)" + t2 + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
      }, M = function(n2) {
        return n2.llTempImage;
      }, z = function(n2, t2) {
        if (t2) {
          var e2 = t2._observer;
          e2 && e2.unobserve(n2);
        }
      }, R = function(n2, t2) {
        n2 && (n2.loadingCount += t2);
      }, T = function(n2, t2) {
        n2 && (n2.toLoadCount = t2);
      }, G = function(n2) {
        for (var t2, e2 = [], i2 = 0; t2 = n2.children[i2]; i2 += 1)
          t2.tagName === "SOURCE" && e2.push(t2);
        return e2;
      }, D = function(n2, t2) {
        var e2 = n2.parentNode;
        e2 && e2.tagName === "PICTURE" && G(e2).forEach(t2);
      }, V = function(n2, t2) {
        G(n2).forEach(t2);
      }, F = [l], j = [l, d], P = [l, s2, f], S = function(n2) {
        return !!n2[_];
      }, U = function(n2) {
        return n2[_];
      }, $ = function(n2) {
        return delete n2[_];
      }, q = function(n2, t2) {
        if (!S(n2)) {
          var e2 = {};
          t2.forEach(function(t3) {
            e2[t3] = n2.getAttribute(t3);
          }), n2[_] = e2;
        }
      }, H = function(n2, t2) {
        if (S(n2)) {
          var e2 = U(n2);
          t2.forEach(function(t3) {
            !function(n3, t4, e3) {
              e3 ? n3.setAttribute(t4, e3) : n3.removeAttribute(t4);
            }(n2, t3, e2[t3]);
          });
        }
      }, B = function(n2, t2, e2) {
        N(n2, t2.class_loading), A(n2, g), e2 && (R(e2, 1), O(t2.callback_loading, n2, e2));
      }, J = function(n2, t2, e2) {
        e2 && n2.setAttribute(t2, e2);
      }, K = function(n2, t2) {
        J(n2, f, I(n2, t2.data_sizes)), J(n2, s2, I(n2, t2.data_srcset)), J(n2, l, I(n2, t2.data_src));
      }, Q = { IMG: function(n2, t2) {
        D(n2, function(n3) {
          q(n3, P), K(n3, t2);
        }), q(n2, P), K(n2, t2);
      }, IFRAME: function(n2, t2) {
        q(n2, F), J(n2, l, I(n2, t2.data_src));
      }, VIDEO: function(n2, t2) {
        V(n2, function(n3) {
          q(n3, F), J(n3, l, I(n3, t2.data_src));
        }), q(n2, j), J(n2, d, I(n2, t2.data_poster)), J(n2, l, I(n2, t2.data_src)), n2.load();
      } }, W = ["IMG", "IFRAME", "VIDEO"], X = function(n2, t2) {
        !t2 || function(n3) {
          return n3.loadingCount > 0;
        }(t2) || function(n3) {
          return n3.toLoadCount > 0;
        }(t2) || O(n2.callback_finish, t2);
      }, Y = function(n2, t2, e2) {
        n2.addEventListener(t2, e2), n2.llEvLisnrs[t2] = e2;
      }, Z = function(n2, t2, e2) {
        n2.removeEventListener(t2, e2);
      }, nn = function(n2) {
        return !!n2.llEvLisnrs;
      }, tn = function(n2) {
        if (nn(n2)) {
          var t2 = n2.llEvLisnrs;
          for (var e2 in t2) {
            var i2 = t2[e2];
            Z(n2, e2, i2);
          }
          delete n2.llEvLisnrs;
        }
      }, en = function(n2, t2, e2) {
        !function(n3) {
          delete n3.llTempImage;
        }(n2), R(e2, -1), function(n3) {
          n3 && (n3.toLoadCount -= 1);
        }(e2), C(n2, t2.class_loading), t2.unobserve_completed && z(n2, e2);
      }, on = function(n2, t2, e2) {
        var i2 = M(n2) || n2;
        nn(i2) || function(n3, t3, e3) {
          nn(n3) || (n3.llEvLisnrs = {});
          var i3 = n3.tagName === "VIDEO" ? "loadeddata" : "load";
          Y(n3, i3, t3), Y(n3, "error", e3);
        }(i2, function(o2) {
          !function(n3, t3, e3, i3) {
            var o3 = w(t3);
            en(t3, e3, i3), N(t3, e3.class_loaded), A(t3, v), O(e3.callback_loaded, t3, i3), o3 || X(e3, i3);
          }(0, n2, t2, e2), tn(i2);
        }, function(o2) {
          !function(n3, t3, e3, i3) {
            var o3 = w(t3);
            en(t3, e3, i3), N(t3, e3.class_error), A(t3, p), O(e3.callback_error, t3, i3), o3 || X(e3, i3);
          }(0, n2, t2, e2), tn(i2);
        });
      }, an = function(n2, t2, e2) {
        !function(n3) {
          n3.llTempImage = document.createElement("IMG");
        }(n2), on(n2, t2, e2), function(n3) {
          S(n3) || (n3[_] = { backgroundImage: n3.style.backgroundImage });
        }(n2), function(n3, t3, e3) {
          var i2 = I(n3, t3.data_bg), o2 = I(n3, t3.data_bg_hidpi), r2 = a && o2 ? o2 : i2;
          r2 && (n3.style.backgroundImage = 'url("'.concat(r2, '")'), M(n3).setAttribute(l, r2), B(n3, t3, e3));
        }(n2, t2, e2), function(n3, t3, e3) {
          var i2 = I(n3, t3.data_bg_multi), o2 = I(n3, t3.data_bg_multi_hidpi), r2 = a && o2 ? o2 : i2;
          r2 && (n3.style.backgroundImage = r2, function(n4, t4, e4) {
            N(n4, t4.class_applied), A(n4, b), e4 && (t4.unobserve_completed && z(n4, t4), O(t4.callback_applied, n4, e4));
          }(n3, t3, e3));
        }(n2, t2, e2);
      }, rn = function(n2, t2, e2) {
        !function(n3) {
          return W.indexOf(n3.tagName) > -1;
        }(n2) ? an(n2, t2, e2) : function(n3, t3, e3) {
          on(n3, t3, e3), function(n4, t4, e4) {
            var i2 = Q[n4.tagName];
            i2 && (i2(n4, t4), B(n4, t4, e4));
          }(n3, t3, e3);
        }(n2, t2, e2);
      }, cn = function(n2) {
        n2.removeAttribute(l), n2.removeAttribute(s2), n2.removeAttribute(f);
      }, un = function(n2) {
        D(n2, function(n3) {
          H(n3, P);
        }), H(n2, P);
      }, ln = { IMG: un, IFRAME: function(n2) {
        H(n2, F);
      }, VIDEO: function(n2) {
        V(n2, function(n3) {
          H(n3, F);
        }), H(n2, j), n2.load();
      } }, sn = function(n2, t2) {
        (function(n3) {
          var t3 = ln[n3.tagName];
          t3 ? t3(n3) : function(n4) {
            if (S(n4)) {
              var t4 = U(n4);
              n4.style.backgroundImage = t4.backgroundImage;
            }
          }(n3);
        })(n2), function(n3, t3) {
          L(n3) || w(n3) || (C(n3, t3.class_entered), C(n3, t3.class_exited), C(n3, t3.class_applied), C(n3, t3.class_loading), C(n3, t3.class_loaded), C(n3, t3.class_error));
        }(n2, t2), k(n2), $(n2);
      }, fn = ["IMG", "IFRAME", "VIDEO"], dn = function(n2) {
        return n2.use_native && "loading" in HTMLImageElement.prototype;
      }, _n = function(n2, t2, e2) {
        n2.forEach(function(n3) {
          return function(n4) {
            return n4.isIntersecting || n4.intersectionRatio > 0;
          }(n3) ? function(n4, t3, e3, i2) {
            var o2 = function(n5) {
              return x.indexOf(y(n5)) >= 0;
            }(n4);
            A(n4, "entered"), N(n4, e3.class_entered), C(n4, e3.class_exited), function(n5, t4, e4) {
              t4.unobserve_entered && z(n5, e4);
            }(n4, e3, i2), O(e3.callback_enter, n4, t3, i2), o2 || rn(n4, e3, i2);
          }(n3.target, n3, t2, e2) : function(n4, t3, e3, i2) {
            L(n4) || (N(n4, e3.class_exited), function(n5, t4, e4, i3) {
              e4.cancel_on_exit && function(n6) {
                return y(n6) === g;
              }(n5) && n5.tagName === "IMG" && (tn(n5), function(n6) {
                D(n6, function(n7) {
                  cn(n7);
                }), cn(n6);
              }(n5), un(n5), C(n5, e4.class_loading), R(i3, -1), k(n5), O(e4.callback_cancel, n5, t4, i3));
            }(n4, t3, e3, i2), O(e3.callback_exit, n4, t3, i2));
          }(n3.target, n3, t2, e2);
        });
      }, gn = function(n2) {
        return Array.prototype.slice.call(n2);
      }, vn = function(n2) {
        return n2.container.querySelectorAll(n2.elements_selector);
      }, bn = function(n2) {
        return function(n3) {
          return y(n3) === p;
        }(n2);
      }, pn = function(n2, t2) {
        return function(n3) {
          return gn(n3).filter(L);
        }(n2 || vn(t2));
      }, hn = function(n2, e2) {
        var o2 = c(n2);
        this._settings = o2, this.loadingCount = 0, function(n3, t2) {
          i && !dn(n3) && (t2._observer = new IntersectionObserver(function(e3) {
            _n(e3, n3, t2);
          }, function(n4) {
            return { root: n4.container === document ? null : n4.container, rootMargin: n4.thresholds || n4.threshold + "px" };
          }(n3)));
        }(o2, this), function(n3, e3) {
          t && window.addEventListener("online", function() {
            !function(n4, t2) {
              var e4;
              (e4 = vn(n4), gn(e4).filter(bn)).forEach(function(t3) {
                C(t3, n4.class_error), k(t3);
              }), t2.update();
            }(n3, e3);
          });
        }(o2, this), this.update(e2);
      };
      return hn.prototype = { update: function(n2) {
        var t2, o2, a2 = this._settings, r2 = pn(n2, a2);
        T(this, r2.length), !e && i ? dn(a2) ? function(n3, t3, e2) {
          n3.forEach(function(n4) {
            fn.indexOf(n4.tagName) !== -1 && function(n5, t4, e3) {
              n5.setAttribute("loading", "lazy"), on(n5, t4, e3), function(n6, t5) {
                var e4 = Q[n6.tagName];
                e4 && e4(n6, t5);
              }(n5, t4), A(n5, h);
            }(n4, t3, e2);
          }), T(e2, 0);
        }(r2, a2, this) : (o2 = r2, function(n3) {
          n3.disconnect();
        }(t2 = this._observer), function(n3, t3) {
          t3.forEach(function(t4) {
            n3.observe(t4);
          });
        }(t2, o2)) : this.loadAll(r2);
      }, destroy: function() {
        this._observer && this._observer.disconnect(), vn(this._settings).forEach(function(n2) {
          $(n2);
        }), delete this._observer, delete this._settings, delete this.loadingCount, delete this.toLoadCount;
      }, loadAll: function(n2) {
        var t2 = this, e2 = this._settings;
        pn(n2, e2).forEach(function(n3) {
          z(n3, t2), rn(n3, e2, t2);
        });
      }, restoreAll: function() {
        var n2 = this._settings;
        vn(n2).forEach(function(t2) {
          sn(t2, n2);
        });
      } }, hn.load = function(n2, t2) {
        var e2 = c(t2);
        rn(n2, e2);
      }, hn.resetStatus = function(n2) {
        k(n2);
      }, t && function(n2, t2) {
        if (t2)
          if (t2.length)
            for (var e2, i2 = 0; e2 = t2[i2]; i2 += 1)
              u(n2, e2);
          else
            u(n2, t2);
      }(hn, window.lazyLoadOptions), hn;
    });
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${branch.map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page.path)},
						query: new URLSearchParams(${s$1(page.query.toString())}),
						params: ${s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    return body2 ? `<script type="svelte-data" url="${url}" body="${hash(body2)}">${json}<\/script>` : `<script type="svelte-data" url="${url}">${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base, path) {
  const baseparts = path[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          response = await (void 0)(url, opts);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new (void 0)(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await (void 0)(`http://${page.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = { ...opts.headers };
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            if (opts.body && typeof opts.body !== "string") {
              throw new Error("Request body must be a string");
            }
            const rendered = await respond({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new (void 0)(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new (void 0)("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page
    });
  } catch (error4) {
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler2) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler2({ ...request, params });
    if (response) {
      if (typeof response !== "object") {
        return error(`Invalid response from route ${request.path}: expected an object, got ${typeof response}`);
      }
      let { status = 200, body, headers = {} } = response;
      headers = lowercase_keys(headers);
      const type = headers["content-type"];
      if (type === "application/octet-stream" && !(body instanceof Uint8Array)) {
        return error(`Invalid response from route ${request.path}: body must be an instance of Uint8Array if content type is application/octet-stream`);
      }
      if (body instanceof Uint8Array && type !== "application/octet-stream") {
        return error(`Invalid response from route ${request.path}: Uint8Array body must be accompanied by content-type: application/octet-stream header`);
      }
      let normalized_body;
      if (typeof body === "object" && (!type || type === "application/json")) {
        headers = { ...headers, "content-type": "application/json" };
        normalized_body = JSON.stringify(body);
      } else {
        normalized_body = body;
      }
      return { status, body: normalized_body, headers };
    }
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield key;
      }
    }
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value;
      }
    }
  }
};
function parse_body(req) {
  const raw = req.rawBody;
  if (!raw)
    return raw;
  const [type, ...directives] = req.headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !incoming.path.split("/").pop().includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers: lowercase_keys(incoming.headers),
        body: parse_body(incoming),
        params: null,
        locals: {}
      },
      render: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            error: null,
            branch: [],
            page: null
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// node_modules/svelte/internal/index.mjs
init_shims();
function noop2() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal2(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function compute_rest_props(props, keys) {
  const rest = {};
  keys = new Set(keys);
  for (const k in props)
    if (!keys.has(k) && k[0] !== "$")
      rest[k] = props[k];
  return rest;
}
function compute_slots(slots) {
  const result = {};
  for (const key in slots) {
    result[key] = true;
  }
  return result;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
function set_store_value(store, ret, value = ret) {
  store.set(value);
  return ret;
}
var tasks = new Set();
function custom_event(type, detail) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, false, false, detail);
  return e;
}
var active_docs = new Set();
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
var resolved_promise = Promise.resolve();
var seen_callbacks = new Set();
var outroing = new Set();
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
var boolean_attributes = new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);
var invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
function spread(args, classes_to_add) {
  const attributes = Object.assign({}, ...args);
  if (classes_to_add) {
    if (attributes.class == null) {
      attributes.class = classes_to_add;
    } else {
      attributes.class += " " + classes_to_add;
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${String(value).replace(/"/g, "&#34;").replace(/'/g, "&#39;")}"`;
    }
  });
  return str;
}
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const { on_mount } = this.$$;
      this.$$.on_disconnect = on_mount.map(run).filter(is_function);
      for (const key in this.$$.slotted) {
        this.appendChild(this.$$.slotted[key]);
      }
    }
    attributeChangedCallback(attr, _oldValue, newValue) {
      this[attr] = newValue;
    }
    disconnectedCallback() {
      run_all(this.$$.on_disconnect);
    }
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop2;
    }
    $on(type, callback) {
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index2 = callbacks.indexOf(callback);
        if (index2 !== -1)
          callbacks.splice(index2, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
}

// node_modules/svelte/index.mjs
init_shims();

// .svelte-kit/output/server/app.js
var import_vanilla_lazyload = __toModule(require_lazyload_min());

// node_modules/svelte/transition/index.mjs
init_shims();

// node_modules/svelte/easing/index.mjs
init_shims();

// node_modules/svelte/store/index.mjs
init_shims();
var subscriber_queue2 = [];
function writable2(value, start = noop2) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal2(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue2.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop2) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop2;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}

// .svelte-kit/output/server/app.js
var css$c = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$c);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1pdgbjn"}">${navigated ? `${escape2(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		<link rel="preconnect" href="https://fonts.googleapis.com" />\n		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n		<link\n			href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@400;700&display=swap"\n			rel="stylesheet"\n		/>\n\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
function init(settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-f8fd879f.js",
      css: ["/./_app/assets/start-0826e215.css", "/./_app/assets/vendor-3f6342a4.css"],
      js: ["/./_app/start-f8fd879f.js", "/./_app/chunks/vendor-27761ef7.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/posts\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return posts_json;
      })
    },
    {
      type: "page",
      pattern: /^\/projects\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/projects.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/flowers\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/flowers.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/about.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/blog\/secondpost\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/secondpost.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/blog\/third-post\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/third-post.svx"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/blog\/firstpost\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/blog/firstpost.md"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, render: render2 }) => render2(request))
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/projects.svelte": () => Promise.resolve().then(function() {
    return projects;
  }),
  "src/routes/flowers.svelte": () => Promise.resolve().then(function() {
    return flowers;
  }),
  "src/routes/about.svelte": () => Promise.resolve().then(function() {
    return about;
  }),
  "src/routes/blog/secondpost.md": () => Promise.resolve().then(function() {
    return secondpost;
  }),
  "src/routes/blog/third-post.svx": () => Promise.resolve().then(function() {
    return thirdPost;
  }),
  "src/routes/blog/firstpost.md": () => Promise.resolve().then(function() {
    return firstpost;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-d895f986.js", "css": ["/./_app/assets/pages/__layout.svelte-9220d0a7.css", "/./_app/assets/vendor-3f6342a4.css"], "js": ["/./_app/pages/__layout.svelte-d895f986.js", "/./_app/chunks/vendor-27761ef7.js", "/./_app/chunks/store-4f273f6c.js"], "styles": null }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-469ad630.js", "css": ["/./_app/assets/vendor-3f6342a4.css"], "js": ["/./_app/error.svelte-469ad630.js", "/./_app/chunks/vendor-27761ef7.js"], "styles": null }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-3d26e2ca.js", "css": ["/./_app/assets/vendor-3f6342a4.css"], "js": ["/./_app/pages/index.svelte-3d26e2ca.js", "/./_app/chunks/vendor-27761ef7.js", "/./_app/chunks/store-4f273f6c.js"], "styles": null }, "src/routes/projects.svelte": { "entry": "/./_app/pages/projects.svelte-6edc0c38.js", "css": ["/./_app/assets/vendor-3f6342a4.css"], "js": ["/./_app/pages/projects.svelte-6edc0c38.js", "/./_app/chunks/vendor-27761ef7.js"], "styles": null }, "src/routes/flowers.svelte": { "entry": "/./_app/pages/flowers.svelte-20806677.js", "css": ["/./_app/assets/pages/flowers.svelte-0f72f333.css", "/./_app/assets/vendor-3f6342a4.css"], "js": ["/./_app/pages/flowers.svelte-20806677.js", "/./_app/chunks/vendor-27761ef7.js"], "styles": null }, "src/routes/about.svelte": { "entry": "/./_app/pages/about.svelte-5e60a1bc.js", "css": ["/./_app/assets/vendor-3f6342a4.css"], "js": ["/./_app/pages/about.svelte-5e60a1bc.js", "/./_app/chunks/vendor-27761ef7.js"], "styles": null }, "src/routes/blog/secondpost.md": { "entry": "/./_app/pages/blog/secondpost.md-4ca4224d.js", "css": ["/./_app/assets/vendor-3f6342a4.css", "/./_app/assets/BlogLayout-ed37becf.css"], "js": ["/./_app/pages/blog/secondpost.md-4ca4224d.js", "/./_app/chunks/vendor-27761ef7.js", "/./_app/chunks/BlogLayout-d0400efe.js", "/./_app/chunks/store-4f273f6c.js"], "styles": null }, "src/routes/blog/third-post.svx": { "entry": "/./_app/pages/blog/third-post.svx-44150860.js", "css": ["/./_app/assets/vendor-3f6342a4.css", "/./_app/assets/BlogLayout-ed37becf.css"], "js": ["/./_app/pages/blog/third-post.svx-44150860.js", "/./_app/chunks/vendor-27761ef7.js", "/./_app/chunks/BlogLayout-d0400efe.js", "/./_app/chunks/store-4f273f6c.js"], "styles": null }, "src/routes/blog/firstpost.md": { "entry": "/./_app/pages/blog/firstpost.md-779459f6.js", "css": ["/./_app/assets/vendor-3f6342a4.css", "/./_app/assets/BlogLayout-ed37becf.css"], "js": ["/./_app/pages/blog/firstpost.md-779459f6.js", "/./_app/chunks/vendor-27761ef7.js", "/./_app/chunks/BlogLayout-d0400efe.js", "/./_app/chunks/store-4f273f6c.js"], "styles": null } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
init({ paths: { "base": "", "assets": "/." } });
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
async function get() {
  const imports = { "./blog/firstpost.md": () => Promise.resolve().then(function() {
    return firstpost;
  }), "./blog/secondpost.md": () => Promise.resolve().then(function() {
    return secondpost;
  }), "./blog/third-post.svx": () => Promise.resolve().then(function() {
    return thirdPost;
  }) };
  const body = [];
  for (const path in imports) {
    body.push(imports[path]().then(({ metadata: metadata2 }) => {
      return {
        metadata: metadata2,
        path
      };
    }));
  }
  const posts = await Promise.all(body);
  return {
    body: JSON.stringify(posts)
  };
}
var posts_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
var seo = writable2({
  title: "bethanycollins.me",
  description: "Bethany Collins' home on the web"
});
var Seo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $seo, $$unsubscribe_seo;
  $$unsubscribe_seo = subscribe(seo, (value) => $seo = value);
  $$unsubscribe_seo();
  return `${$$result.head += `${$$result.title = `<title>${escape2($seo.title)}</title>`, ""}<meta name="${"description"}"${add_attribute("content", $seo.description, 0)} data-svelte="svelte-135fyrd">`, ""}`;
});
var Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<nav><a href="${"/"}">Home</a>
	<a href="${"/flowers"}">Florals</a>
	<a href="${"/projects"}">Projects</a>
	<a href="${"/about"}">About</a></nav>`;
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Seo, "Seo").$$render($$result, {}, {}, {})}
<div class="${"body-wrapper mx-auto"}">${validate_component(Nav, "Nav").$$render($$result, {}, {}, {})}
	${slots.default ? slots.default({}) : ``}</div>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$1({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<p>${escape2(error22.message)}</p>


${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error2,
  load: load$1
});
function paginate({ items, pageSize: pageSize2, currentPage }) {
  return items.slice((currentPage - 1) * pageSize2, (currentPage - 1) * pageSize2 + pageSize2);
}
var PREVIOUS_PAGE = "PREVIOUS_PAGE";
var NEXT_PAGE = "NEXT_PAGE";
var ELLIPSIS = "ELLIPSIS";
function generateNavigationOptions({ totalItems, pageSize: pageSize2, currentPage, limit = null, showStepOptions = false }) {
  const totalPages = Math.ceil(totalItems / pageSize2);
  const limitThreshold = getLimitThreshold({ limit });
  const limited = limit && totalPages > limitThreshold;
  let options2 = limited ? generateLimitedOptions({ totalPages, limit, currentPage }) : generateUnlimitedOptions({ totalPages });
  return showStepOptions ? addStepOptions({ options: options2, currentPage, totalPages }) : options2;
}
function generateUnlimitedOptions({ totalPages }) {
  return new Array(totalPages).fill(null).map((value, index2) => ({
    type: "number",
    value: index2 + 1
  }));
}
function generateLimitedOptions({ totalPages, limit, currentPage }) {
  const boundarySize = limit * 2 + 2;
  const firstBoundary = 1 + boundarySize;
  const lastBoundary = totalPages - boundarySize;
  const totalShownPages = firstBoundary + 2;
  if (currentPage <= firstBoundary - limit) {
    return Array(totalShownPages).fill(null).map((value, index2) => {
      if (index2 === totalShownPages - 1) {
        return {
          type: "number",
          value: totalPages
        };
      } else if (index2 === totalShownPages - 2) {
        return {
          type: "symbol",
          symbol: ELLIPSIS,
          value: firstBoundary + 1
        };
      }
      return {
        type: "number",
        value: index2 + 1
      };
    });
  } else if (currentPage >= lastBoundary + limit) {
    return Array(totalShownPages).fill(null).map((value, index2) => {
      if (index2 === 0) {
        return {
          type: "number",
          value: 1
        };
      } else if (index2 === 1) {
        return {
          type: "symbol",
          symbol: ELLIPSIS,
          value: lastBoundary - 1
        };
      }
      return {
        type: "number",
        value: lastBoundary + index2 - 2
      };
    });
  } else if (currentPage >= firstBoundary - limit && currentPage <= lastBoundary + limit) {
    return Array(totalShownPages).fill(null).map((value, index2) => {
      if (index2 === 0) {
        return {
          type: "number",
          value: 1
        };
      } else if (index2 === 1) {
        return {
          type: "symbol",
          symbol: ELLIPSIS,
          value: currentPage - limit + (index2 - 2)
        };
      } else if (index2 === totalShownPages - 1) {
        return {
          type: "number",
          value: totalPages
        };
      } else if (index2 === totalShownPages - 2) {
        return {
          type: "symbol",
          symbol: ELLIPSIS,
          value: currentPage + limit + 1
        };
      }
      return {
        type: "number",
        value: currentPage - limit + (index2 - 2)
      };
    });
  }
}
function addStepOptions({ options: options2, currentPage, totalPages }) {
  return [
    {
      type: "symbol",
      symbol: PREVIOUS_PAGE,
      value: currentPage <= 1 ? 1 : currentPage - 1
    },
    ...options2,
    {
      type: "symbol",
      symbol: NEXT_PAGE,
      value: currentPage >= totalPages ? totalPages : currentPage + 1
    }
  ];
}
function getLimitThreshold({ limit }) {
  const maximumUnlimitedPages = 3;
  const numberOfBoundaryPages = 2;
  return limit * 2 + maximumUnlimitedPages + numberOfBoundaryPages;
}
var PaginationNav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let options2;
  let totalPages;
  createEventDispatcher();
  let { totalItems = 0 } = $$props;
  let { pageSize: pageSize2 = 1 } = $$props;
  let { currentPage = 1 } = $$props;
  let { limit = null } = $$props;
  let { showStepOptions = false } = $$props;
  if ($$props.totalItems === void 0 && $$bindings.totalItems && totalItems !== void 0)
    $$bindings.totalItems(totalItems);
  if ($$props.pageSize === void 0 && $$bindings.pageSize && pageSize2 !== void 0)
    $$bindings.pageSize(pageSize2);
  if ($$props.currentPage === void 0 && $$bindings.currentPage && currentPage !== void 0)
    $$bindings.currentPage(currentPage);
  if ($$props.limit === void 0 && $$bindings.limit && limit !== void 0)
    $$bindings.limit(limit);
  if ($$props.showStepOptions === void 0 && $$bindings.showStepOptions && showStepOptions !== void 0)
    $$bindings.showStepOptions(showStepOptions);
  options2 = generateNavigationOptions({
    totalItems,
    pageSize: pageSize2,
    currentPage,
    limit,
    showStepOptions
  });
  totalPages = Math.ceil(totalItems / pageSize2);
  return `<div class="${"pagination-nav"}">${each(options2, (option) => `<span class="${[
    "option",
    (option.type === "number" ? "number" : "") + " " + (option.type === "symbol" && option.symbol === PREVIOUS_PAGE ? "prev" : "") + " " + (option.type === "symbol" && option.symbol === NEXT_PAGE ? "next" : "") + " " + (option.type === "symbol" && option.symbol === NEXT_PAGE && currentPage >= totalPages || option.type === "symbol" && option.symbol === PREVIOUS_PAGE && currentPage <= 1 ? "disabled" : "") + " " + (option.type === "symbol" && option.symbol === ELLIPSIS ? "ellipsis" : "") + " " + (option.type === "number" && option.value === currentPage ? "active" : "")
  ].join(" ").trim()}">${option.type === "number" ? `${slots.number ? slots.number({ value: option.value }) : `
          <span>${escape2(option.value)}</span>
        `}` : `${option.type === "symbol" && option.symbol === ELLIPSIS ? `${slots.ellipsis ? slots.ellipsis({}) : `
          <span>...</span>
        `}` : `${option.type === "symbol" && option.symbol === PREVIOUS_PAGE ? `${slots.prev ? slots.prev({}) : `
          <svg style="${"width:24px;height:24px"}" viewBox="${"0 0 24 24"}"><path fill="${"#000000"}" d="${"M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"}"></path></svg>
        `}` : `${option.type === "symbol" && option.symbol === NEXT_PAGE ? `${slots.next ? slots.next({}) : `
          <svg style="${"width:24px;height:24px"}" viewBox="${"0 0 24 24"}"><path fill="${"#000000"}" d="${"M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"}"></path></svg>
        `}` : ``}`}`}`}
    </span>`)}</div>`;
});
var css$b = {
  code: ".light-pagination-nav.svelte-133zlo7 .pagination-nav{background:#fff;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;justify-content:center}.light-pagination-nav.svelte-133zlo7 .option{align-items:center;color:#032130;display:flex;justify-content:center;padding:10px;transition:all .2s ease-out;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.light-pagination-nav.svelte-133zlo7 .option.ellipsis,.light-pagination-nav.svelte-133zlo7 .option.number{padding:10px 15px}.light-pagination-nav.svelte-133zlo7 .option:hover{background:rgba(0,0,0,.1);cursor:pointer}.light-pagination-nav.svelte-133zlo7 .option.active{color:#269dd9}",
  map: `{"version":3,"file":"LightPaginationNav.svelte","sources":["LightPaginationNav.svelte"],"sourcesContent":["<script>\\n  import PaginationNav from './PaginationNav.svelte'\\n<\/script>\\n\\n<div class=\\"light-pagination-nav\\">\\n  <PaginationNav\\n    {...$$props}\\n    on:setPage\\n  />\\n</div>\\n\\n<style>.light-pagination-nav :global(.pagination-nav){background:#fff;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;justify-content:center}.light-pagination-nav :global(.option){align-items:center;color:#032130;display:flex;justify-content:center;padding:10px;transition:all .2s ease-out;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.light-pagination-nav :global(.option.ellipsis),.light-pagination-nav :global(.option.number){padding:10px 15px}.light-pagination-nav :global(.option:hover){background:rgba(0,0,0,.1);cursor:pointer}.light-pagination-nav :global(.option.active){color:#269dd9}</style>"],"names":[],"mappings":"AAWO,oCAAqB,CAAC,AAAQ,eAAe,AAAC,CAAC,WAAW,IAAI,CAAC,cAAc,GAAG,CAAC,WAAW,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,oCAAqB,CAAC,AAAQ,OAAO,AAAC,CAAC,YAAY,MAAM,CAAC,MAAM,OAAO,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,QAAQ,IAAI,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,QAAQ,CAAC,oBAAoB,IAAI,CAAC,iBAAiB,IAAI,CAAC,gBAAgB,IAAI,CAAC,YAAY,IAAI,CAAC,oCAAqB,CAAC,AAAQ,gBAAgB,AAAC,CAAC,oCAAqB,CAAC,AAAQ,cAAc,AAAC,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,oCAAqB,CAAC,AAAQ,aAAa,AAAC,CAAC,WAAW,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,OAAO,OAAO,CAAC,oCAAqB,CAAC,AAAQ,cAAc,AAAC,CAAC,MAAM,OAAO,CAAC"}`
};
create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$b);
  return `<div class="${"light-pagination-nav svelte-133zlo7"}">${validate_component(PaginationNav, "PaginationNav").$$render($$result, Object.assign($$props), {}, {})}
</div>`;
});
var css$a = {
  code: ".dark-pagination-nav.svelte-1ke8gxx .pagination-nav{background:#031017;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;justify-content:center}.dark-pagination-nav.svelte-1ke8gxx .option{align-items:center;color:#cfedfc;display:flex;justify-content:center;padding:10px;transition:all .2s ease-out;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dark-pagination-nav.svelte-1ke8gxx .option svg path{fill:#cfedfc}.dark-pagination-nav.svelte-1ke8gxx .option:first-child{border-radius:3px 0 0 3px}.dark-pagination-nav.svelte-1ke8gxx .option:last-child{border-radius:0 3px 3px 0}.dark-pagination-nav.svelte-1ke8gxx .option.ellipsis,.dark-pagination-nav.svelte-1ke8gxx .option.number{padding:10px 15px}.dark-pagination-nav.svelte-1ke8gxx .option:hover{background:#000;cursor:pointer}.dark-pagination-nav.svelte-1ke8gxx .option.active{color:#0af}",
  map: `{"version":3,"file":"DarkPaginationNav.svelte","sources":["DarkPaginationNav.svelte"],"sourcesContent":["<script>\\n  import PaginationNav from './PaginationNav.svelte'\\n<\/script>\\n\\n<div class=\\"dark-pagination-nav\\">\\n  <PaginationNav\\n    {...$$props}\\n    on:setPage\\n  />\\n</div>\\n\\n<style>.dark-pagination-nav :global(.pagination-nav){background:#031017;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;justify-content:center}.dark-pagination-nav :global(.option){align-items:center;color:#cfedfc;display:flex;justify-content:center;padding:10px;transition:all .2s ease-out;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dark-pagination-nav :global(.option svg path){fill:#cfedfc}.dark-pagination-nav :global(.option:first-child){border-radius:3px 0 0 3px}.dark-pagination-nav :global(.option:last-child){border-radius:0 3px 3px 0}.dark-pagination-nav :global(.option.ellipsis),.dark-pagination-nav :global(.option.number){padding:10px 15px}.dark-pagination-nav :global(.option:hover){background:#000;cursor:pointer}.dark-pagination-nav :global(.option.active){color:#0af}</style>"],"names":[],"mappings":"AAWO,mCAAoB,CAAC,AAAQ,eAAe,AAAC,CAAC,WAAW,OAAO,CAAC,cAAc,GAAG,CAAC,WAAW,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,mCAAoB,CAAC,AAAQ,OAAO,AAAC,CAAC,YAAY,MAAM,CAAC,MAAM,OAAO,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,QAAQ,IAAI,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,QAAQ,CAAC,oBAAoB,IAAI,CAAC,iBAAiB,IAAI,CAAC,gBAAgB,IAAI,CAAC,YAAY,IAAI,CAAC,mCAAoB,CAAC,AAAQ,gBAAgB,AAAC,CAAC,KAAK,OAAO,CAAC,mCAAoB,CAAC,AAAQ,mBAAmB,AAAC,CAAC,cAAc,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,mCAAoB,CAAC,AAAQ,kBAAkB,AAAC,CAAC,cAAc,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,mCAAoB,CAAC,AAAQ,gBAAgB,AAAC,CAAC,mCAAoB,CAAC,AAAQ,cAAc,AAAC,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,mCAAoB,CAAC,AAAQ,aAAa,AAAC,CAAC,WAAW,IAAI,CAAC,OAAO,OAAO,CAAC,mCAAoB,CAAC,AAAQ,cAAc,AAAC,CAAC,MAAM,IAAI,CAAC"}`
};
create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$a);
  return `<div class="${"dark-pagination-nav svelte-1ke8gxx"}">${validate_component(PaginationNav, "PaginationNav").$$render($$result, Object.assign($$props), {}, {})}
</div>`;
});
async function load({ fetch: fetch3 }) {
  const res = await fetch3(`/posts.json`);
  const posts = await res.json();
  return { props: { posts } };
}
var pageSize = 2;
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let paginatedItems;
  let $seo, $$unsubscribe_seo;
  $$unsubscribe_seo = subscribe(seo, (value) => $seo = value);
  let { posts } = $$props;
  let items = posts;
  let currentPage = 1;
  set_store_value(seo, $seo = {
    title: "bethanycollins.me",
    description: "Bethany Collins' home on the web"
  }, $seo);
  onMount(() => {
  });
  if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0)
    $$bindings.posts(posts);
  paginatedItems = paginate({ items, pageSize, currentPage });
  $$unsubscribe_seo();
  return `<main><article><h1 class="${"headline text-7xl leading-relaxed font-black font-display mb-4"}">bethanycollins.me
		</h1>
		<div class="${"article-list"}">${each(paginatedItems, ({ metadata: { title, description, tags, outline, slug }, path }) => `<div class="${"mb-4"}"><a sveltekit:prefetch${add_attribute("href", path.replace(/\.[^/.]+$/, ""), 0)}><h2 class="${"text-3xl leading-relaxed"}">${escape2(title)}</h2></a>
					<p>${escape2(description)}</p>
				</div>`)}</div>
		<div class="${"mx-auto"}">${validate_component(PaginationNav, "PaginationNav").$$render($$result, {
    totalItems: items.length,
    pageSize,
    currentPage,
    limit: 1,
    showStepOptions: true
  }, {}, {})}</div></article></main>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  load
});
var Projects = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>Projects</h1>

<p>When I had read it, I stood looking at the Professor, and after a pause asked him: &quot;In God&#39;s name,
	what does it all mean? Was she, or is she, mad; or what sort of horrible danger is it?&quot; I was so
	bewildered that I did not know what to say more. Van Helsing put out his hand and took the paper,
	saying:--
</p>

<p>&quot;Do not trouble about it now. Forget it for the present. You shall know and understand it all in
	good time; but it will be later. And now what is it that you came to me to say?&quot; This brought me
	back to fact, and I was all myself again.
</p>

<p>&quot;I came to speak about the certificate of death. If we do not act properly and wisely, there may
	be an inquest, and that paper would have to be produced. I am in hopes that we need have no
	inquest, for if we had it would surely kill poor Lucy, if nothing else did. I know, and you know,
	and the other doctor who attended her knows, that Mrs. Westenra had disease of the heart, and we
	can certify that she died of it. Let us fill up the certificate at once, and I shall take it
	myself to the registrar and go on to the undertaker.&quot;
</p>

<p>&quot;Good, oh my friend John! Well thought of! Truly Miss Lucy, if she be sad in the foes that beset
	her, is at least happy in the friends that love her. One, two, three, all open their veins for
	her, besides one old man. Ah yes, I know, friend John; I am not blind! I love you all the more for
	it! Now go.&quot;
</p>`;
});
var projects = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Projects
});
var dinner_party_1 = "/_app/assets/dinner_party_1.00933222.jpeg?width=672";
var dinner_party_2 = "/_app/assets/dinner_party_2.5d523b03.jpeg?width=672";
var dinner_party_3 = "/_app/assets/dinner_party_3.4bb70524.jpeg?width=672";
var dinner_party_4 = "/_app/assets/dinner_party_4.0cf6dc9f.jpeg?width=672";
var dinner_party_5 = "/_app/assets/dinner_party_5.f1a4b974.jpeg?width=672";
var dinner_party_6 = "/_app/assets/dinner_party_6.bd56d2c9.jpeg?width=672";
var dinner_party_7 = "/_app/assets/dinner_party_7.7f8b7665.jpeg?width=672";
var table_arrangement_1 = "/_app/assets/table_arrangement_1.346ddb1b.jpeg?width=672";
var table_arrangement_2 = "/_app/assets/table_arrangement_2.4bc2df3e.jpeg?width=672";
var table_arrangement_3 = "/_app/assets/table_arrangement_3.c63e33bd.jpeg?width=672";
var table_arrangement_4 = "/_app/assets/table_arrangement_4.a876ca3e.jpeg?width=672";
var wedding_1 = "/_app/assets/wedding_1.37524f6d.jpeg?width=672";
var wedding_2 = "/_app/assets/wedding_2.738f3928.jpeg?width=672";
var wedding_3 = "/_app/assets/wedding_3.64bd8eda.jpeg?width=672";
var wedding_4 = "/_app/assets/wedding_4.ebfd1f98.jpeg?width=672";
var wedding_5 = "/_app/assets/wedding_5.057d551b.jpeg?width=672";
var wedding_6 = "/_app/assets/wedding_6.04381654.jpeg?width=672";
var wedding_7 = "/_app/assets/wedding_7.492ff67e.jpeg?width=672";
var wedding_8 = "/_app/assets/wedding_8.94943aa1.jpeg?width=672";
var wedding_9 = "/_app/assets/wedding_9.09437156.jpeg?width=672";
var wedding_10 = "/_app/assets/wedding_10.3bce6524.jpeg?width=672";
var css$9 = {
  code: "div.clickable.svelte-1geqjqc{cursor:zoom-in;position:static}div.svelte-lightbox-unselectable.svelte-1geqjqc{pointer-events:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}",
  map: `{"version":3,"file":"LightboxThumbnail.svelte","sources":["LightboxThumbnail.svelte"],"sourcesContent":["<script>\\n    import { createEventDispatcher } from 'svelte';\\n    const dispatch = createEventDispatcher();\\n\\n    let classes = '';\\n    export {classes as class};\\n    export let style = '';\\n    export let protect = false;\\n<\/script>\\n\\n<div class=\\"clickable\\" on:click={ () => dispatch('click') }>\\n    <div class={classes} {style} class:svelte-lightbox-unselectable={protect}>\\n        <slot/>\\n    </div>\\n</div>\\n\\n<style>div.clickable{cursor:zoom-in;position:static}div.svelte-lightbox-unselectable{pointer-events:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}</style>"],"names":[],"mappings":"AAgBO,GAAG,yBAAU,CAAC,OAAO,OAAO,CAAC,SAAS,MAAM,CAAC,GAAG,4CAA6B,CAAC,eAAe,IAAI,CAAC,oBAAoB,IAAI,CAAC,iBAAiB,IAAI,CAAC,gBAAgB,IAAI,CAAC,YAAY,IAAI,CAAC"}`
};
var LightboxThumbnail = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let { class: classes = "" } = $$props;
  let { style: style2 = "" } = $$props;
  let { protect = false } = $$props;
  if ($$props.class === void 0 && $$bindings.class && classes !== void 0)
    $$bindings.class(classes);
  if ($$props.style === void 0 && $$bindings.style && style2 !== void 0)
    $$bindings.style(style2);
  if ($$props.protect === void 0 && $$bindings.protect && protect !== void 0)
    $$bindings.protect(protect);
  $$result.css.add(css$9);
  return `<div class="${"clickable svelte-1geqjqc"}"><div class="${[
    escape2(null_to_empty(classes)) + " svelte-1geqjqc",
    protect ? "svelte-lightbox-unselectable" : ""
  ].join(" ").trim()}"${add_attribute("style", style2, 0)}>${slots.default ? slots.default({}) : ``}</div>
</div>`;
});
var css$8 = {
  code: "div.svelte-lightbox-header.svelte-1294atd{align-items:center;display:flex;height:3rem;justify-content:flex-end;width:auto}div.fullscreen.svelte-1294atd{left:0;position:fixed;right:0;top:0;z-index:5}button.svelte-1294atd{background:transparent;border:none;color:#fff;font-size:3rem}button.svelte-1294atd:hover{color:#d3d3d3;cursor:pointer}button.svelte-1294atd:active{background-color:transparent}button.fullscreen.svelte-1294atd{filter:drop-shadow(0 0 5px black) drop-shadow(0 0 10px black)}",
  map: `{"version":3,"file":"LightboxHeader.svelte","sources":["LightboxHeader.svelte"],"sourcesContent":["<script>\\n    import { createEventDispatcher } from 'svelte';\\n    const dispatch = createEventDispatcher();\\n\\n    export let size = 'xs';\\n    export let style = '';\\n    export let headerClasses = '';\\n    export let buttonClasses = '';\\n    export let closeButton = true;\\n    export let fullscreen = false;\\n<\/script>\\n\\n<div class={\\"svelte-lightbox-header \\" + headerClasses} class:fullscreen>\\n    {#if closeButton}\\n        <button on:click={ () => dispatch('close')} {size} {style} class={buttonClasses} class:fullscreen>\\n            \xD7\\n        </button>\\n    {/if}\\n</div>\\n\\n<style>div.svelte-lightbox-header{align-items:center;display:flex;height:3rem;justify-content:flex-end;width:auto}div.fullscreen{left:0;position:fixed;right:0;top:0;z-index:5}button{background:transparent;border:none;color:#fff;font-size:3rem}button:hover{color:#d3d3d3;cursor:pointer}button:active{background-color:transparent}button.fullscreen{filter:drop-shadow(0 0 5px black) drop-shadow(0 0 10px black)}</style>\\n"],"names":[],"mappings":"AAoBO,GAAG,sCAAuB,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,OAAO,IAAI,CAAC,gBAAgB,QAAQ,CAAC,MAAM,IAAI,CAAC,GAAG,0BAAW,CAAC,KAAK,CAAC,CAAC,SAAS,KAAK,CAAC,MAAM,CAAC,CAAC,IAAI,CAAC,CAAC,QAAQ,CAAC,CAAC,qBAAM,CAAC,WAAW,WAAW,CAAC,OAAO,IAAI,CAAC,MAAM,IAAI,CAAC,UAAU,IAAI,CAAC,qBAAM,MAAM,CAAC,MAAM,OAAO,CAAC,OAAO,OAAO,CAAC,qBAAM,OAAO,CAAC,iBAAiB,WAAW,CAAC,MAAM,0BAAW,CAAC,OAAO,YAAY,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,YAAY,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC"}`
};
var LightboxHeader = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let { size = "xs" } = $$props;
  let { style: style2 = "" } = $$props;
  let { headerClasses = "" } = $$props;
  let { buttonClasses = "" } = $$props;
  let { closeButton = true } = $$props;
  let { fullscreen = false } = $$props;
  if ($$props.size === void 0 && $$bindings.size && size !== void 0)
    $$bindings.size(size);
  if ($$props.style === void 0 && $$bindings.style && style2 !== void 0)
    $$bindings.style(style2);
  if ($$props.headerClasses === void 0 && $$bindings.headerClasses && headerClasses !== void 0)
    $$bindings.headerClasses(headerClasses);
  if ($$props.buttonClasses === void 0 && $$bindings.buttonClasses && buttonClasses !== void 0)
    $$bindings.buttonClasses(buttonClasses);
  if ($$props.closeButton === void 0 && $$bindings.closeButton && closeButton !== void 0)
    $$bindings.closeButton(closeButton);
  if ($$props.fullscreen === void 0 && $$bindings.fullscreen && fullscreen !== void 0)
    $$bindings.fullscreen(fullscreen);
  $$result.css.add(css$8);
  return `<div class="${[
    escape2(null_to_empty("svelte-lightbox-header " + headerClasses)) + " svelte-1294atd",
    fullscreen ? "fullscreen" : ""
  ].join(" ").trim()}">${closeButton ? `<button${add_attribute("size", size, 0)}${add_attribute("style", style2, 0)} class="${[
    escape2(null_to_empty(buttonClasses)) + " svelte-1294atd",
    fullscreen ? "fullscreen" : ""
  ].join(" ").trim()}">\xD7
        </button>` : ``}
</div>`;
});
var css$7 = {
  code: "div.svelte-lightbox-body.svelte-u5033r{background-color:transparent;height:auto;max-height:80vh;width:auto}div.svelte-lightbox-body.fullscreen.svelte-u5033r{background-position:50%;background-repeat:no-repeat;background-size:contain}div.fullscreen.svelte-u5033r{height:inherit;max-height:inherit;max-width:inherit;width:inherit}div.svelte-lightbox-unselectable.svelte-u5033r{pointer-events:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}div.svelte-lightbox-image-portrait.svelte-u5033r{height:90vh}div.expand.svelte-u5033r{height:auto;max-height:90vh;width:90vw}",
  map: `{"version":3,"file":"LightboxBody.svelte","sources":["LightboxBody.svelte"],"sourcesContent":["<script>\\n    import presets from './presets.js';\\n    import {afterUpdate, getContext} from \\"svelte\\";\\n    export let image = {};\\n    export let protect = false;\\n    export let portrait = false;\\n    export let imagePreset = false;\\n    export let fullscreen = false;\\n    export let gallery = false;\\n    const activeImageStore = getContext('svelte-lightbox-activeImage');\\n    let imageParent;\\n\\n    const getFullscreenSrc = () => {\\n        // Getting image that should been displayed and taking its src\\n      if (imageParent) {\\n          let imageElement;\\n          if (gallery) {\\n              // Getting active images src from gallery\\n              imageElement = imageParent.firstChild.children[1].children[$activeImageStore].firstChild;\\n          } else {\\n              // In case of classic lightbox, we just grab image that is first child\\n              imageElement = imageParent.firstChild;\\n          }\\n          // Getting source for lightbox body background and hiding original\\n          image.src = imageElement.src;\\n          imageElement.style.display = 'none';\\n      } else {\\n          queueMicrotask(getFullscreenSrc)\\n      }\\n    }\\n\\n    $: if (imageParent && imagePreset && presets[imagePreset]) {\\n        const imageStyle = imageParent.firstChild.style;\\n        const styles = Object.keys(presets[imagePreset])\\n        for (let i = 0; i !== styles.length; i++) {\\n            imageStyle[styles[i]] = presets[imagePreset][i]\\n        }\\n    }\\n\\n    $: imageClass = \`\${image.class ? image.class : ''} \${imagePreset ? imagePreset : ''}\`\\n    $: if (fullscreen && !image?.src) getFullscreenSrc()\\n    $: if (fullscreen) {\\n        // In case user uses fullscreen preset, we need to get image source from new image and hide it\\n        afterUpdate(getFullscreenSrc)\\n    }\\n<\/script>\\n\\n<div class=\\"svelte-lightbox-body\\" class:svelte-lightbox-unselectable={protect} class:fullscreen style=\\"{fullscreen ? \`background-image: url(\${image.src || ''})\` : ''}\\">\\n\\t{#if !fullscreen && image.src}\\n\\t\\t<img src={image.src} alt={image.alt} style={image.style} class={imageClass}>\\n\\t{:else}\\n\\t\\t<div bind:this={imageParent} class:svelte-lightbox-image-portrait={portrait} class:expand={imagePreset == 'expand'}\\n\\t\\t     class:fit={imagePreset == 'fit'} class:fullscreen>\\n\\t\\t\\t<slot />\\n\\t\\t</div>\\n\\t{/if}\\n</div>\\n\\n<style>div.svelte-lightbox-body{background-color:transparent;height:auto;max-height:80vh;width:auto}div.svelte-lightbox-body.fullscreen{background-position:50%;background-repeat:no-repeat;background-size:contain}div.fullscreen{height:inherit;max-height:inherit;max-width:inherit;width:inherit}div.svelte-lightbox-unselectable{pointer-events:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}div.svelte-lightbox-image-portrait{height:90vh}div.expand{height:auto;max-height:90vh;width:90vw}</style>"],"names":[],"mappings":"AA0DO,GAAG,mCAAqB,CAAC,iBAAiB,WAAW,CAAC,OAAO,IAAI,CAAC,WAAW,IAAI,CAAC,MAAM,IAAI,CAAC,GAAG,qBAAqB,yBAAW,CAAC,oBAAoB,GAAG,CAAC,kBAAkB,SAAS,CAAC,gBAAgB,OAAO,CAAC,GAAG,yBAAW,CAAC,OAAO,OAAO,CAAC,WAAW,OAAO,CAAC,UAAU,OAAO,CAAC,MAAM,OAAO,CAAC,GAAG,2CAA6B,CAAC,eAAe,IAAI,CAAC,oBAAoB,IAAI,CAAC,iBAAiB,IAAI,CAAC,gBAAgB,IAAI,CAAC,YAAY,IAAI,CAAC,GAAG,6CAA+B,CAAC,OAAO,IAAI,CAAC,GAAG,qBAAO,CAAC,OAAO,IAAI,CAAC,WAAW,IAAI,CAAC,MAAM,IAAI,CAAC"}`
};
var LightboxBody = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let imageClass;
  let $$unsubscribe_activeImageStore;
  let { image = {} } = $$props;
  let { protect = false } = $$props;
  let { portrait = false } = $$props;
  let { imagePreset = false } = $$props;
  let { fullscreen = false } = $$props;
  let { gallery = false } = $$props;
  const activeImageStore = getContext("svelte-lightbox-activeImage");
  $$unsubscribe_activeImageStore = subscribe(activeImageStore, (value) => value);
  let imageParent;
  const getFullscreenSrc = () => {
    {
      queueMicrotask(getFullscreenSrc);
    }
  };
  if ($$props.image === void 0 && $$bindings.image && image !== void 0)
    $$bindings.image(image);
  if ($$props.protect === void 0 && $$bindings.protect && protect !== void 0)
    $$bindings.protect(protect);
  if ($$props.portrait === void 0 && $$bindings.portrait && portrait !== void 0)
    $$bindings.portrait(portrait);
  if ($$props.imagePreset === void 0 && $$bindings.imagePreset && imagePreset !== void 0)
    $$bindings.imagePreset(imagePreset);
  if ($$props.fullscreen === void 0 && $$bindings.fullscreen && fullscreen !== void 0)
    $$bindings.fullscreen(fullscreen);
  if ($$props.gallery === void 0 && $$bindings.gallery && gallery !== void 0)
    $$bindings.gallery(gallery);
  $$result.css.add(css$7);
  imageClass = `${image.class ? image.class : ""} ${imagePreset ? imagePreset : ""}`;
  {
    if (fullscreen && !(image == null ? void 0 : image.src))
      getFullscreenSrc();
  }
  {
    if (fullscreen) {
      afterUpdate(getFullscreenSrc);
    }
  }
  $$unsubscribe_activeImageStore();
  return `<div class="${[
    "svelte-lightbox-body svelte-u5033r",
    (protect ? "svelte-lightbox-unselectable" : "") + " " + (fullscreen ? "fullscreen" : "")
  ].join(" ").trim()}"${add_attribute("style", fullscreen ? `background-image: url(${image.src || ""})` : "", 0)}>${!fullscreen && image.src ? `<img${add_attribute("src", image.src, 0)}${add_attribute("alt", image.alt, 0)}${add_attribute("style", image.style, 0)}${add_attribute("class", imageClass, 0)}>` : `<div class="${[
    "svelte-u5033r",
    (portrait ? "svelte-lightbox-image-portrait" : "") + " " + (imagePreset == "expand" ? "expand" : "") + " " + (imagePreset == "fit" ? "fit" : "") + " " + (fullscreen ? "fullscreen" : "")
  ].join(" ").trim()}"${add_attribute("this", imageParent, 1)}>${slots.default ? slots.default({}) : ``}</div>`}
</div>`;
});
var css$6 = {
  code: "div.svelte-lightbox-footer.svelte-11qpfhu{background-color:transparent;color:#fff;height:auto;text-align:left;width:inherit}",
  map: `{"version":3,"file":"LightboxFooter.svelte","sources":["LightboxFooter.svelte"],"sourcesContent":["<script>\\n    export let title = '';\\n    export let description = '';\\n    export let galleryLength;\\n    export let activeImage;\\n\\n    export let classes = '';\\n    export let style = '';\\n<\/script>\\n\\n<div class={\\"svelte-lightbox-footer \\" + classes} {style}>\\n    <h2>\\n        {@html title}\\n    </h2>\\n    <h5>\\n        {@html description}\\n    </h5>\\n    {#if galleryLength}\\n        <p>\\n            Image {activeImage+1} of {galleryLength}\\n        </p>\\n    {/if}\\n</div>\\n\\n<style>div.svelte-lightbox-footer{background-color:transparent;color:#fff;height:auto;text-align:left;width:inherit}</style>"],"names":[],"mappings":"AAwBO,GAAG,sCAAuB,CAAC,iBAAiB,WAAW,CAAC,MAAM,IAAI,CAAC,OAAO,IAAI,CAAC,WAAW,IAAI,CAAC,MAAM,OAAO,CAAC"}`
};
var LightboxFooter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title = "" } = $$props;
  let { description = "" } = $$props;
  let { galleryLength } = $$props;
  let { activeImage } = $$props;
  let { classes = "" } = $$props;
  let { style: style2 = "" } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0)
    $$bindings.description(description);
  if ($$props.galleryLength === void 0 && $$bindings.galleryLength && galleryLength !== void 0)
    $$bindings.galleryLength(galleryLength);
  if ($$props.activeImage === void 0 && $$bindings.activeImage && activeImage !== void 0)
    $$bindings.activeImage(activeImage);
  if ($$props.classes === void 0 && $$bindings.classes && classes !== void 0)
    $$bindings.classes(classes);
  if ($$props.style === void 0 && $$bindings.style && style2 !== void 0)
    $$bindings.style(style2);
  $$result.css.add(css$6);
  return `<div class="${escape2(null_to_empty("svelte-lightbox-footer " + classes)) + " svelte-11qpfhu"}"${add_attribute("style", style2, 0)}><h2>${title}</h2>
    <h5>${description}</h5>
    ${galleryLength ? `<p>Image ${escape2(activeImage + 1)} of ${escape2(galleryLength)}</p>` : ``}
</div>`;
});
var css$5 = {
  code: 'div.svelte-k5ylur{align-items:center;background-color:rgba(43,39,45,.87);display:flex;height:100%;justify-content:center;overflow:hidden;position:fixed;width:100%;z-index:1000000!important}div.svelte-k5ylur,div.svelte-k5ylur:before{bottom:0;left:0;right:0;top:0}div.svelte-k5ylur:before{content:"";opacity:0;position:absolute;z-index:-1}div.svelte-k5ylur:after{clear:both;content:"";display:table}',
  map: `{"version":3,"file":"ModalCover.svelte","sources":["ModalCover.svelte"],"sourcesContent":["<script>\\n    import {fade} from 'svelte/transition';\\n    import {createEventDispatcher} from 'svelte';\\n\\n    export let transitionDuration;\\n    const dispatch = createEventDispatcher();\\n\\n    const click = () => {\\n        dispatch('click')\\n    }\\n<\/script>\\n\\n<div on:click in:fade={{duration:transitionDuration*2}} out:fade={{duration: transitionDuration/2}}>\\n    <slot>\\n    </slot>\\n</div>\\n\\n<style>div{align-items:center;background-color:rgba(43,39,45,.87);display:flex;height:100%;justify-content:center;overflow:hidden;position:fixed;width:100%;z-index:1000000!important}div,div:before{bottom:0;left:0;right:0;top:0}div:before{content:\\"\\";opacity:0;position:absolute;z-index:-1}div:after{clear:both;content:\\"\\";display:table}</style>"],"names":[],"mappings":"AAiBO,iBAAG,CAAC,YAAY,MAAM,CAAC,iBAAiB,KAAK,EAAE,CAAC,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,QAAQ,IAAI,CAAC,OAAO,IAAI,CAAC,gBAAgB,MAAM,CAAC,SAAS,MAAM,CAAC,SAAS,KAAK,CAAC,MAAM,IAAI,CAAC,QAAQ,OAAO,UAAU,CAAC,iBAAG,CAAC,iBAAG,OAAO,CAAC,OAAO,CAAC,CAAC,KAAK,CAAC,CAAC,MAAM,CAAC,CAAC,IAAI,CAAC,CAAC,iBAAG,OAAO,CAAC,QAAQ,EAAE,CAAC,QAAQ,CAAC,CAAC,SAAS,QAAQ,CAAC,QAAQ,EAAE,CAAC,iBAAG,MAAM,CAAC,MAAM,IAAI,CAAC,QAAQ,EAAE,CAAC,QAAQ,KAAK,CAAC"}`
};
var ModalCover = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { transitionDuration } = $$props;
  createEventDispatcher();
  if ($$props.transitionDuration === void 0 && $$bindings.transitionDuration && transitionDuration !== void 0)
    $$bindings.transitionDuration(transitionDuration);
  $$result.css.add(css$5);
  return `<div class="${"svelte-k5ylur"}">${slots.default ? slots.default({}) : `
    `}
</div>`;
});
var css$4 = {
  code: "div.svelte-15m89t{background-color:transparent;height:auto;max-height:90vh;max-width:90vw;position:relative;width:auto}.fullscreen.svelte-15m89t{height:inherit;max-height:inherit;max-width:inherit;width:inherit}",
  map: `{"version":3,"file":"Modal.svelte","sources":["Modal.svelte"],"sourcesContent":["<script>\\n    import {fade} from 'svelte/transition';\\n    import {createEventDispatcher} from 'svelte';\\n\\n    const dispatch = createEventDispatcher();\\n\\n    export let modalStyle;\\n    export let modalClasses;\\n    export let transitionDuration;\\n    export let fullscreen = false;\\n\\n    const click = () => {\\n        dispatch('click')\\n    }\\n<\/script>\\n\\n<div class={modalClasses} class:fullscreen transition:fade={{duration:transitionDuration}}\\n     on:click>\\n    <slot>\\n    </slot>\\n</div>\\n\\n<style>div{background-color:transparent;height:auto;max-height:90vh;max-width:90vw;position:relative;width:auto}.fullscreen{height:inherit;max-height:inherit;max-width:inherit;width:inherit}</style>"],"names":[],"mappings":"AAsBO,iBAAG,CAAC,iBAAiB,WAAW,CAAC,OAAO,IAAI,CAAC,WAAW,IAAI,CAAC,UAAU,IAAI,CAAC,SAAS,QAAQ,CAAC,MAAM,IAAI,CAAC,yBAAW,CAAC,OAAO,OAAO,CAAC,WAAW,OAAO,CAAC,UAAU,OAAO,CAAC,MAAM,OAAO,CAAC"}`
};
var Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let { modalStyle } = $$props;
  let { modalClasses } = $$props;
  let { transitionDuration } = $$props;
  let { fullscreen = false } = $$props;
  if ($$props.modalStyle === void 0 && $$bindings.modalStyle && modalStyle !== void 0)
    $$bindings.modalStyle(modalStyle);
  if ($$props.modalClasses === void 0 && $$bindings.modalClasses && modalClasses !== void 0)
    $$bindings.modalClasses(modalClasses);
  if ($$props.transitionDuration === void 0 && $$bindings.transitionDuration && transitionDuration !== void 0)
    $$bindings.transitionDuration(transitionDuration);
  if ($$props.fullscreen === void 0 && $$bindings.fullscreen && fullscreen !== void 0)
    $$bindings.fullscreen(fullscreen);
  $$result.css.add(css$4);
  return `<div class="${[
    escape2(null_to_empty(modalClasses)) + " svelte-15m89t",
    fullscreen ? "fullscreen" : ""
  ].join(" ").trim()}">${slots.default ? slots.default({}) : `
    `}
</div>`;
});
var Index = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let fullscreen;
  let $activeImageStore, $$unsubscribe_activeImageStore;
  createEventDispatcher();
  let { modalClasses = "" } = $$props;
  let { modalStyle = "" } = $$props;
  let { transitionDuration = 500 } = $$props;
  let { image = {} } = $$props;
  let { protect = false } = $$props;
  let { portrait = false } = $$props;
  let { title = "" } = $$props;
  let { description = "" } = $$props;
  let { gallery = [] } = $$props;
  let { imagePreset } = $$props;
  let { closeButton } = $$props;
  const activeImageStore = new writable2(0);
  $$unsubscribe_activeImageStore = subscribe(activeImageStore, (value) => $activeImageStore = value);
  let actualTitle;
  let actualDescription;
  setContext("svelte-lightbox-activeImage", activeImageStore);
  if ($$props.modalClasses === void 0 && $$bindings.modalClasses && modalClasses !== void 0)
    $$bindings.modalClasses(modalClasses);
  if ($$props.modalStyle === void 0 && $$bindings.modalStyle && modalStyle !== void 0)
    $$bindings.modalStyle(modalStyle);
  if ($$props.transitionDuration === void 0 && $$bindings.transitionDuration && transitionDuration !== void 0)
    $$bindings.transitionDuration(transitionDuration);
  if ($$props.image === void 0 && $$bindings.image && image !== void 0)
    $$bindings.image(image);
  if ($$props.protect === void 0 && $$bindings.protect && protect !== void 0)
    $$bindings.protect(protect);
  if ($$props.portrait === void 0 && $$bindings.portrait && portrait !== void 0)
    $$bindings.portrait(portrait);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0)
    $$bindings.description(description);
  if ($$props.gallery === void 0 && $$bindings.gallery && gallery !== void 0)
    $$bindings.gallery(gallery);
  if ($$props.imagePreset === void 0 && $$bindings.imagePreset && imagePreset !== void 0)
    $$bindings.imagePreset(imagePreset);
  if ($$props.closeButton === void 0 && $$bindings.closeButton && closeButton !== void 0)
    $$bindings.closeButton(closeButton);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    actualTitle = title;
    actualDescription = description;
    {
      if (gallery && !title && !description) {
        actualTitle = gallery[$activeImageStore].title;
        actualDescription = gallery[$activeImageStore].description;
      }
    }
    fullscreen = imagePreset === "fullscreen";
    $$rendered = `${validate_component(ModalCover, "ModalCover").$$render($$result, { transitionDuration }, {
      transitionDuration: ($$value) => {
        transitionDuration = $$value;
        $$settled = false;
      }
    }, {
      default: () => `${validate_component(Modal, "Modal").$$render($$result, {
        fullscreen,
        modalClasses,
        modalStyle,
        transitionDuration
      }, {
        modalClasses: ($$value) => {
          modalClasses = $$value;
          $$settled = false;
        },
        modalStyle: ($$value) => {
          modalStyle = $$value;
          $$settled = false;
        },
        transitionDuration: ($$value) => {
          transitionDuration = $$value;
          $$settled = false;
        }
      }, {
        default: () => `${validate_component(LightboxHeader, "Header").$$render($$result, { fullscreen, closeButton }, {
          closeButton: ($$value) => {
            closeButton = $$value;
            $$settled = false;
          }
        }, {})}

        ${validate_component(LightboxBody, "Body").$$render($$result, {
          imagePreset,
          fullscreen,
          gallery: !!gallery.length,
          image,
          protect,
          portrait
        }, {
          image: ($$value) => {
            image = $$value;
            $$settled = false;
          },
          protect: ($$value) => {
            protect = $$value;
            $$settled = false;
          },
          portrait: ($$value) => {
            portrait = $$value;
            $$settled = false;
          }
        }, {
          default: () => `${slots.default ? slots.default({}) : ``}`
        })}


        ${validate_component(LightboxFooter, "Footer").$$render($$result, {
          galleryLength: gallery ? gallery.length : false,
          title: actualTitle,
          description: actualDescription,
          activeImage: $activeImageStore
        }, {
          title: ($$value) => {
            actualTitle = $$value;
            $$settled = false;
          },
          description: ($$value) => {
            actualDescription = $$value;
            $$settled = false;
          },
          activeImage: ($$value) => {
            $activeImageStore = $$value;
            $$settled = false;
          }
        }, {})}`
      })}`
    })}`;
  } while (!$$settled);
  $$unsubscribe_activeImageStore();
  return $$rendered;
});
var css$3 = {
  code: "div.svelte-1590g1f{max-height:inherit}div.fullscreen.svelte-1590g1f{height:100%;width:100%}.arrow.svelte-1590g1f{fill:none;stroke:var(--svelte-lightbox-arrows-color);stroke-linecap:round;stroke-linejoin:bevel;stroke-width:1.5px;margin:10px}button.svelte-1590g1f{border:none;font-size:1rem;height:100%;width:50%}button.svelte-1590g1f,button.svelte-1590g1f:active{background:transparent}button.svelte-1590g1f:disabled{color:grey}button:disabled.hideDisabled.svelte-1590g1f{visibility:hidden}.wrapper.svelte-1590g1f{display:flex;height:auto;position:relative;width:auto}.previous-button.svelte-1590g1f{bottom:0;left:0;position:absolute;right:50%;text-align:left;top:0;z-index:4}.slot.svelte-1590g1f{display:flex;justify-content:center;order:1}.next-button.svelte-1590g1f{bottom:0;position:absolute;right:0;text-align:right;top:0;z-index:4}svg.svelte-1590g1f{height:5rem}",
  map: `{"version":3,"file":"InternalGallery.svelte","sources":["InternalGallery.svelte"],"sourcesContent":["<script>\\n    // Gives option for user to control displayed image\\n    import {getContext, setContext} from \\"svelte\\";\\n    import {writable} from \\"svelte/store\\";\\n\\n    export let imagePreset = '';\\n    const activeImageStore = getContext('svelte-lightbox-activeImage');\\n    const arrowsColorStore = new writable('black');\\n    const arrowsCharacterStore = new writable('unset');\\n    const keyboardControlStore = new writable(false);\\n    // Here will be stored markup that will user put inside of this component\\n    let slotContent;\\n    // Auxiliary variable for storing elements with image that user has provided\\n    let images;\\n\\n    const previousImage = () => {\\n        if (activeImage === 0) {\\n            if (galleryArrowsCharacter === 'loop') {\\n                activeImageStore.set(images.length - 1)\\n            }\\n        } else {\\n            activeImageStore.set(activeImage - 1)\\n        }\\n    }\\n    const nextImage = () => {\\n        if (activeImage === images.length - 1) {\\n            if (galleryArrowsCharacter === 'loop') {\\n                activeImageStore.set(0)\\n            }\\n        } else {\\n            activeImageStore.set(activeImage + 1)\\n        }\\n    }\\n    const handleKey = (event) => {\\n        if (!disableKeyboardArrowsControl) {\\n            switch (event.key) {\\n                case 'ArrowLeft': {\\n                    previousImage();\\n                    break;\\n                }\\n                case 'ArrowRight': {\\n                    nextImage();\\n                    break;\\n                }\\n            }\\n        }\\n    };\\n\\n    setContext('svelte-lightbox-galleryArrowsColor', arrowsColorStore)\\n    setContext('svelte-lightbox-galleryArrowsCharacter', arrowsCharacterStore)\\n    setContext('svelte-lightbox-disableKeyboardArrowsControl', keyboardControlStore)\\n\\n    $: activeImage = $activeImageStore;\\n    $: galleryArrowsColor = $arrowsColorStore;\\n    $: galleryArrowsCharacter = $arrowsCharacterStore;\\n    $: disableKeyboardArrowsControl = $keyboardControlStore;\\n    // Every time, when contents of this component changes, images will be updated\\n    $: images = slotContent?.children\\n\\n    $: {\\n        /*\\n        When activeImage or images array changes, checks if active image points to existing image and then displays it,\\n        if selected image doesn't exist, then logs out error, these error normally does not occur, only in cases when\\n        activeImage is controlled programmatically\\n         */\\n        if (images && activeImage < images.length) {\\n            Object.values(images).forEach(img=>{\\n                img.hidden = true;\\n                return img\\n            })\\n\\t        if (!fullscreen) {\\n                images[activeImage].hidden = false;\\n\\t        }\\n        } else if (images && activeImage >= images.length) {\\n            console.error(\\"LightboxGallery: Selected image doesn't exist, invalid activeImage\\")\\n        }\\n    }\\n\\n    $: fullscreen = imagePreset === 'fullscreen';\\n<\/script>\\n\\n<svelte:window on:keydown={ (event)=> handleKey(event) }/>\\n\\n<div class=\\"wrapper\\" class:fullscreen style=\\"--svelte-lightbox-arrows-color: {galleryArrowsColor}\\">\\n    <!-- Left arrow -->\\n    <button on:click={previousImage} disabled={galleryArrowsCharacter !== 'loop' && activeImage === 0}\\n            class=\\"previous-button\\" class:hideDisabled={galleryArrowsCharacter === 'hide'}>\\n        <svg viewBox=\\"0 0 24 24\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\n            <g>\\n                <path class=\\"arrow\\" d=\\"M8.7,7.22,4.59,11.33a1,1,0,0,0,0,1.41l4,4\\"/>\\n            </g>\\n        </svg>\\n    </button>\\n\\n    <!-- Image wrapper -->\\n    <div bind:this={slotContent} class=\\"slot\\">\\n        <slot>\\n        </slot>\\n    </div>\\n\\n    <!-- Right arrow -->\\n    <button on:click={nextImage} disabled={galleryArrowsCharacter !== 'loop' && activeImage === images?.length-1}\\n            class=\\"next-button\\" class:hideDisabled={galleryArrowsCharacter === 'hide'}>\\n        <svg viewBox=\\"0 0 24 24\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\n            <g>\\n                <path d=\\"M15.3,16.78l4.11-4.11a1,1,0,0,0,0-1.41l-4-4\\" class=\\"arrow\\"/>\\n            </g>\\n        </svg>\\n    </button>\\n</div>\\n\\n\\n<style>div{max-height:inherit}div.fullscreen{height:100%;width:100%}.arrow{fill:none;stroke:var(--svelte-lightbox-arrows-color);stroke-linecap:round;stroke-linejoin:bevel;stroke-width:1.5px;margin:10px}button{border:none;font-size:1rem;height:100%;width:50%}button,button:active{background:transparent}button:disabled{color:grey}button:disabled.hideDisabled{visibility:hidden}.wrapper{display:flex;height:auto;position:relative;width:auto}.previous-button{bottom:0;left:0;position:absolute;right:50%;text-align:left;top:0;z-index:4}.slot{display:flex;justify-content:center;order:1}.next-button{bottom:0;position:absolute;right:0;text-align:right;top:0;z-index:4}svg{height:5rem}</style>"],"names":[],"mappings":"AAgHO,kBAAG,CAAC,WAAW,OAAO,CAAC,GAAG,0BAAW,CAAC,OAAO,IAAI,CAAC,MAAM,IAAI,CAAC,qBAAM,CAAC,KAAK,IAAI,CAAC,OAAO,IAAI,8BAA8B,CAAC,CAAC,eAAe,KAAK,CAAC,gBAAgB,KAAK,CAAC,aAAa,KAAK,CAAC,OAAO,IAAI,CAAC,qBAAM,CAAC,OAAO,IAAI,CAAC,UAAU,IAAI,CAAC,OAAO,IAAI,CAAC,MAAM,GAAG,CAAC,qBAAM,CAAC,qBAAM,OAAO,CAAC,WAAW,WAAW,CAAC,qBAAM,SAAS,CAAC,MAAM,IAAI,CAAC,MAAM,SAAS,4BAAa,CAAC,WAAW,MAAM,CAAC,uBAAQ,CAAC,QAAQ,IAAI,CAAC,OAAO,IAAI,CAAC,SAAS,QAAQ,CAAC,MAAM,IAAI,CAAC,+BAAgB,CAAC,OAAO,CAAC,CAAC,KAAK,CAAC,CAAC,SAAS,QAAQ,CAAC,MAAM,GAAG,CAAC,WAAW,IAAI,CAAC,IAAI,CAAC,CAAC,QAAQ,CAAC,CAAC,oBAAK,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,MAAM,CAAC,CAAC,2BAAY,CAAC,OAAO,CAAC,CAAC,SAAS,QAAQ,CAAC,MAAM,CAAC,CAAC,WAAW,KAAK,CAAC,IAAI,CAAC,CAAC,QAAQ,CAAC,CAAC,kBAAG,CAAC,OAAO,IAAI,CAAC"}`
};
var InternalGallery = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let activeImage;
  let galleryArrowsColor;
  let galleryArrowsCharacter;
  let fullscreen;
  let $activeImageStore, $$unsubscribe_activeImageStore;
  let $arrowsColorStore, $$unsubscribe_arrowsColorStore;
  let $arrowsCharacterStore, $$unsubscribe_arrowsCharacterStore;
  let $$unsubscribe_keyboardControlStore;
  let { imagePreset = "" } = $$props;
  const activeImageStore = getContext("svelte-lightbox-activeImage");
  $$unsubscribe_activeImageStore = subscribe(activeImageStore, (value) => $activeImageStore = value);
  const arrowsColorStore = new writable2("black");
  $$unsubscribe_arrowsColorStore = subscribe(arrowsColorStore, (value) => $arrowsColorStore = value);
  const arrowsCharacterStore = new writable2("unset");
  $$unsubscribe_arrowsCharacterStore = subscribe(arrowsCharacterStore, (value) => $arrowsCharacterStore = value);
  const keyboardControlStore = new writable2(false);
  $$unsubscribe_keyboardControlStore = subscribe(keyboardControlStore, (value) => value);
  let slotContent;
  let images;
  setContext("svelte-lightbox-galleryArrowsColor", arrowsColorStore);
  setContext("svelte-lightbox-galleryArrowsCharacter", arrowsCharacterStore);
  setContext("svelte-lightbox-disableKeyboardArrowsControl", keyboardControlStore);
  if ($$props.imagePreset === void 0 && $$bindings.imagePreset && imagePreset !== void 0)
    $$bindings.imagePreset(imagePreset);
  $$result.css.add(css$3);
  activeImage = $activeImageStore;
  galleryArrowsColor = $arrowsColorStore;
  galleryArrowsCharacter = $arrowsCharacterStore;
  images = slotContent == null ? void 0 : slotContent.children;
  fullscreen = imagePreset === "fullscreen";
  {
    {
      if (images && activeImage < images.length) {
        Object.values(images).forEach((img) => {
          img.hidden = true;
          return img;
        });
        if (!fullscreen) {
          images[activeImage].hidden = false;
        }
      } else if (images && activeImage >= images.length) {
        console.error("LightboxGallery: Selected image doesn't exist, invalid activeImage");
      }
    }
  }
  $$unsubscribe_activeImageStore();
  $$unsubscribe_arrowsColorStore();
  $$unsubscribe_arrowsCharacterStore();
  $$unsubscribe_keyboardControlStore();
  return `

<div class="${["wrapper svelte-1590g1f", fullscreen ? "fullscreen" : ""].join(" ").trim()}" style="${"--svelte-lightbox-arrows-color: " + escape2(galleryArrowsColor)}">
    <button ${galleryArrowsCharacter !== "loop" && activeImage === 0 ? "disabled" : ""} class="${[
    "previous-button svelte-1590g1f",
    galleryArrowsCharacter === "hide" ? "hideDisabled" : ""
  ].join(" ").trim()}"><svg viewBox="${"0 0 24 24"}" xmlns="${"http://www.w3.org/2000/svg"}" class="${"svelte-1590g1f"}"><g><path class="${"arrow svelte-1590g1f"}" d="${"M8.7,7.22,4.59,11.33a1,1,0,0,0,0,1.41l4,4"}"></path></g></svg></button>

    
    <div class="${"slot svelte-1590g1f"}"${add_attribute("this", slotContent, 1)}>${slots.default ? slots.default({}) : `
        `}</div>

    
    <button ${galleryArrowsCharacter !== "loop" && activeImage === (images == null ? void 0 : images.length) - 1 ? "disabled" : ""} class="${[
    "next-button svelte-1590g1f",
    galleryArrowsCharacter === "hide" ? "hideDisabled" : ""
  ].join(" ").trim()}"><svg viewBox="${"0 0 24 24"}" xmlns="${"http://www.w3.org/2000/svg"}" class="${"svelte-1590g1f"}"><g><path d="${"M15.3,16.78l4.11-4.11a1,1,0,0,0,0-1.41l-4-4"}" class="${"arrow svelte-1590g1f"}"></path></g></svg></button>
</div>`;
});
var BodyChild = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, []);
  let targetElement;
  let child;
  const stackTarget = () => {
    child = document.createElement("div");
    document.body.appendChild(child);
    child.appendChild(targetElement);
  };
  const removeTarget = () => {
    if (typeof document !== "undefined") {
      document.body.removeChild(child);
    }
  };
  onMount(stackTarget);
  onDestroy(removeTarget);
  return `<div${spread([$$restProps])}${add_attribute("this", targetElement, 1)}>${slots.default ? slots.default({}) : ``}</div>`;
});
var Lightbox = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$slots = compute_slots(slots);
  let { thumbnailClasses = "" } = $$props;
  let { thumbnailStyle = "" } = $$props;
  let { modalClasses = "" } = $$props;
  let { modalStyle = "" } = $$props;
  let { gallery = false } = $$props;
  let { title = "" } = $$props;
  let { description = "" } = $$props;
  let { transitionDuration = 500 } = $$props;
  let { protect = false } = $$props;
  let { image = {} } = $$props;
  let { portrait = false } = $$props;
  let { noScroll = true } = $$props;
  let { thumbnail = false } = $$props;
  let { imagePreset = false } = $$props;
  let { clickToClose = false } = $$props;
  let { closeButton = true } = $$props;
  let { isVisible = false } = $$props;
  onMount(() => {
    document.body.style.overflow;
  });
  if ($$props.thumbnailClasses === void 0 && $$bindings.thumbnailClasses && thumbnailClasses !== void 0)
    $$bindings.thumbnailClasses(thumbnailClasses);
  if ($$props.thumbnailStyle === void 0 && $$bindings.thumbnailStyle && thumbnailStyle !== void 0)
    $$bindings.thumbnailStyle(thumbnailStyle);
  if ($$props.modalClasses === void 0 && $$bindings.modalClasses && modalClasses !== void 0)
    $$bindings.modalClasses(modalClasses);
  if ($$props.modalStyle === void 0 && $$bindings.modalStyle && modalStyle !== void 0)
    $$bindings.modalStyle(modalStyle);
  if ($$props.gallery === void 0 && $$bindings.gallery && gallery !== void 0)
    $$bindings.gallery(gallery);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0)
    $$bindings.description(description);
  if ($$props.transitionDuration === void 0 && $$bindings.transitionDuration && transitionDuration !== void 0)
    $$bindings.transitionDuration(transitionDuration);
  if ($$props.protect === void 0 && $$bindings.protect && protect !== void 0)
    $$bindings.protect(protect);
  if ($$props.image === void 0 && $$bindings.image && image !== void 0)
    $$bindings.image(image);
  if ($$props.portrait === void 0 && $$bindings.portrait && portrait !== void 0)
    $$bindings.portrait(portrait);
  if ($$props.noScroll === void 0 && $$bindings.noScroll && noScroll !== void 0)
    $$bindings.noScroll(noScroll);
  if ($$props.thumbnail === void 0 && $$bindings.thumbnail && thumbnail !== void 0)
    $$bindings.thumbnail(thumbnail);
  if ($$props.imagePreset === void 0 && $$bindings.imagePreset && imagePreset !== void 0)
    $$bindings.imagePreset(imagePreset);
  if ($$props.clickToClose === void 0 && $$bindings.clickToClose && clickToClose !== void 0)
    $$bindings.clickToClose(clickToClose);
  if ($$props.closeButton === void 0 && $$bindings.closeButton && closeButton !== void 0)
    $$bindings.closeButton(closeButton);
  if ($$props.isVisible === void 0 && $$bindings.isVisible && isVisible !== void 0)
    $$bindings.isVisible(isVisible);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `${validate_component(LightboxThumbnail, "Thumbnail").$$render($$result, {
      thumbnailClasses,
      thumbnailStyle,
      protect
    }, {
      thumbnailClasses: ($$value) => {
        thumbnailClasses = $$value;
        $$settled = false;
      },
      thumbnailStyle: ($$value) => {
        thumbnailStyle = $$value;
        $$settled = false;
      },
      protect: ($$value) => {
        protect = $$value;
        $$settled = false;
      }
    }, {
      default: () => `${thumbnail || gallery ? `${slots.thumbnail ? slots.thumbnail({}) : ``}` : `${slots.default ? slots.default({}) : ``}`}`
    })}

${isVisible ? `${validate_component(BodyChild, "BodyChild").$$render($$result, {}, {}, {
      default: () => `${validate_component(Index, "Modal").$$render($$result, {
        modalClasses,
        modalStyle,
        transitionDuration,
        image,
        protect,
        portrait,
        title,
        description,
        gallery,
        imagePreset,
        closeButton
      }, {
        modalClasses: ($$value) => {
          modalClasses = $$value;
          $$settled = false;
        },
        modalStyle: ($$value) => {
          modalStyle = $$value;
          $$settled = false;
        },
        transitionDuration: ($$value) => {
          transitionDuration = $$value;
          $$settled = false;
        },
        image: ($$value) => {
          image = $$value;
          $$settled = false;
        },
        protect: ($$value) => {
          protect = $$value;
          $$settled = false;
        },
        portrait: ($$value) => {
          portrait = $$value;
          $$settled = false;
        },
        title: ($$value) => {
          title = $$value;
          $$settled = false;
        },
        description: ($$value) => {
          description = $$value;
          $$settled = false;
        },
        gallery: ($$value) => {
          gallery = $$value;
          $$settled = false;
        },
        imagePreset: ($$value) => {
          imagePreset = $$value;
          $$settled = false;
        },
        closeButton: ($$value) => {
          closeButton = $$value;
          $$settled = false;
        }
      }, {
        default: () => `${thumbnail ? `${slots.image ? slots.image({}) : ``}` : `${gallery ? `${validate_component(InternalGallery, "InternalGallery").$$render($$result, { imagePreset }, {}, {
          default: () => `${$$slots.thumbnail ? `<div>${slots.thumbnail ? slots.thumbnail({}) : ``}</div>` : ``}
					${slots.default ? slots.default({}) : `
					`}`
        })}` : `${slots.default ? slots.default({}) : ``}`}`}`
      })}`
    })}` : ``}`;
  } while (!$$settled);
  return $$rendered;
});
var css$2 = {
  code: "div.svelte-1qglx8t{display:flex;justify-content:center;max-height:inherit}",
  map: `{"version":3,"file":"LightboxImage.svelte","sources":["LightboxImage.svelte"],"sourcesContent":["<script>\\n    /*\\n    This component exist because it helps user imagine what and how are images displayed in gallery,\\n    also we need every picture in gallery to be hidden until they are active, and by making this component\\n    we don't bother user with setting it manually.\\n     */\\n<\/script>\\n\\n<div hidden={true} {...$$restProps}>\\n    <slot/>\\n</div>\\n\\n<style>div{display:flex;justify-content:center;max-height:inherit}</style>"],"names":[],"mappings":"AAYO,kBAAG,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,WAAW,OAAO,CAAC"}`
};
create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, []);
  $$result.css.add(css$2);
  return `<div${spread([{ hidden: true }, $$restProps], "svelte-1qglx8t")}>${slots.default ? slots.default({}) : ``}
</div>`;
});
create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, [
    "activeImage",
    "galleryArrowsColor",
    "galleryArrowsCharacter",
    "disableKeyboardArrowsControl"
  ]);
  let { activeImage = 0 } = $$props;
  let { galleryArrowsColor = "black" } = $$props;
  let { galleryArrowsCharacter = "unset" } = $$props;
  let { disableKeyboardArrowsControl = false } = $$props;
  const activeImageStore = getContext("svelte-lightbox-activeImage");
  const arrowsColorStore = getContext("svelte-lightbox-galleryArrowsColor");
  const arrowsCharacterStore = getContext("svelte-lightbox-galleryArrowsCharacter");
  const keyboardControlStore = getContext("svelte-lightbox-disableKeyboardArrowsControl");
  if ($$props.activeImage === void 0 && $$bindings.activeImage && activeImage !== void 0)
    $$bindings.activeImage(activeImage);
  if ($$props.galleryArrowsColor === void 0 && $$bindings.galleryArrowsColor && galleryArrowsColor !== void 0)
    $$bindings.galleryArrowsColor(galleryArrowsColor);
  if ($$props.galleryArrowsCharacter === void 0 && $$bindings.galleryArrowsCharacter && galleryArrowsCharacter !== void 0)
    $$bindings.galleryArrowsCharacter(galleryArrowsCharacter);
  if ($$props.disableKeyboardArrowsControl === void 0 && $$bindings.disableKeyboardArrowsControl && disableKeyboardArrowsControl !== void 0)
    $$bindings.disableKeyboardArrowsControl(disableKeyboardArrowsControl);
  {
    activeImageStore.set(activeImage);
  }
  {
    arrowsColorStore.set(galleryArrowsColor);
  }
  {
    arrowsCharacterStore.set(galleryArrowsCharacter);
  }
  {
    keyboardControlStore.set(disableKeyboardArrowsControl);
  }
  return `${slots.default ? slots.default({ ...$$restProps }) : `
`}`;
});
var css$1 = {
  code: "main.svelte-1ca5qmc.svelte-1ca5qmc{height:75vh}main.svelte-1ca5qmc .horizontal-snap.svelte-1ca5qmc{display:grid;gap:1rem;grid-auto-flow:column;height:calc(280px + 1rem);margin:0 auto;overflow-y:auto;overscroll-behavior-x:contain;padding:1rem;-ms-scroll-snap-type:x mandatory;scroll-snap-type:x mandatory}main.svelte-1ca5qmc .horizontal-snap img.svelte-1ca5qmc{max-width:none;-o-object-fit:contain;object-fit:contain;scroll-snap-align:center;width:220px}",
  map: `{"version":3,"file":"flowers.svelte","sources":["flowers.svelte"],"sourcesContent":["<script lang=\\"ts\\">import dinner_party_1 from '$lib/assets/dinner_party_1.jpeg?width=672';\\nimport dinner_party_2 from '$lib/assets/dinner_party_2.jpeg?width=672';\\nimport dinner_party_3 from '$lib/assets/dinner_party_3.jpeg?width=672';\\nimport dinner_party_4 from '$lib/assets/dinner_party_4.jpeg?width=672';\\nimport dinner_party_5 from '$lib/assets/dinner_party_5.jpeg?width=672';\\nimport dinner_party_6 from '$lib/assets/dinner_party_6.jpeg?width=672';\\nimport dinner_party_7 from '$lib/assets/dinner_party_7.jpeg?width=672';\\nimport table_arrangement_1 from '$lib/assets/table_arrangement_1.jpeg?width=672';\\nimport table_arrangement_2 from '$lib/assets/table_arrangement_2.jpeg?width=672';\\nimport table_arrangement_3 from '$lib/assets/table_arrangement_3.jpeg?width=672';\\nimport table_arrangement_4 from '$lib/assets/table_arrangement_4.jpeg?width=672';\\nimport wedding_1 from '$lib/assets/wedding_1.jpeg?width=672';\\nimport wedding_2 from '$lib/assets/wedding_2.jpeg?width=672';\\nimport wedding_3 from '$lib/assets/wedding_3.jpeg?width=672';\\nimport wedding_4 from '$lib/assets/wedding_4.jpeg?width=672';\\nimport wedding_5 from '$lib/assets/wedding_5.jpeg?width=672';\\nimport wedding_6 from '$lib/assets/wedding_6.jpeg?width=672';\\nimport wedding_7 from '$lib/assets/wedding_7.jpeg?width=672';\\nimport wedding_8 from '$lib/assets/wedding_8.jpeg?width=672';\\nimport wedding_9 from '$lib/assets/wedding_9.jpeg?width=672';\\nimport wedding_10 from '$lib/assets/wedding_10.jpeg?width=672';\\nimport { Lightbox } from 'svelte-lightbox';\\nconst weddings = [\\n    wedding_1,\\n    wedding_2,\\n    wedding_3,\\n    wedding_4,\\n    wedding_5,\\n    wedding_6,\\n    wedding_7,\\n    wedding_8,\\n    wedding_9,\\n    wedding_10\\n];\\nconst tableArrangements = [\\n    table_arrangement_1,\\n    table_arrangement_2,\\n    table_arrangement_3,\\n    table_arrangement_4\\n];\\nconst dinnerParties = [\\n    dinner_party_1,\\n    dinner_party_2,\\n    dinner_party_3,\\n    dinner_party_4,\\n    dinner_party_5,\\n    dinner_party_6,\\n    dinner_party_7\\n];\\nlet selectedImg;\\nconst handleClick = (parameter) => {\\n    selectedImg = parameter;\\n    console.log(selectedImg);\\n};\\n<\/script>\\n\\n<main>\\n\\t<p>\\n\\t\\tMrs. Hurst sang with her sister, and while they were thus employed, Elizabeth could not help\\n\\t\\tobserving, as she turned over some music-books that lay on the instrument, how frequently Mr.\\n\\t\\tDarcy\u2019s eyes were fixed on her. She hardly knew how to suppose that she could be an object of\\n\\t\\tadmiration to so great a man; and yet that he should look at her because he disliked her, was\\n\\t\\tstill more strange. She could only imagine, however, at last that she drew his notice because\\n\\t\\tthere was something more wrong and reprehensible, according to his ideas of right, than in any\\n\\t\\tother person present. The supposition did not pain her. She liked him too little to care for his\\n\\t\\tapprobation.\\n\\t</p>\\n\\n\\t<p>\\n\\t\\tAfter playing some Italian songs, Miss Bingley varied the charm by a lively Scotch air; and soon\\n\\t\\tafterwards Mr. Darcy, drawing near Elizabeth, said to her:\\n\\t</p>\\n\\n\\t<p>\\n\\t\\t\u201CDo not you feel a great inclination, Miss Bennet, to seize such an opportunity of dancing a\\n\\t\\treel?\u201D\\n\\t</p>\\n\\t<h3 class=\\"pt-16\\">Wedding</h3>\\n\\t<div class=\\"horizontal-snap\\">\\n\\t\\t{#each weddings as wedding}\\n\\t\\t\\t<img src={wedding} alt=\\"Wedding Arrangement\\" on:click={() => handleClick(wedding)} />\\n\\t\\t{/each}\\n\\t</div>\\n\\t<h3 class=\\"pt-16\\">Dinner Party</h3>\\n\\t<div class=\\"horizontal-snap\\">\\n\\t\\t{#each dinnerParties as dinnerParty}\\n\\t\\t\\t<img src={dinnerParty} alt=\\"Table Arrangement\\" on:click={() => handleClick(dinnerParty)} />\\n\\t\\t{/each}\\n\\t</div>\\n\\t<h3 class=\\"pt-16\\">Table Arrangements</h3>\\n\\t<div class=\\"horizontal-snap\\">\\n\\t\\t{#each tableArrangements as tableArrangement}\\n\\t\\t\\t<img\\n\\t\\t\\t\\tsrc={tableArrangement}\\n\\t\\t\\t\\talt=\\"Table Arrangement\\"\\n\\t\\t\\t\\ton:click={() => handleClick(tableArrangement)}\\n\\t\\t\\t/>\\n\\t\\t{/each}\\n\\t</div>\\n\\t<Lightbox isVisible={!!selectedImg}>\\n\\t\\t<img src={selectedImg} />\\n\\t</Lightbox>\\n</main>\\n\\n<style lang=\\"scss\\">main{height:75vh}main .horizontal-snap{display:grid;gap:1rem;grid-auto-flow:column;height:calc(280px + 1rem);margin:0 auto;overflow-y:auto;overscroll-behavior-x:contain;padding:1rem;-ms-scroll-snap-type:x mandatory;scroll-snap-type:x mandatory}main .horizontal-snap img{max-width:none;-o-object-fit:contain;object-fit:contain;scroll-snap-align:center;width:220px}</style>\\n"],"names":[],"mappings":"AAwGmB,kCAAI,CAAC,OAAO,IAAI,CAAC,mBAAI,CAAC,+BAAgB,CAAC,QAAQ,IAAI,CAAC,IAAI,IAAI,CAAC,eAAe,MAAM,CAAC,OAAO,KAAK,KAAK,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,OAAO,CAAC,CAAC,IAAI,CAAC,WAAW,IAAI,CAAC,sBAAsB,OAAO,CAAC,QAAQ,IAAI,CAAC,qBAAqB,CAAC,CAAC,SAAS,CAAC,iBAAiB,CAAC,CAAC,SAAS,CAAC,mBAAI,CAAC,gBAAgB,CAAC,kBAAG,CAAC,UAAU,IAAI,CAAC,cAAc,OAAO,CAAC,WAAW,OAAO,CAAC,kBAAkB,MAAM,CAAC,MAAM,KAAK,CAAC"}`
};
var Flowers = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const weddings = [
    wedding_1,
    wedding_2,
    wedding_3,
    wedding_4,
    wedding_5,
    wedding_6,
    wedding_7,
    wedding_8,
    wedding_9,
    wedding_10
  ];
  const tableArrangements = [
    table_arrangement_1,
    table_arrangement_2,
    table_arrangement_3,
    table_arrangement_4
  ];
  const dinnerParties = [
    dinner_party_1,
    dinner_party_2,
    dinner_party_3,
    dinner_party_4,
    dinner_party_5,
    dinner_party_6,
    dinner_party_7
  ];
  let selectedImg;
  $$result.css.add(css$1);
  return `<main class="${"svelte-1ca5qmc"}"><p>Mrs. Hurst sang with her sister, and while they were thus employed, Elizabeth could not help
		observing, as she turned over some music-books that lay on the instrument, how frequently Mr.
		Darcy\u2019s eyes were fixed on her. She hardly knew how to suppose that she could be an object of
		admiration to so great a man; and yet that he should look at her because he disliked her, was
		still more strange. She could only imagine, however, at last that she drew his notice because
		there was something more wrong and reprehensible, according to his ideas of right, than in any
		other person present. The supposition did not pain her. She liked him too little to care for his
		approbation.
	</p>

	<p>After playing some Italian songs, Miss Bingley varied the charm by a lively Scotch air; and soon
		afterwards Mr. Darcy, drawing near Elizabeth, said to her:
	</p>

	<p>\u201CDo not you feel a great inclination, Miss Bennet, to seize such an opportunity of dancing a
		reel?\u201D
	</p>
	<h3 class="${"pt-16"}">Wedding</h3>
	<div class="${"horizontal-snap svelte-1ca5qmc"}">${each(weddings, (wedding) => `<img${add_attribute("src", wedding, 0)} alt="${"Wedding Arrangement"}" class="${"svelte-1ca5qmc"}">`)}</div>
	<h3 class="${"pt-16"}">Dinner Party</h3>
	<div class="${"horizontal-snap svelte-1ca5qmc"}">${each(dinnerParties, (dinnerParty) => `<img${add_attribute("src", dinnerParty, 0)} alt="${"Table Arrangement"}" class="${"svelte-1ca5qmc"}">`)}</div>
	<h3 class="${"pt-16"}">Table Arrangements</h3>
	<div class="${"horizontal-snap svelte-1ca5qmc"}">${each(tableArrangements, (tableArrangement) => `<img${add_attribute("src", tableArrangement, 0)} alt="${"Table Arrangement"}" class="${"svelte-1ca5qmc"}">`)}</div>
	${validate_component(Lightbox, "Lightbox").$$render($$result, { isVisible: !!selectedImg }, {}, {
    default: () => `<img${add_attribute("src", selectedImg, 0)} class="${"svelte-1ca5qmc"}">`
  })}
</main>`;
});
var flowers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Flowers
});
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>About</h1>

<p>&quot;On the contrary,&quot; said Holmes, &quot;it is the brightest rift which I can at present see in the
	clouds. However innocent he might be, he could not be such an absolute imbecile as not to see that
	the circumstances were very black against him. Had he appeared surprised at his own arrest, or
	feigned indignation at it, I should have looked upon it as highly suspicious, because such
	surprise or anger would not be natural under the circumstances, and yet might appear to be the
	best policy to a scheming man. His frank acceptance of the situation marks him as either an
	innocent man, or else as a man of considerable self-restraint and firmness. As to his remark about
	his deserts, it was also not unnatural if you consider that he stood beside the dead body of his
	father, and that there is no doubt that he had that very day so far forgotten his filial duty as
	to bandy words with him, and even, according to the little girl whose evidence is so important, to
	raise his hand as if to strike him. The self-reproach and contrition which are displayed in his
	remark appear to me to be the signs of a healthy mind rather than of a guilty one.&quot;
</p>

<p>I shook my head. &quot;Many men have been hanged on far slighter evidence,&quot; I remarked.</p>

<p>&quot;So they have. And many men have been wrongfully hanged.&quot;</p>

<p>&quot;What is the young man&#39;s own account of the matter?&quot;</p>

<p>&quot;It is, I am afraid, not very encouraging to his supporters, though there are one or two points in
	it which are suggestive. You will find it here, and may read it for yourself.&quot;
</p>
<p></p>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": About
});
var css = {
  code: ".post.svelte-5dgm73{margin-bottom:4rem}",
  map: `{"version":3,"file":"BlogLayout.svelte","sources":["BlogLayout.svelte"],"sourcesContent":["<script>\\n\\timport { seo } from '$lib/store';\\n\\n\\texport let title;\\n\\texport let description;\\n\\texport let date;\\n\\n\\t$seo = {\\n\\t\\ttitle: title,\\n\\t\\tdescription: description\\n\\t};\\n<\/script>\\n\\n<h1 class=\\"font-bold text-6xl mb-4\\">{title}</h1>\\n<p class=\\"text-gray-400 mb-2\\">{date}</p>\\n<div class=\\"post\\">\\n\\t<slot />\\n</div>\\n\\n<svelte:head>\\n\\t<title>{title}</title>\\n\\t<meta name=\\"description\\" content={description} />\\n</svelte:head>\\n\\n<style>.post{margin-bottom:4rem}</style>\\n"],"names":[],"mappings":"AAwBO,mBAAK,CAAC,cAAc,IAAI,CAAC"}`
};
var BlogLayout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $seo, $$unsubscribe_seo;
  $$unsubscribe_seo = subscribe(seo, (value) => $seo = value);
  let { title } = $$props;
  let { description } = $$props;
  let { date } = $$props;
  set_store_value(seo, $seo = { title, description }, $seo);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0)
    $$bindings.description(description);
  if ($$props.date === void 0 && $$bindings.date && date !== void 0)
    $$bindings.date(date);
  $$result.css.add(css);
  $$unsubscribe_seo();
  return `<h1 class="${"font-bold text-6xl mb-4"}">${escape2(title)}</h1>
<p class="${"text-gray-400 mb-2"}">${escape2(date)}</p>
<div class="${"post svelte-5dgm73"}">${slots.default ? slots.default({}) : ``}</div>

${$$result.head += `${$$result.title = `<title>${escape2(title)}</title>`, ""}<meta name="${"description"}"${add_attribute("content", description, 0)} data-svelte="svelte-1lvwc9d">`, ""}`;
});
var metadata$2 = {
  "layout": "blog",
  "title": "Second post",
  "slug": "secondpost",
  "description": "They don\u2019t eat up people\u2019s gardens, don\u2019t nest in corn cribs, they don\u2019t do one thing but sing their hearts out for us. That\u2019s why it\u2019s a sin to kill a mockingbird.",
  "tags": [
    {
      "name": "Svelte Kit",
      "link": "https://kit.svelte.dev/"
    },
    {
      "name": "Tailwind",
      "link": "https://www.tailwindcss.com"
    },
    {
      "name": "Markdown",
      "link": "https://www.markdownguide.org/"
    }
  ],
  "date": "10th April 2021"
};
var Secondpost = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(BlogLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata$2), {}, {
    default: () => `<p>Atticus said to Jem one day, \u201CI\u2019d rather you shot at tin cans in the backyard, but I know you\u2019ll go after birds. Shoot all the blue jays you want, if you can hit \u2018em, but remember it\u2019s a sin to kill a mockingbird.\u201D That was the only time I ever heard Atticus say it was a sin to do something, and I asked Miss Maudie about it. \u201CYour father\u2019s right,\u201D she said. \u201CMockingbirds don\u2019t do one thing except make music for us to enjoy. They don\u2019t eat up people\u2019s gardens, don\u2019t nest in corn cribs, they don\u2019t do one thing but sing their hearts out for us. That\u2019s why it\u2019s a sin to kill a mockingbird.</p>
<p>I took a deep breath and listened to the old brag of my heart. I am, I am, I am.</p>
<p>We believe that we can change the things around us in accordance with our desires\u2014we believe it because otherwise we can see no favourable outcome. We do not think of the outcome which generally comes to pass and is also favourable: we do not succeed in changing things in accordance with our desires, but gradually our desires change. The situation that we hoped to change because it was intolerable becomes unimportant to us. We have failed to surmount the obstacle, as we were absolutely determined to do, but life has taken us round it, led us beyond it, and then if we turn round to gaze into the distance of the past, we can barely see it, so imperceptible has it become.</p>
<p>The most beautiful things in the world cannot be seen or touched, they are felt with the heart.</p>
<p>Hello babies. Welcome to Earth. It\u2019s hot in the summer and cold in the winter. It\u2019s round and wet and crowded. On the outside, babies, you\u2019ve got a hundred years here. There\u2019s only one rule that I know of, babies-\u201CGod damn it, you\u2019ve got to be kind.</p>
<p>Truly it was a great journey, and in it I met with many, whom to know was to love; but whom never could I see again; for life has not space enough; and each must do his duty to the security and well-being of the Redoubt. Yet, for all that I have set down, we travelled much, always; but there were so many millions, and so few years.</p>`
  })}`;
});
var secondpost = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Secondpost,
  metadata: metadata$2
});
var metadata$1 = {
  "layout": "blog",
  "title": "Third post",
  "slug": "firstpost",
  "description": "Welcome to Earth. It\u2019s hot in the summer and cold in the winter. It\u2019s round and wet and crowded. On the outside, babies, you\u2019ve got a hundred years here.",
  "tags": [
    {
      "name": "Svelte Kit",
      "link": "https://kit.svelte.dev/"
    },
    {
      "name": "Tailwind",
      "link": "https://www.tailwindcss.com"
    },
    {
      "name": "Markdown",
      "link": "https://www.markdownguide.org/"
    }
  ],
  "date": "1st May 2021"
};
var Third_post = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(BlogLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata$1), {}, {
    default: () => `<p>Truly it was a great journey, and in it I met with many, whom to know was to love; but whom never could I see again; for life has not space enough; and each must do his duty to the security and well-being of the Redoubt. Yet, for all that I have set down, we travelled much, always; but there were so many millions, and so few years.</p>
<p>Atticus said to Jem one day, \u201CI\u2019d rather you shot at tin cans in the backyard, but I know you\u2019ll go after birds. Shoot all the blue jays you want, if you can hit \u2018em, but remember it\u2019s a sin to kill a mockingbird.\u201D That was the only time I ever heard Atticus say it was a sin to do something, and I asked Miss Maudie about it. \u201CYour father\u2019s right,\u201D she said. \u201CMockingbirds don\u2019t do one thing except make music for us to enjoy. They don\u2019t eat up people\u2019s gardens, don\u2019t nest in corn cribs, they don\u2019t do one thing but sing their hearts out for us. That\u2019s why it\u2019s a sin to kill a mockingbird.</p>
<p>I took a deep breath and listened to the old brag of my heart. I am, I am, I am.</p>
<p>We believe that we can change the things around us in accordance with our desires\u2014we believe it because otherwise we can see no favourable outcome. We do not think of the outcome which generally comes to pass and is also favourable: we do not succeed in changing things in accordance with our desires, but gradually our desires change. The situation that we hoped to change because it was intolerable becomes unimportant to us. We have failed to surmount the obstacle, as we were absolutely determined to do, but life has taken us round it, led us beyond it, and then if we turn round to gaze into the distance of the past, we can barely see it, so imperceptible has it become.</p>
<p>The most beautiful things in the world cannot be seen or touched, they are felt with the heart.</p>
<p>Hello babies. Welcome to Earth. It\u2019s hot in the summer and cold in the winter. It\u2019s round and wet and crowded. On the outside, babies, you\u2019ve got a hundred years here. There\u2019s only one rule that I know of, babies-\u201CGod damn it, you\u2019ve got to be kind.</p>`
  })}`;
});
var thirdPost = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Third_post,
  metadata: metadata$1
});
var Counter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let count = 42;
  return `<button class="${"bg-green-500 hover:bg-green-600 rounded px-4 py-1 my-4 text-white"}">Count: ${escape2(count)}</button>`;
});
var metadata = {
  "layout": "blog",
  "title": "First post",
  "slug": "firstpost",
  "description": "Truly it was a great journey, and in it I met with many, whom to know was to love; but whom never could I see again; for life has not space enough; and each must do his duty to the security and well-being of the Redoubt.",
  "tags": [
    {
      "name": "Svelte Kit",
      "link": "https://kit.svelte.dev/"
    },
    {
      "name": "Tailwind",
      "link": "https://www.tailwindcss.com"
    },
    {
      "name": "Markdown",
      "link": "https://www.markdownguide.org/"
    }
  ],
  "date": "3rd April 2021"
};
var Firstpost = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(BlogLayout, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign($$props, metadata), {}, {
    default: () => `<p>Truly it was a great journey, and in it I met with many, whom to know was to love; but whom never could I see again; for life has not space enough; and each must do his duty to the security and well-being of the Redoubt. Yet, for all that I have set down, we travelled much, always; but there were so many millions, and so few years.</p>
<h3 id="${"a-sample-svelte-component"}"><a href="${"#a-sample-svelte-component"}">A sample svelte component</a></h3>
${validate_component(Counter, "Counter").$$render($$result, {}, {}, {})}
<p>Atticus said to Jem one day, \u201CI\u2019d rather you shot at tin cans in the backyard, but I know you\u2019ll go after birds. Shoot all the blue jays you want, if you can hit \u2018em, but remember it\u2019s a sin to kill a mockingbird.\u201D That was the only time I ever heard Atticus say it was a sin to do something, and I asked Miss Maudie about it. \u201CYour father\u2019s right,\u201D she said. \u201CMockingbirds don\u2019t do one thing except make music for us to enjoy. They don\u2019t eat up people\u2019s gardens, don\u2019t nest in corn cribs, they don\u2019t do one thing but sing their hearts out for us. That\u2019s why it\u2019s a sin to kill a mockingbird.</p>
<p>I took a deep breath and listened to the old brag of my heart. I am, I am, I am.</p>
<p>We believe that we can change the things around us in accordance with our desires\u2014we believe it because otherwise we can see no favourable outcome. We do not think of the outcome which generally comes to pass and is also favourable: we do not succeed in changing things in accordance with our desires, but gradually our desires change. The situation that we hoped to change because it was intolerable becomes unimportant to us. We have failed to surmount the obstacle, as we were absolutely determined to do, but life has taken us round it, led us beyond it, and then if we turn round to gaze into the distance of the past, we can barely see it, so imperceptible has it become.</p>
<p>The most beautiful things in the world cannot be seen or touched, they are felt with the heart.</p>
<p>Hello babies. Welcome to Earth. It\u2019s hot in the summer and cold in the winter. It\u2019s round and wet and crowded. On the outside, babies, you\u2019ve got a hundred years here. There\u2019s only one rule that I know of, babies-\u201CGod damn it, you\u2019ve got to be kind.</p>`
  })}`;
});
var firstpost = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Firstpost,
  metadata
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
