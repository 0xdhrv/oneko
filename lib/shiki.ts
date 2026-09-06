import { codeToHtml, createCssVariablesTheme } from "shiki";
import { ONEKO_SHIKI_THEME_OPTIONS, type CodeLanguage } from "./shiki-config";

export type { CodeLanguage } from "./shiki-config";

const oneKoShikiTheme = createCssVariablesTheme(ONEKO_SHIKI_THEME_OPTIONS);

export function highlightCode(code: string, language: CodeLanguage) {
  return codeToHtml(code, {
    lang: language,
    theme: oneKoShikiTheme,
  });
}
