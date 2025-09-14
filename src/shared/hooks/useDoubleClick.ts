import { useCallback, useRef } from 'react'

interface UseDoubleClickOptions {
    onSingleClick?: () => void
    onDoubleClick?: () => void
    delay?: number
}

export function useDoubleClick({
    onSingleClick,
    onDoubleClick,
    delay = 300
}: UseDoubleClickOptions) {
    const clickCount = useRef(0)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

    const handleClick = useCallback(() => {
        clickCount.current += 1

        if (clickCount.current === 1) {
            timeoutRef.current = setTimeout(() => {
                if (clickCount.current === 1 && onSingleClick) {
                    onSingleClick()
                }
                clickCount.current = 0
            }, delay)
        } else if (clickCount.current === 2) {
            clearTimeout(timeoutRef.current)
            if (onDoubleClick) {
                onDoubleClick()
            }
            clickCount.current = 0
        }
    }, [onSingleClick, onDoubleClick, delay])

    return handleClick
}