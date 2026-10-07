import { createHighlighterCore, createCssVariablesTheme } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "@shikijs/langs/bash";
import html from "@shikijs/langs/html";
import tsx from "@shikijs/langs/tsx";
import { ONEKO_SHIKI_THEME_OPTIONS, type CodeLanguage } from "./shiki-config";

export type { CodeLanguage } from "./shiki-config";

const oneKoShikiTheme = createCssVariablesTheme(ONEKO_SHIKI_THEME_OPTIONS);
// Bundle only the grammars used by the site so the Worker stays small.
const highlighter = createHighlighterCore({
  themes: [oneKoShikiTheme],
  langs: [bash, html, tsx],
  engine: createJavaScriptRegexEngine(),
});

export async function highlightCode(code: string, language: CodeLanguage) {
  return (await highlighter).codeToHtml(code, {
    lang: language,
    theme: oneKoShikiTheme,
  });
}
