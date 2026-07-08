import { useEffect, useRef } from 'react';

// Comments — same giscus install as the blog (params from its config.toml).
// mapping="specific" with the old blog's pathname-style term ("posts/<slug>/")
// so existing discussions carry over, shared across both languages.
const CONFIG = {
  'data-repo': 'xiaomi388/xiaomi388.github.io',
  'data-repo-id': 'R_kgDOPL7jyw',
  'data-category': 'Announcements',
  'data-category-id': 'DIC_kwDOPL7jy84Cs50C',
  'data-mapping': 'specific',
  'data-reactions-enabled': '1',
  'data-emit-metadata': '0',
  'data-input-position': 'bottom',
  'data-loading': 'lazy',
  crossorigin: 'anonymous',
};

export default function Giscus({ term, theme, lang }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    for (const [k, v] of Object.entries(CONFIG)) s.setAttribute(k, v);
    s.setAttribute('data-term', term);
    s.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    s.setAttribute('data-lang', lang === 'zh' ? 'zh-CN' : 'en');
    el.appendChild(s);
    return () => {
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, lang]);

  // Follow the site theme without reloading the widget.
  useEffect(() => {
    const iframe = document.querySelector('iframe.giscus-frame');
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }, [theme]);

  return <div className="comments" ref={ref} />;
}
