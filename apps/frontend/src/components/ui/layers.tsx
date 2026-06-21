'use client'

import * as React from 'react'

type OverlayLayer = 'drawer' | 'popover' | 'popup' | 'tooltip'

const OVERLAY_ROOT_ID = 'liftbook-overlay-root'
const OVERLAY_LAYER_ORDER: OverlayLayer[] = [
	'drawer',
	'popover',
	'popup',
	'tooltip',
]

function ensureOverlayRoot() {
	let root = document.getElementById(OVERLAY_ROOT_ID)

	if (!root) {
		root = document.createElement('div')
		root.id = OVERLAY_ROOT_ID
		root.className = 'pointer-events-none fixed inset-0 z-[100] isolate'
		document.body.appendChild(root)
	}

	for (const layer of OVERLAY_LAYER_ORDER) {
		let layerNode = root.querySelector<HTMLElement>(`[data-overlay-layer="${layer}"]`)

		if (!layerNode) {
			layerNode = document.createElement('div')
			layerNode.dataset.overlayLayer = layer
			layerNode.className = 'pointer-events-none absolute inset-0'
			root.appendChild(layerNode)
		}
	}

	return root
}

function getOverlayLayerContainer(layer: OverlayLayer) {
	const root = ensureOverlayRoot()
	return root.querySelector<HTMLElement>(`[data-overlay-layer="${layer}"]`)
}

function useOverlayLayerContainer(layer: OverlayLayer) {
	return React.useSyncExternalStore(
		() => () => {},
		() =>
			typeof document === 'undefined'
				? null
				: getOverlayLayerContainer(layer) ?? null,
		() => null,
	)
}

export type {
	OverlayLayer,
}

export {
	useOverlayLayerContainer,
}
