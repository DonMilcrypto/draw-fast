import { LiveImageShape, LiveImageShapeUtil } from '@/components/LiveImageShapeUtil'
import { LiveImageTool } from '@/components/LiveImageTool'
import { DefaultSizeStyle, Editor, TLUiOverrides } from 'tldraw'

export const overrides: TLUiOverrides = {
	tools(editor, tools) {
		tools.liveImage = {
			id: 'live-image',
			icon: 'tool-frame',
			label: 'Frame',
			kbd: 'f',
			readonlyOk: false,
			onSelect: () => {
				editor.setCurrentTool('live-image')
			},
		}
		return tools
	},
}

export const shapeUtils = [LiveImageShapeUtil]
export const tools = [LiveImageTool]

export const onEditorMount = (editor: Editor) => {
	// We need the editor to think that the live image shape is a frame
	// @ts-expect-error: patch
	editor.isShapeOfType = function (arg, type) {
		const shape = typeof arg === 'string' ? this.getShape(arg)! : arg
		if (shape.type === 'live-image' && type === 'frame') {
			return true
		}
		return shape.type === type
	}

	// If there isn't a live image shape, create one
	if (!editor.getCurrentPageShapes().some((shape) => shape.type === 'live-image')) {
		editor.createShape<LiveImageShape>({
			type: 'live-image',
			x: 120,
			y: 180,
			props: {
				w: 512,
				h: 512,
				name: '',
			},
		})
	}

	editor.setStyleForNextShapes(DefaultSizeStyle, 'xl')
}
