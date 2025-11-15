'use client'

import { LiveImageProvider } from '@/hooks/useLiveImage'
import { EditorComponent } from './Editor'

export function ClientOnlyEditor() {
	return (
		<LiveImageProvider appId="110602490-lcm-sd15-i2i">
			<EditorComponent />
		</LiveImageProvider>
	)
}
