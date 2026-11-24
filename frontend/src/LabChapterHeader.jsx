import { Moon, Sun, ArrowLeft } from 'lucide-react'

export default function LabChapterHeader({ theme, onTheme }) {
  return (
    <header className="LabChapterHeader">
      <nav className="SectionShell" aria-label="Lab navigation">
        <a className="LabChapterBrand" href="/cube-preview?from=lab" data-about-passage aria-label="Return to cube"><strong>SR</strong><span>/ THE LAB</span></a>
        <div className="LabChapterActions">
          <a href="/cube-preview?from=lab#work" data-about-passage>Work</a>
          <button type="button" className="LabThemeButton" onClick={onTheme} aria-pressed={theme === 'dark'} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}</button>
          <a className="LabReturn" href="/cube-preview?from=lab" data-about-passage><ArrowLeft size={15} aria-hidden="true"/> Cube</a>
        </div>
      </nav>
    </header>
  )
}
