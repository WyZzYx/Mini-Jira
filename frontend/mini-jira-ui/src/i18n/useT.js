import { useMemo, useState, useEffect } from "react";
import { I18N } from "./strings";

const LS_LANG = "minijira_lang";

export function useT() {
    const [lang, setLang] = useState(localStorage.getItem(LS_LANG) || "en");
    useEffect(() => localStorage.setItem(LS_LANG, lang), [lang]);

    const t = useMemo(() => (k) => I18N[lang]?.[k] ?? k, [lang]);
    return { t, lang, setLang };
}
