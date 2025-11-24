import * as fal from '@fal-ai/serverless-client'
import { FAL_PROXY_ENDPOINT } from './constants'

// Initialize the Fal client with the proxy configuration
export function initFalClient() {
	fal.config({
		requestMiddleware: fal.withProxy({
			targetUrl: FAL_PROXY_ENDPOINT,
		}),
	})
}

export type LiveImageRequest = {
	prompt: string
	image_url: string
	sync_mode: boolean
	strength: number
	seed: number
	enable_safety_checks: boolean
}

export type LiveImageResult = {
	url: string
}
