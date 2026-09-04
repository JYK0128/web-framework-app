import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';
import { useI18n } from '#/hooks';

type FormSignatureProps = FormProps<'canvas'> & {
  width?: number
  height?: number
  clearLabel?: string
};

export function FormSignature({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  width = 600,
  height = 240,
  clearLabel,
  ...props
}: FormSignatureProps) {
  const { t } = useI18n();
  const displayClearLabel = clearLabel ?? t('core.form.clearSignature');
  const field = useFieldContext<string | undefined>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = getComputedStyle(canvas).color;
  }, [height, width]);

  useEffect(() => {
    if (isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, width, height);
    if (!field.state.value) return;
    const image = new Image();
    image.onload = () => {
      if (!isDrawingRef.current) context.drawImage(image, 0, 0, width, height);
    };
    image.src = field.state.value;
  }, [field.state.value, height, width]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * width,
      y: ((event.clientY - bounds.top) / bounds.height) * height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const point = getPoint(event);
    if (!context || !canvas || !point) return;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingRef.current = true;
    setIsDrawing(true);
    props.onPointerDown?.(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext('2d');
    const point = getPoint(event);
    if (!context || !point) return;
    context.lineTo(point.x, point.y);
    context.stroke();
    field.handleChange(canvasRef.current?.toDataURL('image/png'));
    props.onPointerMove?.(event);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    setIsDrawing(false);
    field.handleBlur();
    props.onPointerUp?.(event);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, width, height);
    field.handleChange(undefined);
    field.handleBlur();
  };

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <div className="space-y-2">
        <canvas
          {...props}
          ref={canvasRef}
          id={field.name}
          width={width}
          height={height}
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          className="
            h-auto w-full touch-none rounded-md border bg-background
            text-foreground
          "
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          <RotateCcw />
          {displayClearLabel}
        </Button>
      </div>
    </FormField>
  );
}
