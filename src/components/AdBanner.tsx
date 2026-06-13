import { useEffect, useRef } from "react";

export function AdBanner() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.dataset.loaded === "true") return;
    ref.current.dataset.loaded = "true";

    const conf = document.createElement("script");
    conf.type = "text/javascript";
    conf.innerHTML = `atOptions = { 'key': '85abd4f81f92630462233b486857f08d', 'format': 'iframe', 'height': 60, 'width': 468, 'params': {} };`;

    const invoke = document.createElement("script");
    invoke.type = "text/javascript";
    invoke.src = "//www.highperformanceformat.com/85abd4f81f92630462233b486857f08d/invoke.js";

    ref.current.appendChild(conf);
    ref.current.appendChild(invoke);
  }, []);

  return (
    <div className="w-full flex justify-center my-6">
      <div ref={ref} style={{ width: 468, height: 60, maxWidth: "100%" }} />
    </div>
  );
}
