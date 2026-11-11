"use client";

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ClipboardText,
  Copy,
  DownloadSimple,
  Eraser,
  Eyedropper,
  FlipHorizontal,
  Ghost,
  GridFour,
  PaintBucket,
  Pencil,
  Trash,
  type Icon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "@/hooks/use-motion-allowed";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { skinImageURL } from "@/lib/skin-images";
import { TILE } from "@/lib/oneko/constants";
import { isSavedSprite } from "@/lib/oneko/custom-assets";
import { ONEKO_SKINS, type OnekoSkin } from "@/lib/oneko/skins";
import {
  colorToHex,
  countBlankFrames,
  decodeSheet,
  encodeSheet,
  fillArea,
  flipPixels,
  getPixel,
  hexToColor,
  packColor,
  readFrame,
  replaceColor,
  setPixel,
  sheetColors,
  SPRITE_ANIMATIONS,
  writeFrame,
  type Color,
  type Frame,
} from "@/lib/oneko/sprite-sheet";

type Tool = "pencil" | "eraser" | "fill" | "picker";

const TOOLS: { id: Tool; label: string; shortcut: string; icon: Icon }[] = [
  { id: "pencil", label: "Pencil", shortcut: "B", icon: Pencil },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
  { id: "fill", label: "Fill", shortcut: "G", icon: PaintBucket },
  { id: "picker", label: "Pick color", shortcut: "I", icon: Eyedropper },
];
const MAX_HISTORY = 60;
const MAX_SWATCHES = 24;
const PREVIEW_INTERVAL_MS = 220;
const RECOLOR_SETTLE_MS = 300;
const COAT_NAME = "Hand-drawn coat";
/** Before recent drawings were kept, the studio saved a single one under this key. */
const DRAWING_STORAGE_KEY = "oneko:studio:drawing";
const DRAWINGS_STORAGE_KEY = "oneko:studio:drawings";
const MAX_DRAWINGS = 3;
const DRAWING_LABELS = [
  "Bring back your drawing",
  "Bring back the one before",
  "Bring back the oldest one",
];

function readDrawings(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DRAWINGS_STORAGE_KEY) ?? "[]");
    const drawings = Array.isArray(saved) ? saved.filter(isSavedSprite) : [];
    const legacy = localStorage.getItem(DRAWING_STORAGE_KEY);
    if (isSavedSprite(legacy) && !drawings.includes(legacy)) drawings.push(legacy);
    return drawings.slice(0, MAX_DRAWINGS);
  } catch {
    return [];
  }
}

/** Put a drawing first, in place of the one it was edited from, and keep the most recent few. */
function saveDrawing(drawing: string, editedFrom: string | null): string[] {
  const others = readDrawings().filter((saved) => saved !== drawing && saved !== editedFrom);
  const drawings = [drawing, ...others].slice(0, MAX_DRAWINGS);
  try {
    localStorage.setItem(DRAWINGS_STORAGE_KEY, JSON.stringify(drawings));
    localStorage.removeItem(DRAWING_STORAGE_KEY);
  } catch {
    /* Storage can be unavailable or full; the coat still applies to this visit. */
  }
  return drawings;
}

function SpriteFrame({ source, frame, size }: { source: string; frame: Frame; size: number }) {
  return (
    <span
      className="sprite-frame"
      aria-hidden="true"
      style={
        {
          "--sprite-size": `${size}px`,
          "--sprite-column": frame.column,
          "--sprite-row": frame.row,
          backgroundImage: `url("${source}")`,
        } as CSSProperties
      }
    />
  );
}

function AnimationPreview({ source, frames }: { source: string; frames: Frame[] }) {
  const reducedMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reducedMotion || frames.length < 2) return;
    const timer = setInterval(() => setTick((value) => value + 1), PREVIEW_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [frames.length, reducedMotion]);
  return (
    <div className="sprite-preview">
      <SpriteFrame source={source} frame={frames[tick % frames.length]} size={96} />
    </div>
  );
}

function ToggleButton({
  label,
  icon: IconComponent,
  pressed,
  onClick,
  shortcut,
}: {
  label: string;
  icon: Icon;
  pressed: boolean;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
    >
      <IconComponent size={18} aria-hidden="true" />
    </button>
  );
}

