"use client";

import {
  CaretDown,
  Check,
  PaintBrush,
  ChatCircleText,
  PawPrint,
  MapPin,
  Code,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { OnekoCustomAssets } from "@/components/oneko-custom-assets";
import { OnekoZones } from "@/components/oneko-zones";
import { OnekoSettings } from "@/components/oneko-settings";
import { OnekoInstall } from "@/components/oneko-install";
import { getSkinSource, ONEKO_SKINS } from "@/lib/oneko/skins";

const SECTIONS = [
  {
    id: "appearance",
    label: "Appearance",
    icon: PaintBrush,
    title: "A look of their own",
    description: "Pick a coat, or bring your own little character.",
  },
  {
    id: "thoughts",
    label: "Thoughts",
    icon: ChatCircleText,
    title: "A little personality",
    description: "Give your companion something to say.",
  },
  {
    id: "behavior",
    label: "Behavior",
    icon: PawPrint,
    title: "Set their pace",
    description: "From quiet company to a playful little shadow.",
  },
  {
    id: "zones",
    label: "Zones",
    icon: MapPin,
    title: "Make room for paws",
    description: "Choose where your cat can wander and where it should stay clear.",
  },
  {
    id: "export",
    label: "Export",
    icon: Code,
    title: "Take your cat with you",
    description: "Your current choices, ready for your React project.",
  },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

function More({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <details className="oneko-disclosure studio-more">
      <summary>
        <span>{title}</span>
        <span className="oneko-disclosure-hint">{hint}</span>
        <CaretDown size={14} className="oneko-disclosure-icon" aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}

function Comfort({
  setting,
  label,
}: {
  setting: "meow" | "bubbleEnabled" | "laserPointer";
  label: string;
}) {
  const { state, actions } = useOnekoPlayground();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={state[setting]}
      aria-label={label}
      data-sound-toggle={setting === "meow" || undefined}
      onClick={() => actions.update({ [setting]: !state[setting] })}
    >
      <span className="oneko-switch" aria-hidden="true" />
      {label}
    </button>
  );
}

export function OnekoTweaks() {
  const { state, actions } = useOnekoPlayground();
  const [active, setActive] = useState<Section>("appearance");
  const [assetsVersion, setAssetsVersion] = useState(0);
  const [notice, setNotice] = useState("");
  const selected = ONEKO_SKINS.find((skin) => skin.id === state.skin) ?? ONEKO_SKINS[0];
  const section = SECTIONS.find((item) => item.id === active)!;

  return (
    <section
      className="oneko-controls studio-editor"
      aria-label="Customize your cat"
      data-oneko-zone="avoid"
    >
      <div className="studio-tabs" role="tablist" aria-label="Customization sections">
        {SECTIONS.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            id={`studio-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`studio-panel-${id}`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => setActive(id)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % SECTIONS.length;
              else if (event.key === "ArrowLeft")
                next = (index + SECTIONS.length - 1) % SECTIONS.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = SECTIONS.length - 1;
              else return;
              event.preventDefault();
              setActive(SECTIONS[next].id);
              document.getElementById(`studio-tab-${SECTIONS[next].id}`)?.focus();
            }}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {SECTIONS.map(({ id }) => (
        <div
          key={id}
          hidden={active !== id}
          role="tabpanel"
          id={`studio-panel-${id}`}
          aria-labelledby={`studio-tab-${id}`}
          tabIndex={0}
          className="studio-panel"
        >
          {active === id && (
            <>
              <header className="studio-panel-heading">
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </header>
              {active === "appearance" && (
                <>
                  <div className="oneko-section-heading">
                    <h3>Choose a coat</h3>
                    <span>{state.spriteSrc ? "Custom sprite" : selected.name}</span>
                  </div>
                  <div className="oneko-skins" role="group" aria-label="Cat coat">
                    {ONEKO_SKINS.map((skin) => (
                      <button
                        key={skin.id}
                        type="button"
                        className="oneko-skin"
                        aria-pressed={!state.spriteSrc && state.skin === skin.id}
                        title={skin.description}
                        onClick={() => {
                          actions.update({
                            skin: skin.id,
                            hueRotate: 0,
                            spriteSrc: "",
                            spriteName: "",
                          });
                          setAssetsVersion((version) => version + 1);
                          setNotice("");
                        }}
                      >
                        <span
                          className="oneko-skin-preview"
                          aria-hidden="true"
                          style={{ backgroundImage: `url("${getSkinSource(skin.id)}")` }}
                        />
                        <span>{skin.name}</span>
                        <span className="oneko-skin-mark" aria-hidden="true">
                          {!state.spriteSrc && state.skin === skin.id && (
                            <Check size={10} weight="bold" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>

                  <More title="Use your own sprite" hint="Upload a PNG">
                    <OnekoCustomAssets section="sprite" key={assetsVersion} />
                  </More>
                  <More title="Fine-tune the look" hint="Size, tint & wiggle">
                    <OnekoSettings group="Coat" />
                  </More>
                </>
              )}
              {active === "thoughts" && (
                <>
                  <div className="oneko-toolbar studio-comforts">
                    <Comfort setting="bubbleEnabled" label="Bubbles" />
                    <Comfort setting="meow" label="Sound" />
                  </div>
                  <OnekoCustomAssets section="thoughts" key={assetsVersion} />
                  <More title="Bubble & sound settings" hint="Timing, placement & volume">
                    <OnekoSettings group="Bubbles & purrs" />
                  </More>
                </>
              )}
              {active === "behavior" && (
                <>
                  <div className="oneko-toolbar studio-comforts">
                    <Comfort setting="laserPointer" label="Laser toy" />
                  </div>
                  <OnekoSettings group="Paws & play" showDiary />
                </>
              )}
              {active === "zones" && <OnekoZones />}
              {active === "export" && (
                <div className="oneko-install">
                  <OnekoInstall />
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <div className="oneko-settings-footer studio-editor-footer">
        <p role="status">{notice || "Changes saved in this browser"}</p>
        <button
          type="button"
          onClick={() => {
            actions.reset();
            setAssetsVersion((version) => version + 1);
            setNotice("Your cat is back to its defaults.");
          }}
        >
          Reset cat
        </button>
      </div>
    </section>
  );
}
