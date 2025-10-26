import { LiveImageShape } from '@/components/LiveImageShapeUtil'
import { fastGetSvgAsImage } from '@/utils/screenshot'
import * as fal from '@fal-ai/serverless-client'
import {
	AssetRecordType,
	Editor,
	FileHelpers,
	TLShape,
	TLShapeId,
	getHashForObject,
	useEditor,
} from '@tldraw/tldraw'
import { createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

type AnimateResult = { url: string }
type AnimateRequest = {
	prompt: string
	image_url: string
	sync_mode: boolean
	duration: number
	enable_safety_checks: boolean
}
type AnimateContextType = null | ((req: AnimateRequest) => Promise<AnimateResult>)
const AnimateContext = createContext<AnimateContextType>(null)

export function AnimateProvider({
	children,
	appId,
	throttleTime = 0,
	timeoutTime = 5000,
}: {
	children: React.ReactNode
	appId: string
	throttleTime?: number
	timeoutTime?: number
}) {
	const [count, setCount] = useState(0)
	const [fetchImage, setFetchImage] = useState<{ current: AnimateContextType }>({ current: null })

	useEffect(() => {
		const requestsById = new Map<
			string,
			{
				resolve: (result: AnimateResult) => void
				reject: (err: unknown) => void
				timer: ReturnType<typeof setTimeout>
			}
		>()

		const { send, close } = fal.realtime.connect(appId, {
			connectionKey: 'fal-realtime-example',
			clientOnly: false,
			throttleInterval: throttleTime,
			onError: (error) => {
				console.error(error)
				// force re-connect
				setTimeout(() => {
					setCount((count) => count + 1)
				}, 500)
			},
			onResult: (result) => {
				if (result.video) {
					const id = result.request_id
					const request = requestsById.get(id)
					if (request) {
						request.resolve(result.video)
					}
				}
			},
		})

		setFetchImage({
			current: (req) => {
				return new Promise((resolve, reject) => {
					const id = uuid()
					const timer = setTimeout(() => {
						requestsById.delete(id)
						reject(new Error('Timeout'))
					}, timeoutTime)
					requestsById.set(id, {
						resolve: (res) => {
							resolve(res)
							clearTimeout(timer)
						},
						reject: (err) => {
							reject(err)
							clearTimeout(timer)
						},
						timer,
					})
					send({ ...req, request_id: id })
				})
			},
		})

		return () => {
			for (const request of requestsById.values()) {
				request.reject(new Error('Connection closed'))
			}
			try {
				close()
			} catch (e) {
				// noop
			}
		}
	}, [appId, count, throttleTime, timeoutTime])

	return <AnimateContext.Provider value={fetchImage.current}>{children}</AnimateContext.Provider>
}

export function useAnimate(
	shapeId: TLShapeId,
	{ throttleTime = 64 }: { throttleTime?: number } = {}
) {
	const editor = useEditor()
	const fetchImage = useContext(AnimateContext)
	if (!fetchImage) throw new Error('Missing AnimateProvider')

	useEffect(() => {
		let prevHash = ''
		let prevPrompt = ''

		let startedIteration = 0
		let finishedIteration = 0

		async function updateDrawing() {
			const shapes = getShapesTouching(shapeId, editor)
			const frame = editor.getShape<LiveImageShape>(shapeId)!

			const hash = getHashForObject([...shapes])
			const frameName = frame.props.name
			if (hash === prevHash && frameName === prevPrompt) return

			startedIteration += 1
			const iteration = startedIteration

			prevHash = hash
			prevPrompt = frame.props.name

			try {
				const svgStringResult = await editor.getSvgString([...shapes], {
					background: true,
					padding: 0,
					darkMode: editor.user.getIsDarkMode(),
					bounds: editor.getShapePageBounds(shapeId)!,
					scale: 512 / frame.props.w,
				})

				if (!svgStringResult) {
					console.warn('No SVG')
					updateImage(editor, frame.id, null)
					return
				}

				const svgString = svgStringResult.svg

				// cancel if stale:
				if (iteration <= finishedIteration) return

				const blob = await fastGetSvgAsImage(svgString, {
					type: 'jpeg',
					quality: 0.5,
					width: svgStringResult.width,
					height: svgStringResult.height,
				})

				if (iteration <= finishedIteration) return

				if (!blob) {
					console.warn('No Blob')
					updateImage(editor, frame.id, null)
					return
				}

				const imageUrl = await FileHelpers.blobToDataUrl(blob)

				// cancel if stale:
				if (iteration <= finishedIteration) return

				const prompt = frameName
					? frameName + ' hd award-winning impressive'
					: 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'

				const result = await fetchImage!({
					prompt,
					image_url: imageUrl,
					sync_mode: true,
					duration: 5,
					enable_safety_checks: false,
				})

				// cancel if stale:
				if (iteration <= finishedIteration) return

				finishedIteration = iteration
				updateImage(editor, frame.id, result.url)
			} catch (e) {
				const isTimeout = e instanceof Error && e.message === 'Timeout'
				if (!isTimeout) {
					console.error(e)
				}

				// retry if this was the most recent request:
				if (iteration === startedIteration) {
					requestUpdate()
				}
			}
		}

		let timer: ReturnType<typeof setTimeout> | null = null
		function requestUpdate() {
			if (timer !== null) return
			timer = setTimeout(() => {
				timer = null
				updateDrawing()
			}, throttleTime)
		}

		editor.on('update-drawings' as any, requestUpdate)
		return () => {
			editor.off('update-drawings' as any, requestUpdate)
		}
	}, [editor, fetchImage, shapeId, throttleTime])
}

function updateImage(editor: Editor, shapeId: TLShapeId, url: string | null) {
	const shape = editor.getShape<LiveImageShape>(shapeId)
	if (!shape) {
		return
	}
	const id = AssetRecordType.createId(shape.id.split(':')[1])

	const asset = editor.getAsset(id)

	if (!asset) {
		editor.createAssets([
			AssetRecordType.create({
				id,
				type: 'video',
				props: {
					name: shape.props.name,
					w: shape.props.w,
					h: shape.props.h,
					src: url,
					isAnimated: true,
					mimeType: 'video/mp4',
				},
			}),
		])
	} else {
		editor.updateAssets([
			{
				...asset,
				type: 'video',
				props: {
					...asset.props,
					w: shape.props.w,
					h: shape.props.h,
					src: url,
				},
			},
		])
	}
}

function getShapesTouching(shapeId: TLShapeId, editor: Editor) {
	const shapeIdsOnPage = editor.getCurrentPageShapeIds()
	const shapesTouching: TLShape[] = []
	const targetBounds = editor.getShapePageBounds(shapeId)
	if (!targetBounds) return shapesTouching
	for (const id of [...shapeIdsOnPage]) {
		if (id === shapeId) continue
		const bounds = editor.getShapePageBounds(id)!
		if (bounds.collides(targetBounds)) {
			shapesTouching.push(editor.getShape(id)!)
		}
	}
	return shapesTouching
}
