import { useEffect } from 'react';

/**
 * Lắng nghe sự kiện phím Enter để tự động chuyển focus sang ô nhập liệu tiếp theo,
 * giúp nhập liệu liên tục và nhanh chóng hơn.
 */
export function useEnterToNextField(containerRef?: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Chỉ bắt phím Enter và không đi kèm Shift (Shift+Enter để xuống dòng trong textarea)
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement as HTMLElement;
                
                // Bỏ qua nếu đang focus vào textarea (cho phép Enter để xuống dòng)
                if (activeElement && activeElement.tagName === 'TEXTAREA') {
                    return;
                }
                
                // Bỏ qua nếu đang focus vào button (cho phép Enter để nhấn button)
                if (activeElement && activeElement.tagName === 'BUTTON') {
                    return;
                }

                // Nếu đang focus vào input hoặc select
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
                    // Ngăn form tự động submit hoặc các hành vi mặc định khác
                    e.preventDefault();
                    
                    const container = containerRef?.current || document;
                    // Tìm tất cả các element có thể focus
                    // Ưu tiên các ô nhập liệu (input, select, textarea)
                    const focusableElements = Array.from(
                        container.querySelectorAll<HTMLElement>(
                            'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
                        )
                    ).filter(el => {
                        // Loại trừ các element bị ẩn qua CSS hoặc style
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
                    });
                    
                    const currentIndex = focusableElements.indexOf(activeElement);
                    if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                        focusableElements[currentIndex + 1].focus();
                    } else if (currentIndex === focusableElements.length - 1) {
                        // Bỏ focus nếu là ô cuối cùng
                        activeElement.blur();
                    }
                }
            }
        };

        // Dùng capture phase để chặn sự kiện trước khi nó sủi bọt (bubble) đến các component khác
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [containerRef]);
}
