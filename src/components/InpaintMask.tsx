import { FC, useRef, useEffect } from 'react'

export const InpaintMask: FC<{
	points: { x: number; y: number }[]
	width: number
	height: number
	getMask: (canvas: HTMLCanvasElement | null) => void
}> = ({ points, width, height, getMask }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		getMask(canvasRef.current)
	}, [getMask])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		ctx.clearRect(0, 0, width, height)
		ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
		ctx.fillRect(0, 0, width, height)

		ctx.globalCompositeOperation = 'destination-out'
		ctx.strokeStyle = 'white'
		ctx.lineWidth = 20
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		ctx.beginPath()
		for (let i = 0; i < points.length - 1; i++) {
			ctx.moveTo(points[i].x, points[i].y)
			ctx.lineTo(points[i + 1].x, points[i + 1].y)
		}
		ctx.stroke()
	}, [points, width, height])

	return <canvas ref={canvasRef} width={width} height={height} />
}
