const defaultPort = 4000
const maxBodySizeBytes = 1024 * 1024

export function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization,Content-Type"
  )
}

export function getRequestOrigin(request) {
  const host = request.headers.host ?? `localhost:${defaultPort}`
  return `http://${host}`
}

export async function readJsonBody(request) {
  const chunks = []
  let bodySize = 0

  for await (const chunk of request) {
    bodySize += chunk.length

    if (bodySize > maxBodySizeBytes) {
      throw new Error("Request body is too large")
    }

    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  })
  response.end(JSON.stringify(payload, null, 2))
}
