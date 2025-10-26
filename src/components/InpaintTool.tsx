import { StateNode, TLEventHandlers } from '@tldraw/tldraw'
import { InpaintMask } from './InpaintMask'

class Idle extends StateNode {
	static override id = 'idle'

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		this.parent.transition('pointing', info)
	}
}

class Pointing extends StateNode {
	static override id = 'pointing'

	override onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
		if (this.editor.inputs.isDragging) {
			this.parent.transition('brushing', info)
		}
	}

	override onPointerUp: TLEventHandlers['onPointerUp'] = (info) => {
		this.parent.transition('idle', info)
	}

	override onCancel: TLEventHandlers['onCancel'] = (info) => {
		this.parent.transition('idle', info)
	}
}

class Brushing extends StateNode {
	static override id = 'brushing'

	override onEnter = () => {
		this.parent.points = []
	}

	override onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
		this.parent.points.push(this.editor.inputs.currentPagePoint)
	}

	override onPointerUp: TLEventHandlers['onPointerUp'] = (info) => {
		this.parent.transition('idle', info)
	}

	override onCancel: TLEventHandlers['onCancel'] = (info) => {
		this.parent.transition('idle', info)
	}
}

export class InpaintTool extends StateNode {
	static override id = 'inpaint'
	static override initial = 'idle'
	static override children = () => [Idle, Pointing, Brushing]

	points: { x: number; y: number }[] = []
	mask_image_url: string | null = null

	override onEnter = () => {
		// todo
	}

	getMask = (canvas: HTMLCanvasElement | null) => {
		if (!canvas) return
		this.mask_image_url = canvas.toDataURL('image/png')
	}

	component = () => {
		const { width, height } = this.editor.getViewportScreenBounds()
		return (
			<InpaintMask
				points={this.points}
				width={width}
				height={height}
				getMask={this.getMask}
			/>
		)
	}
}
