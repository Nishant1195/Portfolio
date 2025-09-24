// GridController.jsx (fixed: prevents unwanted re-runs)
import React, { useEffect, useRef, useState } from "react";

const defaultSpacing = 81;

const Marker = ({ x, y }) => (
  <circle cx={x} cy={y} r={4} className="fill-black stroke-black stroke-[1]" />
);
const Arrow = ({ x, y, angle }) => (
  <polygon
    points="0,-8 12,0 0,8 -4,0"
    className="fill-black stroke-black stroke-[1]"
    transform={`translate(${x}, ${y}) rotate(${angle})`}
  />
);

export default function GridController({
  sourceRef,
  targetRefs = [],
  spacing = defaultSpacing,
  stagger = 500,
  loop = false,
  stepPx = 6,
  showAnchors = false,
  debug = false,
  persistTrails = true,
}) {
  const svgRef = useRef(null);
  const running = useRef(false);
  const runOnceRef = useRef(false);     // <- prevents re-running when loop === false
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [partialLines, setPartialLines] = useState([]);
  const [completedPaths, setCompletedPaths] = useState([]);
  const [arrowPos, setArrowPos] = useState(null);
  const [anchors, setAnchors] = useState([]);

  useEffect(() => {
    const onResize = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Accept either array of DOM nodes or array of refs or a ref object that contains .current array
  const getTargetElements = () => {
    // If caller passed a ref object (like buttonWrappersRef), try to use .current
    if (targetRefs && typeof targetRefs === "object" && "current" in targetRefs && Array.isArray(targetRefs.current)) {
      return targetRefs.current.filter(Boolean);
    }

    if (!Array.isArray(targetRefs)) return [];
    return targetRefs
      .map((r) => {
        if (!r) return null;
        if (typeof r === "object" && r.nodeType) return r; // DOM node
        if (typeof r === "object" && "current" in r) return r.current; // ref object
        return r;
      })
      .filter(Boolean);
  };

  const snap = (v) => Math.round(v / spacing) * spacing;

  const measure = () => {
    const svgEl = svgRef.current;
    if (!svgEl) {
      if (debug) console.log("GridController: svgRef not ready");
      return null;
    }
    const svgRect = svgEl.getBoundingClientRect();
    const measureElCenter = (el) => {
      if (!el || !el.getBoundingClientRect) return null;
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2 - svgRect.left;
      const cy = (r.top + r.bottom) / 2 - svgRect.top;
      return { cx: Math.max(0, Math.min(cx, svgRect.width)), cy: Math.max(0, Math.min(cy, svgRect.height)) };
    };

    const srcCenter = measureElCenter(sourceRef?.current);
    const targets = getTargetElements().map(measureElCenter).filter(Boolean);
    if (debug) console.log("GridController.measure -> srcCenter:", srcCenter, "targets:", targets);
    return { svgRect, srcCenter, targets };
  };

  const computeGridPath = (s, d) => {
    const a = [{ x: s.x, y: s.y }, { x: d.x, y: s.y }, { x: d.x, y: d.y }];
    const b = [{ x: s.x, y: s.y }, { x: s.x, y: d.y }, { x: d.x, y: d.y }];
    const aFirst = Math.abs(d.x - s.x);
    const bFirst = Math.abs(d.y - s.y);
    return aFirst >= bFirst ? a : b;
  };

  const animatePath = (path) =>
    new Promise((resolve) => {
      if (!path || path.length < 2) return resolve(null);

      let seg = 0;
      const frames = { raf: null };

      const animateSeg = () => {
        if (seg >= path.length - 1) {
          const lastSegFrom = path[path.length - 2];
          const lastSegTo = path[path.length - 1];
          const dxF = lastSegTo.x - lastSegFrom.x;
          const dyF = lastSegTo.y - lastSegFrom.y;
          const finalAngle = Math.atan2(dyF, dxF) * (180 / Math.PI);
          resolve({ fullPath: path, finalAngle });
          return;
        }

        const from = path[seg];
        const to = path[seg + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        let progress = 0;
        const step = () => {
          progress += stepPx;
          const ratio = Math.min(progress / dist, 1);
          const cx = from.x + dx * ratio;
          const cy = from.y + dy * ratio;

          setArrowPos({ x: cx, y: cy, angle });
          setPartialLines((prev) => {
            const copy = [...prev];
            copy[seg] = { x1: from.x, y1: from.y, x2: cx, y2: cy };
            return copy;
          });

          if (ratio < 1) {
            frames.raf = requestAnimationFrame(step);
          } else {
            // finalize segment
            setPartialLines((prev) => {
              const copy = [...prev];
              copy[seg] = { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
              return copy;
            });
            seg += 1;
            frames.raf = requestAnimationFrame(animateSeg);
          }
        };

        frames.raf = requestAnimationFrame(step);
      };

      animateSeg();
    });

  const runSequence = async () => {
    if (running.current) {
      if (debug) console.log("GridController: runSequence called but already running");
      return;
    }

    // If loop === false and we've already run once, do not run again
    if (!loop && runOnceRef.current) {
      if (debug) console.log("GridController: already ran once and loop=false -> skipping");
      return;
    }

    running.current = true;
    if (debug) console.log("GridController: starting runSequence");

    const m = measure();
    if (!m || !m.srcCenter || !m.targets || m.targets.length === 0) {
      if (debug) console.log("GridController: nothing to animate (no source/targets)");
      running.current = false;
      return;
    }

    const sourceSnap = { x: snap(m.srcCenter.cx), y: snap(m.srcCenter.cy) };
    const targetSnaps = m.targets.map((t) => ({ x: snap(t.cx), y: snap(t.cy) }));
    setAnchors([{ ...sourceSnap, label: "source" }, ...targetSnaps.map((s, i) => ({ ...s, label: `t${i}` }))]);

    const paths = targetSnaps.map((tSnap) => computeGridPath(sourceSnap, tSnap));

    if (!persistTrails) setCompletedPaths([]);

    do {
      for (let i = 0; i < paths.length; i++) {
        setPartialLines([]);
        setArrowPos({ x: paths[i][0].x, y: paths[i][0].y, angle: 0 });

        await new Promise((r) => setTimeout(r, i === 0 ? 0 : stagger));
        const result = await animatePath(paths[i]);

        if (result && persistTrails) {
          setCompletedPaths((prev) => [...prev, { path: result.fullPath, finalAngle: result.finalAngle }]);
        }

        setArrowPos(null);
        setPartialLines([]);
        await new Promise((r) => setTimeout(r, 120));
      }

      if (!loop) break;
      await new Promise((r) => setTimeout(r, 600));
    } while (loop && running.current);

    // mark that we've run once (prevents re-run when loop is false)
    runOnceRef.current = true;
    running.current = false;
    if (debug) console.log("GridController: runSequence finished");
  };

  // Poll until svg + source + targets exist; only call runSequence if allowed
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const poll = () => {
      attempts += 1;
      const svgReady = !!svgRef.current;
      const srcReady = !!(sourceRef && sourceRef.current);
      const targetsReady = getTargetElements().length > 0;

      if (debug) {
        // helpful debug
        console.log("GridController.poll -> svgReady:", svgReady, "srcReady:", srcReady, "targetsReady:", targetsReady, "runOnce:", runOnceRef.current);
      }

      // Only trigger runSequence when either loop === true or we haven't run yet
      if (svgReady && srcReady && targetsReady && (loop || !runOnceRef.current)) {
        if (!cancelled) runSequence();
      } else if (attempts < 25 && !cancelled) {
        setTimeout(poll, 100);
      } else {
        if (debug) console.log("GridController: poll finished (no start).");
      }
    };
    const t = setTimeout(poll, 60);
    return () => {
      cancelled = true;
      clearTimeout(t);
      running.current = false;
    };
  // intentionally include loop so changing it will affect behavior
  }, [sourceRef, targetRefs, dims, loop, persistTrails]);

  useEffect(() => () => { running.current = false; }, []);

  const renderFullPath = (path, keyPrefix = "") =>
    path.map((p, idx) => {
      const from = path[idx];
      const to = path[idx + 1];
      if (!to) return null;
      return (
        <line
          key={`${keyPrefix}-seg-${idx}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="black"
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    });

  return (
    <svg
      ref={svgRef}
      width={dims.width}
      height={dims.height}
      className="absolute top-0 left-0 w-full h-full bg-transparent pointer-events-none"
    >
      {Array.from({ length: Math.ceil(dims.width / spacing) + 1 }, (_, i) => (
        <line key={`v-${i}`} x1={i * spacing} y1={0} x2={i * spacing} y2={dims.height} stroke="black" strokeWidth={1} strokeDasharray="2,3" />
      ))}
      {Array.from({ length: Math.ceil(dims.height / spacing) + 1 }, (_, i) => (
        <line key={`h-${i}`} x1={0} y1={i * spacing} x2={dims.width} y2={i * spacing} stroke="black" strokeWidth={1} strokeDasharray="2,3" />
      ))}

      {completedPaths.map((cp, i) => (
        <g key={`completed-${i}`}>
          {renderFullPath(cp.path, `completed-${i}`)}
          {cp.path.length >= 2 && <Arrow x={cp.path[cp.path.length - 1].x} y={cp.path[cp.path.length - 1].y} angle={cp.finalAngle} />}
        </g>
      ))}

      {partialLines.map((ln, i) =>
        ln ? <line key={`partial-${i}`} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} stroke="black" strokeWidth={2} strokeLinecap="round" /> : null
      )}

      {arrowPos && <Arrow x={arrowPos.x} y={arrowPos.y} angle={arrowPos.angle} />}

      {showAnchors && anchors.map((a, i) => <Marker key={`a-${i}`} x={a.x} y={a.y} />)}
    </svg>
  );
}
