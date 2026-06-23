const defaultPort = 4000
const maxBodySizeBytes = 1024 * 1024

function setCorsHeaders(response) {
	response.setHeader('Access-Control-Allow-Origin', '*')
	response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
	response.setHeader(
		'Access-Control-Allow-Headers',
		'Authorization,Content-Type',
	)
}

function getRequestOrigin(request) {
	const host = request.headers.host ?? `localhost:${defaultPort}`
	const forwardedProto = request.headers['x-forwarded-proto']
	const protocol = typeof forwardedProto === 'string' && forwardedProto.length > 0
		? forwardedProto.split(',')[0]
		: 'http'
	return `${protocol}://${host}`
}

async function readJsonBody(request) {
	const chunks = []
	let bodySize = 0

	for await (const chunk of request) {
		bodySize += chunk.length

		if (bodySize > maxBodySizeBytes) {
			throw new Error('Request body is too large')
		}

		chunks.push(chunk)
	}

	if (chunks.length === 0) {
		return {}
	}

	return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sendJson(response, statusCode, payload) {
	response.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
	})
	response.end(JSON.stringify(payload, null, 2))
}

export {
	setCorsHeaders,
	getRequestOrigin,
	readJsonBody,
	sendJson,
}
