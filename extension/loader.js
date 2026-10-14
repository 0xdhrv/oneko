// Content scripts cannot be ES modules, so this classic script imports the engine bundle.
import(chrome.runtime.getURL("content.js"));
