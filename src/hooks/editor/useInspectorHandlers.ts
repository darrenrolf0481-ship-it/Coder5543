import React from 'react';

export function useInspectorHandlers(
  isInspectorActive: boolean,
  setIsInspectorActive: any,
  setInspectedElement: any,
  inspectedElementRef: React.MutableRefObject<HTMLElement | null>,
  previewContainerRef: React.MutableRefObject<HTMLDivElement | null>,
  setEditorContent: any
) {
  const handleInspectMouseMove = (e: React.MouseEvent) => {
    if (!isInspectorActive || !previewContainerRef.current) return;

    const container = previewContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;

    if (element && container.contains(element) && element !== container) {
      inspectedElementRef.current = element;
      const elRect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);

      setInspectedElement({
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        id: element.id,
        rect: {
          top: elRect.top - containerRect.top,
          left: elRect.left - containerRect.left,
          width: elRect.width,
          height: elRect.height,
        },
        styles: {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          padding: styles.padding,
          margin: styles.margin,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          display: styles.display,
          position: styles.position,
          zIndex: styles.zIndex,
        },
      });
    } else {
      setInspectedElement(null);
    }
  };

  const handleInspectClick = (e: React.MouseEvent) => {
    if (!isInspectorActive) return;
    e.preventDefault();
    e.stopPropagation();

    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (element && previewContainerRef.current?.contains(element)) {
      previewContainerRef.current.querySelectorAll('[data-neural-inspect]').forEach((el) => {
        el.removeAttribute('data-neural-inspect');
      });
      element.setAttribute('data-neural-inspect', 'true');
      inspectedElementRef.current = element;
    }

    setIsInspectorActive(false);
  };

  const handleStyleChange = (property: string, value: string) => {
    if (!inspectedElementRef.current || !previewContainerRef.current) return;

    const element = inspectedElementRef.current;
    (element.style as any)[property] = value;

    setInspectedElement((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        styles: {
          ...prev.styles,
          [property]: value,
        },
      };
    });

    const contentWrapper = previewContainerRef.current.querySelector('.bg-black\\/40');
    if (contentWrapper) {
      const newContent = contentWrapper.innerHTML;
      setEditorContent(newContent);

      setTimeout(() => {
        const reFoundElement = previewContainerRef.current?.querySelector(
          '[data-neural-inspect]'
        ) as HTMLElement;
        if (reFoundElement) {
          inspectedElementRef.current = reFoundElement;
        }
      }, 0);
    }
  };

  return {
    handleInspectMouseMove,
    handleInspectClick,
    handleStyleChange
  };
}
