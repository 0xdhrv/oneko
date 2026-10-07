import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Oneko, { type OnekoProps } from "@/components/oneko";

const params = new URLSearchParams(location.search);
const options: OnekoProps = {
  laserPointer: params.has("laser"),
  paused: params.has("paused"),
  persistPosition: !params.has("no-persistence"),
  ...(params.has("calico") ? { skin: "calico", scale: 2, opacity: 0.5 } : {}),
};

function Fixture() {
  const [visible, setVisible] = useState(true);
  const [storageKey, setStorageKey] = useState("oneko");
  return (
    <>
      {visible && <Oneko {...options} storageKey={storageKey} />}
      <nav aria-label="Fixture controls">
        <button onClick={() => setVisible(!visible)}>{visible ? "Hide cat" : "Show cat"}</button>
        <button onClick={() => setStorageKey("second-cat")}>Change storage key</button>
      </nav>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