export function SpriteEditor() {
  const { state, actions } = useOnekoPlayground();
  const source = state.spriteSrc || skinImageURL(state.skin);

  const sheetRef = useRef<Uint8ClampedArray | null>(null);
  const undoStack = useRef<Uint8ClampedArray[]>([]);
  const redoStack = useRef<Uint8ClampedArray[]>([]);
  /** The sheet this editor last published, which doesn't need decoding again. */
  const published = useRef("");
  const saveRequest = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onionRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const strokeRef = useRef<{
    before: Uint8ClampedArray;
    x: number;
    y: number;
  } | null>(null);
  const cursorCell = useRef({ x: 16, y: 16 });
  const copiedFrame = useRef<Uint8ClampedArray | null>(null);
  const recolor = useRef<{ before: Uint8ClampedArray; from: Color } | null>(null);
  const recolorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The swatches catch up only when a recolor settles, so keep its picker live until then.
  const [recoloring, setRecoloring] = useState(false);
  const [cellAnnouncement, setCellAnnouncement] = useState("");

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState<Color>(packColor(92, 64, 51));
  const [animationId, setAnimationId] = useState<string>("idle");
  const [frameIndex, setFrameIndex] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [onion, setOnion] = useState(false);
  const [grid, setGrid] = useState(true);
  const [swatches, setSwatches] = useState<Color[]>([]);
  const [blankFrames, setBlankFrames] = useState(0);
  const [hasCopy, setHasCopy] = useState(false);
  const [history, setHistory] = useState({ undo: false, redo: false });
  const [drawings, setDrawings] = useState<string[]>([]);
  // The saved drawing this sheet started from, so edits update it instead of crowding it out.
  const editedFrom = useRef<string | null>(null);

  const animation =
    SPRITE_ANIMATIONS.find((candidate) => candidate.id === animationId) ?? SPRITE_ANIMATIONS[0];
  const frame = animation.frames[Math.min(frameIndex, animation.frames.length - 1)];
  const onionFrame =
    onion && animation.frames.length > 1
      ? animation.frames[(frameIndex + animation.frames.length - 1) % animation.frames.length]
      : null;

  const redraw = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const paint = (canvas: HTMLCanvasElement | null, cell: Frame | null) => {
      const context = canvas?.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, TILE, TILE);
      if (cell) context.putImageData(new ImageData(readFrame(sheet, cell), TILE, TILE), 0, 0);
    };
    paint(canvasRef.current, frame);
    paint(onionRef.current, onionFrame);
  }, [frame, onionFrame]);

  const refreshSheetInfo = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    setSwatches(sheetColors(sheet).slice(0, MAX_SWATCHES));
    setBlankFrames(countBlankFrames(sheet));
    setHistory({
      undo: undoStack.current.length > 0,
      redo: redoStack.current.length > 0,
    });
  }, []);

  useEffect(() => {
    setDrawings(readDrawings());
    if (source === published.current) return;
    editedFrom.current = source;
    // The coat changed from outside the editor: pending edits belong to the old sheet.
    clearTimeout(recolorTimer.current);
    recolor.current = null;
    setRecoloring(false);
    saveRequest.current++;
    let current = true;
    setReady(false);
    decodeSheet(source).then(
      (sheet) => {
        if (!current) return;
        sheetRef.current = sheet;
        published.current = source;
        undoStack.current = [];
        redoStack.current = [];
        setColor(sheetColors(sheet)[0] ?? packColor(0, 0, 0));
        setError("");
        setReady(true);
        refreshSheetInfo();
      },
      () => {
        if (!current) return;
        sheetRef.current = null;
        setError(
          "This hosted coat doesn’t allow editing. Choose a coat to start from, or upload the PNG.",
        );
      },
    );
    return () => {
      current = false;
    };
  }, [source, refreshSheetInfo]);

  useEffect(() => {
    if (ready) redraw();
  }, [ready, redraw]);

  useEffect(() => () => clearTimeout(recolorTimer.current), []);

  const publish = useCallback(async () => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    refreshSheetInfo();
    const request = ++saveRequest.current;
    const spriteSrc = await encodeSheet(sheet);
    if (request !== saveRequest.current) return;
    published.current = spriteSrc;
    setDrawings(saveDrawing(spriteSrc, editedFrom.current));
    editedFrom.current = spriteSrc;
    actions.update({ spriteSrc, spriteName: COAT_NAME, hueRotate: 0 });
  }, [actions, refreshSheetInfo]);

  const commit = useCallback(
    (before: Uint8ClampedArray) => {
      undoStack.current.push(before);
      if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
      redoStack.current = [];
      void publish();
    },
    [publish],
  );

  const change = (edit: (sheet: Uint8ClampedArray) => void) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const before = sheet.slice();
    edit(sheet);
    redraw();
    commit(before);
  };

  const stepHistory = (from: typeof undoStack, to: typeof undoStack) => {
    const sheet = sheetRef.current;
    const target = from.current.pop();
    if (!sheet || !target) return;
    to.current.push(sheet.slice());
    sheet.set(target);
    redraw();
    void publish();
  };
  const undo = () => stepHistory(undoStack, redoStack);
  const redo = () => stepHistory(redoStack, undoStack);

  const paintCell = (sheet: Uint8ClampedArray, x: number, y: number) => {
    const ink = tool === "eraser" ? 0 : color;
    setPixel(sheet, frame, x, y, ink);
    if (mirror) setPixel(sheet, frame, TILE - 1 - x, y, ink);
  };

  const beginAt = (x: number, y: number, pick: boolean) => {
    const sheet = sheetRef.current;
    if (!sheet) return null;
    if (tool === "picker" || pick) {
      const picked = getPixel(sheet, frame, x, y);
      if (picked & 255) setColor(picked);
      return null;
    }
    if (tool === "fill") {
      change((target) => {
        fillArea(target, frame, x, y, color);
        if (mirror) fillArea(target, frame, TILE - 1 - x, y, color);
      });
      return null;
    }
    const before = sheet.slice();
    paintCell(sheet, x, y);
    redraw();
    return { before, x, y };
  };

  const moveCursor = (x: number, y: number) => {
    cursorCell.current = { x, y };
    const cursor = cursorRef.current;
    if (cursor) cursor.style.translate = `${x * 100}% ${y * 100}%`;
  };

  const cellFromEvent = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const cell = (position: number) => Math.max(0, Math.min(TILE - 1, Math.floor(position * TILE)));
    return {
      x: cell((event.clientX - bounds.left) / bounds.width),
      y: cell((event.clientY - bounds.top) / bounds.height),
    };
  };

  const endStroke = () => {
    if (strokeRef.current) commit(strokeRef.current.before);
    strokeRef.current = null;
  };

  /** Keyboard users hear where the cursor is and what it sits on; pointer moves stay quiet. */
  const announceCell = (x: number, y: number) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const pixel = getPixel(sheet, frame, x, y);
    setCellAnnouncement(
      `Column ${x + 1}, row ${y + 1}, ${pixel & 255 ? colorToHex(pixel) : "empty"}`,
    );
  };

  const onCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { x, y } = cursorCell.current;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      const next = {
        x: Math.max(0, Math.min(TILE - 1, x + move[0])),
        y: Math.max(0, Math.min(TILE - 1, y + move[1])),
      };
      moveCursor(next.x, next.y);
      announceCell(next.x, next.y);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      const stroke = beginAt(x, y, false);
      if (stroke) commit(stroke.before);
      announceCell(x, y);
    }
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.matches("input, select, textarea")) return;
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const next = TOOLS.find((candidate) => candidate.shortcut.toLowerCase() === key);
    if (next) setTool(next.id);
  };

  const frameOperation = (edit: (pixels: Uint8ClampedArray) => Uint8ClampedArray) =>
    change((sheet) => writeFrame(sheet, frame, edit(readFrame(sheet, frame))));

  const mirrorAnimation = () => {
    const other = SPRITE_ANIMATIONS.find((candidate) => candidate.id === animation.mirror);
    if (!other) return;
    change((sheet) =>
      animation.frames.forEach((cell, index) =>
        writeFrame(sheet, other.frames[index], flipPixels(readFrame(sheet, cell))),
      ),
    );
  };

  const swapColor = (next: Color) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    recolor.current ??= { before: sheet.slice(), from: color };
    const { before, from } = recolor.current;
    sheet.set(before);
    replaceColor(sheet, from, next);
    setColor(next);
    setRecoloring(true);
    redraw();
    clearTimeout(recolorTimer.current);
    recolorTimer.current = setTimeout(() => {
      recolor.current = null;
      setRecoloring(false);
      commit(before);
    }, RECOLOR_SETTLE_MS);
  };

  const startFrom = async (skin: OnekoSkin) => {
    const next = await decodeSheet(skinImageURL(skin));
    if (sheetRef.current) change((sheet) => sheet.set(next));
    else {
      sheetRef.current = next;
      setError("");
      setReady(true);
      void publish();
    }
  };

  const download = async () => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const link = document.createElement("a");
    link.href = await encodeSheet(sheet);
    link.download = "oneko-coat.png";
    link.click();
  };

  const canSwap = recoloring || swatches.includes(color);
  const mirrorName = SPRITE_ANIMATIONS.find((other) => other.id === animation.mirror)?.name;

  return (
    <div className="sprite-editor" onKeyDown={onEditorKeyDown}>
      <div className="sprite-toolbar" role="toolbar" aria-label="Drawing tools">
        <div>
          {TOOLS.map(({ id, label, shortcut, icon }) => (
            <ToggleButton
              key={id}
              label={label}
              icon={icon}
              shortcut={shortcut}
              pressed={tool === id}
              onClick={() => setTool(id)}
            />
          ))}
        </div>
        <div>
          <ToggleButton
            label="Draw on both sides"
            icon={FlipHorizontal}
            pressed={mirror}
            onClick={() => setMirror(!mirror)}
          />
          <ToggleButton
            label="Show the previous frame"
            icon={Ghost}
            pressed={onion}
            onClick={() => setOnion(!onion)}
          />
          <ToggleButton
            label="Show the pixel grid"
            icon={GridFour}
            pressed={grid}
            onClick={() => setGrid(!grid)}
          />
        </div>
        <div>
          <button
            type="button"
            aria-label="Undo"
            title="Undo (⌘Z)"
            disabled={!history.undo}
            onClick={undo}
          >
            <ArrowCounterClockwise size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo (⇧⌘Z)"
            disabled={!history.redo}
            onClick={redo}
          >
            <ArrowClockwise size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <p className="oneko-asset-error" role="alert">
          {error}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {cellAnnouncement}
      </p>
      <div className="sprite-workbench">
        <div
          className="sprite-canvas"
          data-grid={grid || undefined}
          data-tool={tool}
          role="application"
          aria-label={`${animation.name}, frame ${frameIndex + 1}. Arrow keys move, Space draws.`}
          aria-busy={!ready}
          tabIndex={0}
          onKeyDown={onCanvasKeyDown}
          onPointerDown={(event) => {
            // A right click opens the context menu rather than painting.
            if (event.button === 2) return;
            const { x, y } = cellFromEvent(event);
            moveCursor(x, y);
            event.currentTarget.setPointerCapture(event.pointerId);
            strokeRef.current = beginAt(x, y, event.altKey);
          }}
          onPointerMove={(event) => {
            const { x, y } = cellFromEvent(event);
            moveCursor(x, y);
            const stroke = strokeRef.current;
            const sheet = sheetRef.current;
            if (!stroke || !sheet || (stroke.x === x && stroke.y === y)) return;
            const steps = Math.max(Math.abs(x - stroke.x), Math.abs(y - stroke.y));
            for (let step = 1; step <= steps; step++)
              paintCell(
                sheet,
                Math.round(stroke.x + ((x - stroke.x) * step) / steps),
                Math.round(stroke.y + ((y - stroke.y) * step) / steps),
              );
            stroke.x = x;
            stroke.y = y;
            redraw();
          }}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        >
          <canvas ref={onionRef} className="sprite-onion" width={TILE} height={TILE} />
          <canvas ref={canvasRef} width={TILE} height={TILE} />
          <span ref={cursorRef} className="sprite-cursor" aria-hidden="true" />
        </div>

        <div className="sprite-side">
          <AnimationPreview source={source} frames={animation.frames} />
          {animation.frames.length > 1 && (
            <div className="sprite-frames" role="group" aria-label={`${animation.name} frames`}>
              {animation.frames.map((cell, index) => (
                <button
                  key={`${cell.column}-${cell.row}`}
                  type="button"
                  aria-label={`Frame ${index + 1}`}
                  aria-pressed={index === frameIndex}
                  onClick={() => setFrameIndex(index)}
                >
                  <SpriteFrame source={source} frame={cell} size={32} />
                </button>
              ))}
            </div>
          )}
          <label className="sprite-color" htmlFor="sprite-color">
            <input
              id="sprite-color"
              type="color"
              aria-label="Drawing color"
              value={colorToHex(color)}
              onChange={(event) => setColor(hexToColor(event.target.value))}
            />
            <span>{colorToHex(color)}</span>
          </label>
          <div className="sprite-swatches" role="group" aria-label="Colors in this coat">
            {swatches.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={colorToHex(swatch)}
                aria-pressed={swatch === color}
                style={{ backgroundColor: colorToHex(swatch) }}
                onClick={() => setColor(swatch)}
              />
            ))}
          </div>
          <label className="sprite-swap" data-disabled={!canSwap || undefined}>
            <span>Swap this color everywhere</span>
            <input
              type="color"
              aria-label="Swap this color everywhere"
              disabled={!canSwap}
              value={colorToHex(color)}
              onChange={(event) => swapColor(hexToColor(event.target.value))}
            />
          </label>
        </div>
      </div>

      {blankFrames > 0 && (
        <p className="oneko-note" role="status">
          {blankFrames} of 32 frames {blankFrames === 1 ? "is" : "are"} empty. Your cat disappears
          for those moments.
        </p>
      )}

      <div className="oneko-section-heading">
        <h3>Animation</h3>
        <span>{animation.name}</span>
      </div>
      <div className="sprite-animations" role="group" aria-label="Animation">
        {SPRITE_ANIMATIONS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            aria-label={candidate.name}
            aria-pressed={candidate.id === animation.id}
            title={candidate.name}
            onClick={() => {
              setAnimationId(candidate.id);
              setFrameIndex(0);
            }}
          >
            <SpriteFrame source={source} frame={candidate.frames[0]} size={32} />
          </button>
        ))}
      </div>

      <div className="sprite-actions" role="group" aria-label="Frame actions">
        <button type="button" onClick={() => frameOperation(flipPixels)}>
          <FlipHorizontal size={14} aria-hidden="true" /> Flip
        </button>
        <button
          type="button"
          onClick={() => {
            if (!sheetRef.current) return;
            copiedFrame.current = readFrame(sheetRef.current, frame);
            setHasCopy(true);
          }}
        >
          <Copy size={14} aria-hidden="true" /> Copy
        </button>
        <button
          type="button"
          disabled={!hasCopy}
          onClick={() => frameOperation(() => copiedFrame.current!)}
        >
          <ClipboardText size={14} aria-hidden="true" /> Paste
        </button>
        <button
          type="button"
          onClick={() => frameOperation((pixels) => new Uint8ClampedArray(pixels.length))}
        >
          <Trash size={14} aria-hidden="true" /> Clear
        </button>
        {mirrorName && (
          <button type="button" onClick={mirrorAnimation}>
            Mirror to “{mirrorName}”
          </button>
        )}
      </div>

      <div className="sprite-sheet-actions">
        <label className="oneko-text-field" htmlFor="sprite-start">
          Start again from
          <select
            id="sprite-start"
            value=""
            onChange={(event) => {
              if (event.target.value) void startFrom(event.target.value as OnekoSkin);
            }}
          >
            <option value="">Choose a coat…</option>
            {ONEKO_SKINS.map((skin) => (
              <option key={skin.id} value={skin.id}>
                {skin.name}
              </option>
            ))}
          </select>
        </label>
        <div className="oneko-asset-actions">
          <button type="button" onClick={download}>
            <DownloadSimple size={14} aria-hidden="true" /> Download PNG
          </button>
          {drawings.map(
            (saved, index) =>
              saved !== source && (
                <button
                  key={saved}
                  type="button"
                  onClick={() =>
                    actions.update({
                      spriteSrc: saved,
                      spriteName: COAT_NAME,
                      hueRotate: 0,
                    })
                  }
                >
                  <SpriteFrame source={saved} frame={SPRITE_ANIMATIONS[0].frames[0]} size={16} />
                  {DRAWING_LABELS[index]}
                </button>
              ),
          )}
        </div>
      </div>
      <p className="oneko-note">
        Every stroke shows up on your cat. Built-in art belongs to its artists, so keep their credit
        when you share a coat based on it.
      </p>
    </div>
  );
}
