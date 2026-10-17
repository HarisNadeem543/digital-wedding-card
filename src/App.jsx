import { useState, useRef, useEffect } from 'react'
import './App.css'

// ─── 🎵 AUDIO FILE ────────────────────────────────────────────────────────────
// Place your audio file inside /public and update the path below.
// e.g. if your file is public/wedding-song.mp3 → use '/wedding-song.mp3'
const AUDIO_SRC = '/wedding-song.mp3'
// ──────────────────────────────────────────────────────────────────────────────

const fmt = (secs) => {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MusicPlayer() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)   // elapsed seconds
  const [duration, setDuration] = useState(0)   // total seconds

  // ── Smart Background Pre-buffering & Autoplay ──────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Quietly pre-buffer the audio in the background after splash & initial images load
    const bufferTimer = setTimeout(() => {
      audio.preload = 'auto'
      audio.load()
    }, 1200)

    const tryPlay = () => {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {/* autoplay blocked — starts on user gesture */ })
    }

    // Attempt playback on first user gesture
    const handleFirstGesture = () => {
      tryPlay()
      window.removeEventListener('click', handleFirstGesture)
      window.removeEventListener('touchstart', handleFirstGesture)
    }

    window.addEventListener('click', handleFirstGesture, { once: true })
    window.addEventListener('touchstart', handleFirstGesture, { once: true })

    return () => {
      clearTimeout(bufferTimer)
      window.removeEventListener('click', handleFirstGesture)
      window.removeEventListener('touchstart', handleFirstGesture)
    }
  }, [])

  const onTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrent(audio.currentTime)
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  const onLoadedMetadata = () => {
    setDuration(audioRef.current?.duration ?? 0)
  }

  // loop: just restart — 'loop' attr handles it natively
  const onEnded = () => setIsPlaying(false) // shouldn't fire with loop attr, safety net

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play(); setIsPlaying(true) }
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * audio.duration
  }

  const skipBack = () => {
    if (audioRef.current) audioRef.current.currentTime = 0
  }

  const remaining = duration - current   // countdown seconds

  return (
    <div className="relative w-full flex flex-col items-center mt-10">

      {/* Audio element — smart background pre-buffering */}
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        loop
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
      />

      {/* Deckled paper card */}
      <div className="relative w-[88%] max-w-[320px]">
        <img
          src="/03_small_deckled_card.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="w-full h-auto drop-shadow-card"
        />

        {/* Player overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-2 mx-4">

          {/* Label */}
          <p className="font-cormorant italic text-ink/70 text-[16px] font-bold tracking-widest text-center leading-snug mb-3">
            Press play to listen to our song
          </p>

          {/* ── Timer row ── */}
          <div className="flex items-center justify-between w-full mb-2 px-0.5">
            {/* Elapsed */}
            <span className="font-cormorant font-semibold text-[13px] text-ink/70 tabular-nums">
              {fmt(current)}
            </span>
            {/* Countdown (reverse timer) */}
            <span className="font-cormorant italic font-bold text-[14px] text-ink/85 tabular-nums">
              -{fmt(remaining)}
            </span>
          </div>

          {/* Progress bar — 3px track */}
          <div
            className="w-full h-[3px] bg-ink/30 rounded-full mb-4 cursor-pointer relative"
            onClick={seek}
          >
            <div
              className="h-full bg-ink/80 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
            {/* Playhead dot — bigger */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-ink shadow-md"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">

            {/* Shuffle */}
            <button aria-label="Shuffle" className="text-ink/60 hover:text-ink transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" d="M16 3h5v5M4 20l5-5M20 3l-5 5M4 4l7 7M15 15l5 5v-5" />
              </svg>
            </button>

            {/* Skip back */}
            <button aria-label="Restart" onClick={skipBack} className="text-ink/80 hover:text-ink transition-colors">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </button>

            {/* Play / Pause — bigger button */}
            <button
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
              className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-ink flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                // Pause — two bars symmetric around x=12: x:8-11 and x:13-16
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-parchment" fill="currentColor">
                  <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
                </svg>
              ) : (
                // Play — triangle nudged 1px right for optical centre
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-parchment" fill="currentColor" style={{ transform: 'translateX(1px)' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip fwd — exact mirror of skip-back */}
            <button aria-label="Skip forward" className="text-ink/80 hover:text-ink transition-colors">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zm8.5-12v12h2V6h-2z" />
              </svg>
            </button>

            {/* Loop — always on */}
            <button aria-label="Loop (always on)" className="text-ink/70 hover:text-ink transition-colors" title="Repeat is always on">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              {/* active dot */}
              <span className="block mx-auto mt-0.5 w-1.5 h-1.5 rounded-full bg-ink/70" />
            </button>
          </div>
        </div>

        {/* 🌿 Bridging dried petal — anchored to bottom-right of music card, bridging over to invitation card */}
        <img
          src="/29_dried_petal_bottom_right.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="animate-petal drop-shadow-petal absolute -bottom-12 right-2 w-28 h-auto z-30 rotate-12 pointer-events-none"
        />
      </div>

    </div>
  )
}

// Target wedding date (13 Dec 2026, 7:30 PM PST / Pakistan time)
const WEDDING_TARGET_DATE = '2026-12-13T19:30:00'

function useCountdown(targetDate) {
  const calculate = () => {
    const diff = Math.max(0, new Date(targetDate).getTime() - Date.now())
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)
    return { days, hours, minutes, seconds }
  }

  const [timeLeft, setTimeLeft] = useState(calculate)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculate())
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

function App() {
  const countdown = useCountdown(WEDDING_TARGET_DATE)
  const [isReady, setIsReady] = useState(false)
  const [splashMounted, setSplashMounted] = useState(true)

  useEffect(() => {
    // Graceful invitation reveal: allows fonts, background, and initial styles to settle
    const timer = setTimeout(() => {
      setIsReady(true)
      const unmountTimer = setTimeout(() => setSplashMounted(false), 750)
      return () => clearTimeout(unmountTimer)
    }, 1300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* ── Luxury Royal Invitation Splash Screen ── */}
      {splashMounted && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1d1715] transition-opacity duration-700 ease-out select-none ${
            isReady ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 45%, rgba(107, 29, 47, 0.45) 0%, rgba(29, 23, 21, 0.98) 75%)',
          }}
        >
          <div className="flex flex-col items-center text-center px-6">
            {/* Glowing Royal Wax Seal */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-gold/25 blur-2xl animate-pulse" />
              <img
                src="/04_gold_wax_seal_top.webp"
                alt="Royal Wedding Seal"
                className="relative w-20 h-auto drop-shadow-2xl animate-gentle-pulse"
              />
            </div>

            {/* Couple's Monogram Names */}
            <h2 className="font-cormorant italic font-light text-[36px] sm:text-[40px] tracking-[0.16em] text-[#ede6d4] leading-snug">
              Maida <span className="text-[0.75em] not-italic text-gold mx-2">&amp;</span> Usman
            </h2>

            {/* Delicate gold divider */}
            <div className="flex items-center gap-2.5 my-3.5 w-28">
              <div className="flex-1 h-px bg-gold/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold/90" />
              <div className="flex-1 h-px bg-gold/40" />
            </div>

            {/* Luxury Invitation Subtitle */}
            <p className="font-cormorant italic text-[13.5px] sm:text-[14px] text-[#ede6d4]/85 tracking-[0.24em] uppercase font-light">
              Unfolding your invitation
            </p>

            {/* Shimmer progress indicator */}
            <div className="w-36 h-[1.5px] bg-[#ede6d4]/15 rounded-full mt-6 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-gold to-transparent animate-shimmer-bar" />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Invitation Page ── */}
      <div
        className="animate-page-fade w-full max-w-[430px] min-h-screen mx-auto bg-card flex flex-col items-center shadow-2xl overflow-x-hidden px-6 pb-20 relative"
        style={{
          backgroundImage: "url('/bg.webp')",
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
        }}
      >

      {/* ── Names Section ── */}
      <section className="flex flex-col items-center w-full mt-4 text-center">
        <h1 className="font-cormorant italic font-light text-[38px] tracking-[0.14em] text-ink leading-snug flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
          <span>
            <span className="text-[1.22em]">M</span>aida
          </span>
          <span className="font-light text-muted text-[0.88em] not-italic">&amp;</span>
          <span>
            <span className="text-[1.22em]">U</span>sman
          </span>
        </h1>
      </section>

      {/* ── Envelope Section (Hero - Above the Fold) ── */}
      <section className="w-full flex justify-center mt-9">
        <div className="w-[88%] max-w-[340px]">
          <img
            src="/01_landscape_envelope.webp"
            alt="Wedding Invitation Envelope"
            fetchpriority="high"
            decoding="async"
            className="animate-float-in w-full h-auto drop-shadow-envelope"
          />
        </div>
      </section>

      {/* ── Music + Card shared wrapper — petal bridges both ── */}
      <div className="relative w-full flex flex-col items-center">

        {/* ── Live Music Section ── */}
        <section className="relative z-20 w-full flex flex-col items-center mt-10">
          <MusicPlayer />
        </section>

        {/* ── Invitation Card Section ── */}
        <section className="w-full flex flex-col items-center mt-0 pt-0">
          {/* Layered card stack — shifted left so (card + peeking letter) are visually centred */}
          <div className="relative w-full max-w-[360px] flex justify-center" style={{ transform: 'translateX(-10%)' }}>

            {/* 28 — Handwritten letter, peeking from behind/right */}
            <img
              src="/28_handwritten_letter.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute top-20 right-[-2%] w-[80%] h-[90%] opacity-85 rotate-5 z-0"
              style={{ filter: 'drop-shadow(2px 4px 10px rgba(0,0,0,0.16))' }}
            />

            {/* 26 — Main vertical deckled invitation card (front, centre) */}
            <div className="relative z-10 w-[80%]">
              <img
                src="/26_vertical_deckled_card.webp"
                alt="Wedding Invitation Card"
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
                style={{ filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.20))' }}
              />

              {/* Text overlay on the deckled card */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-10 pt-6 pb-10 text-center gap-1.5">

                {/* Scripture / Quote */}
                <p className="font-cormorant italic font-semibold text-[11px] leading-snug text-ink/80 tracking-wide">
                  "Our Lord, grant us from among our spouses comfort to our eyes"
                </p>
                <p className="font-cormorant font-bold text-[10px] text-ink/60 tracking-widest mb-1">
                  Surah Al-Furqan 25:74
                </p>

                {/* Divider */}
                <div className="flex items-center gap-1.5 w-20 mb-1">
                  <div className="flex-1 h-px bg-ink/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/80" />
                  <div className="flex-1 h-px bg-ink/30" />
                </div>

                {/* Blessing line */}
                <p className="font-cormorant font-bold uppercase text-[9px] tracking-[0.16em] text-ink/70 leading-tight mb-1">
                  With the blessing of God<br />and our families
                </p>

                {/* Parents */}
                <div className="flex justify-between w-full px-1 my-2">
                  <div className="text-left">
                    <p className="font-cormorant font-bold uppercase text-[8px] tracking-wider text-ink/60 mb-0.5">Groom's Parents</p>
                    <p className="font-cormorant italic font-semibold text-[9px] text-ink/80 leading-tight">Groom's Father</p>
                    <p className="font-cormorant italic font-semibold text-[9px] text-ink/80 leading-tight">Groom's Mother</p>
                  </div>
                  <div className="text-right">
                    <p className="font-cormorant font-bold uppercase text-[8px] tracking-wider text-ink/60 mb-0.5">Bride's Parents</p>
                    <p className="font-cormorant italic font-semibold text-[9px] text-ink/80 leading-tight">Nadeem Aslam</p>
                    <p className="font-cormorant italic font-semibold text-[9px] text-ink/80 leading-tight">Tasneem Akhtar</p>
                  </div>
                </div>

                {/* Big couple names */}
                <h2 className="font-cormorant italic font-light text-[40px] leading-tight tracking-wide text-ink">
                  Maida  <span className="text-[0.8em] not-italic text-muted ml-4">&amp;</span>{' '}<br />
                  Usman
                </h2>

                {/* Invite line */}
                <p className="font-cormorant italic font-semibold text-[10px] text-ink/75 leading-snug mt-1 tracking-wide">
                  We are honoured to invite youto our wedding.
                </p>
              </div>
            </div>

            {/* 24 — Green tassel tag with replicated text, overlapping bottom-right of the card */}
            <div
              className="absolute bottom-[-4%] right-[-4%] w-[28%] z-20 pointer-events-none select-none"
              style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.22))' }}
            >
              <div className="relative w-full">
                <img
                  src="/24_green_tassel_tag.webp"
                  alt="Save the date tag"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto block"
                />
                {/* Text overlay on the circular scalloped body */}
                <div className="absolute top-[18%] bottom-[34%] inset-x-0 flex flex-col items-center justify-center px-1 text-center">
                  <p className="font-cormorant font-bold uppercase text-[7.5px] tracking-[0.14em] text-[#e8dfc8] leading-[1.2] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    Add to<br />your<br />calendar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>{/* end shared music+card wrapper */}

      {/* ── Calendar Section ── */}
      <section className="w-full flex justify-center mt-28 mb-8">
        <div className="relative w-[92%] max-w-[380px]">
          <img
            src="/26_vertical_deckled_card.webp"
            alt="Calendar card"
            loading="lazy"
            decoding="async"
            className="w-full h-auto"
            style={{ filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.18))' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-7 sm:px-8 py-[8%] text-center">
            {/* Quote */}
            <p className="font-cormorant italic font-semibold text-[13px] sm:text-[14px] text-ink/80 leading-relaxed tracking-wide mb-2 sm:mb-2.5">
              "Love wrote our story, and we want you<br />
              to be part of this beautiful chapter."
            </p>

            {/* Divider */}
            <div className="flex items-center gap-2 w-20 my-2.5 sm:my-3">
              <div className="flex-1 h-px bg-ink/25" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold/80" />
              <div className="flex-1 h-px bg-ink/25" />
            </div>

            {/* Subheading */}
            <p className="font-cormorant italic font-bold text-[14px] sm:text-[15px] text-ink/85 tracking-wide mb-1">
              The Grand Events
            </p>

            {/* Month & Year */}
            <p className="font-cormorant font-bold uppercase text-[20px] sm:text-[22px] tracking-[0.12em] text-ink/90 mb-3 sm:mb-4">
              December 2026
            </p>

            {/* Calendar Grid */}
            <div className="w-full max-w-[260px] sm:max-w-[270px]">
              <div className="grid grid-cols-7 mb-2">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                  <div key={d} className="font-cormorant font-bold uppercase text-[10px] sm:text-[10.5px] tracking-wider text-ink/60 text-center">{d}</div>
                ))}
              </div>
              {[
                [null, 1, 2, 3, 4, 5, 6],
                [7, 8, 9, 10, 11, 12, 13],
                [14, 15, 16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25, 26, 27],
                [28, 29, 30, 31, null, null, null],
              ].map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 mb-1.5">
                  {week.map((day, di) => {
                    const isHighlighted = day === 13 || day === 19 || day === 20
                    return (
                      <div key={di} className="flex flex-col items-center justify-center py-[2px]">
                        {day ? (
                          <div className={`relative flex items-center justify-center w-[25px] h-[25px] sm:w-[26px] sm:h-[26px] rounded-full ${isHighlighted ? 'bg-burgundy/90 shadow-sm' : 'bg-transparent'}`}>
                            <span className={`font-cormorant font-bold text-[13px] sm:text-[13.5px] tabular-nums ${isHighlighted ? 'text-parchment' : 'text-ink/80'}`}>{day}</span>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ceremony & Reception Card Section ── */}
      <section className="relative w-full flex justify-center mt-12 mb-6">
        <div className="relative w-[92%] max-w-[360px]">

          {/* Gold wax seal top-left */}
          <img
            src="/04_gold_wax_seal_top.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute -top-4 left-[3%] w-14 h-auto z-20 drop-shadow-lg"
          />

          {/* Burgundy envelope peeking from top-right (enlarged) */}
          <img
            src="/06_burgundy_envelope_small.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute -top-12 right-[-5%] w-[62%] h-auto z-0 drop-shadow-xl"
          />

          {/* Gold wax seal on top of the burgundy envelope flap & overlapping the white paper */}
          <img
            src="/04_gold_wax_seal_top.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute top-5 right-[20%] w-12 h-auto z-20 drop-shadow-lg"
          />

          {/* 03 — Deckled paper card (front) */}
          <div className="relative z-10 w-full mt-6">
            <img
              src="/03_small_deckled_card.webp"
              alt="Reception details"
              loading="lazy"
              decoding="async"
              className="w-full h-auto drop-shadow-card"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-5 text-center">
              <p className="font-cormorant font-bold uppercase text-[12px] tracking-[0.2em] text-ink/80 mb-2.5">
                Ceremony &amp; Reception
              </p>

              <div className="flex items-center justify-center w-full px-2 gap-3.5 mb-3">
                <div className="text-right">
                  <p className="font-cormorant italic font-bold text-[18px] text-burgundy leading-none">
                    7:00 P.M.
                  </p>
                </div>
                <div className="w-px h-10 bg-ink/25" />
                <div className="text-left">
                  <p className="font-cormorant italic font-bold text-[15px] text-ink leading-tight">
                    The Grand Marquee
                  </p>
                  <p className="font-cormorant font-semibold text-[9.5px] text-ink/70 leading-tight">
                    Club Avenue, Phase VIII
                  </p>
                  <p className="font-cormorant font-semibold text-[9.5px] text-ink/70 leading-tight">
                    Islamabad, Pakistan
                  </p>
                </div>
              </div>

              {/* View Location button */}
              <button
                type="button"
                className="px-5 py-1 rounded-full border border-ink/40 font-cormorant font-bold uppercase text-[8.5px] tracking-[0.2em] text-ink/80 hover:bg-ink hover:text-parchment active:scale-95 transition shadow-sm"
              >
                View Location
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Wedding Itinerary Section (Pakistani Functions) ── */}
      <section className="relative w-full flex justify-center mt-12 mb-14">
        {/* Layered stack shifted right so (burgundy card + left-peeking letter) are visually centred together */}
        <div className="relative w-full max-w-[360px] flex justify-center" style={{ transform: 'translateX(7%)' }}>

          {/* 28 — Handwritten letter, peeking from bottom-left corner */}
          <img
            src="/28_handwritten_letter.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute bottom-[-8%] left-[-3%] w-[78%] h-auto opacity-85 z-0"
            style={{ filter: 'drop-shadow(2px 6px 14px rgba(0,0,0,0.18))' }}
          />

          {/* 16 — Burgundy vertical panel (front) */}
          <div className="relative z-10 w-[78%] max-w-[280px]">
            <img
              src="/16_burgundy_vertical_panel_center.webp"
              alt="Itinerary panel"
              loading="lazy"
              decoding="async"
              className="w-full h-auto drop-shadow-2xl"
            />

            {/* Overlay for Itinerary text */}
            <div className="absolute inset-0 flex flex-col items-center pt-[9%] pb-[6%] px-2 text-[#ede6d4]">

              {/* Title */}
              <h3 className="font-cormorant font-bold uppercase text-[20px] tracking-[0.25em] text-[#ede6d4] text-center mb-0.5">
                Itinerary
              </h3>
              <p className="font-cormorant italic text-[10.5px] text-[#ede6d4]/80 tracking-widest text-center mb-4">
                Wedding Celebrations
              </p>

              {/* ── Vertical Timeline Container ── */}
              <div className="relative w-full flex-1 flex flex-col justify-between py-2">

                {/* Central vertical connecting line */}
                <div className="absolute left-1/2 top-3 bottom-3 -translate-x-1/2 w-[1.5px] bg-[#ede6d4]/40" />

                {/* 1. Mehndi */}
                <div className="relative flex items-center w-full z-10">
                  {/* Left: Icon */}
                  <div className="w-1/2 pr-4 flex items-center justify-end">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ede6d4]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2a3.5 3.5 0 0 1 0 7M12 15a3.5 3.5 0 0 1 0 7M2 12a3.5 3.5 0 0 1 7 0M15 12a3.5 3.5 0 0 1 7 0" />
                        <circle cx="6" cy="6" r="1.5" />
                        <circle cx="18" cy="6" r="1.5" />
                        <circle cx="6" cy="18" r="1.5" />
                        <circle cx="18" cy="18" r="1.5" />
                      </svg>
                    </div>
                  </div>
                  {/* Center Node */}
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#ede6d4] bg-[#531320] shrink-0" />
                  {/* Right: Text */}
                  <div className="w-1/2 pl-4 text-left">
                    <p className="font-cormorant text-[8.5px] uppercase tracking-wider text-[#ede6d4]/80 leading-none mb-0.5">7:30 PM</p>
                    <p className="font-cormorant font-bold uppercase text-[10.5px] tracking-wider text-[#ede6d4] leading-tight">Mehndi</p>
                    <p className="font-cormorant italic text-[8.5px] text-[#ede6d4]/70 leading-none">Sun, 13 Dec</p>
                  </div>
                </div>

                {/* 2. Barat Arrival */}
                <div className="relative flex items-center w-full z-10">
                  {/* Left: Text */}
                  <div className="w-1/2 pr-4 text-right">
                    <p className="font-cormorant text-[8.5px] uppercase tracking-wider text-[#ede6d4]/80 leading-none mb-0.5">8:00 PM</p>
                    <p className="font-cormorant font-bold uppercase text-[10.5px] tracking-wider text-[#ede6d4] leading-tight">Barat Arrival</p>
                    <p className="font-cormorant italic text-[8.5px] text-[#ede6d4]/70 leading-none">Sat, 19 Dec</p>
                  </div>
                  {/* Center Node */}
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#ede6d4] bg-[#531320] shrink-0" />
                  {/* Right: Icon */}
                  <div className="w-1/2 pl-4 flex items-center justify-start">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ede6d4]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M5 21V10a7 7 0 0 1 14 0v11" />
                        <path d="M3 21h4M17 21h4M7 8h10M8 5h8" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 3. Wedding Feast */}
                <div className="relative flex items-center w-full z-10">
                  {/* Left: Icon */}
                  <div className="w-1/2 pr-4 flex items-center justify-end">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ede6d4]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="12" cy="12" r="8" />
                        <path d="M4 6v6a2 2 0 0 0 2 2v6M20 6v14M18 6v4a2 2 0 0 0 2 2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  {/* Center Node */}
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#ede6d4] bg-[#531320] shrink-0" />
                  {/* Right: Text */}
                  <div className="w-1/2 pl-4 text-left">
                    <p className="font-cormorant text-[8.5px] uppercase tracking-wider text-[#ede6d4]/80 leading-none mb-0.5">9:30 PM</p>
                    <p className="font-cormorant font-bold uppercase text-[10.5px] tracking-wider text-[#ede6d4] leading-tight">Dinner Feast</p>
                    <p className="font-cormorant italic text-[8.5px] text-[#ede6d4]/70 leading-none">Traditional Banquet</p>
                  </div>
                </div>

                {/* 4. Rukhsati */}
                <div className="relative flex items-center w-full z-10">
                  {/* Left: Text */}
                  <div className="w-1/2 pr-4 text-right">
                    <p className="font-cormorant text-[8.5px] uppercase tracking-wider text-[#ede6d4]/80 leading-none mb-0.5">11:30 PM</p>
                    <p className="font-cormorant font-bold uppercase text-[10.5px] tracking-wider text-[#ede6d4] leading-tight">Rukhsati</p>
                    <p className="font-cormorant italic text-[8.5px] text-[#ede6d4]/70 leading-none">Blessings &amp; Dua</p>
                  </div>
                  {/* Center Node */}
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#ede6d4] bg-[#531320] shrink-0" />
                  {/* Right: Icon */}
                  <div className="w-1/2 pl-4 flex items-center justify-start">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ede6d4]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 5. Walima Reception */}
                <div className="relative flex items-center w-full z-10">
                  {/* Left: Icon */}
                  <div className="w-1/2 pr-4 flex items-center justify-end">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ede6d4]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M8 2l-3 6a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3L9 2H8zM8 11v8M5 19h6" />
                        <path d="M16 4l-2 5a2.5 2.5 0 0 0 2.5 2.5h.5a2.5 2.5 0 0 0 2.5-2.5L17.5 4H16zM17 11.5v7.5M14.5 19h5" />
                      </svg>
                    </div>
                  </div>
                  {/* Center Node */}
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#ede6d4] bg-[#531320] shrink-0" />
                  {/* Right: Text */}
                  <div className="w-1/2 pl-4 text-left">
                    <p className="font-cormorant text-[8.5px] uppercase tracking-wider text-[#ede6d4]/80 leading-none mb-0.5">8:30 PM</p>
                    <p className="font-cormorant font-bold uppercase text-[10.5px] tracking-wider text-[#ede6d4] leading-tight">Walima</p>
                    <p className="font-cormorant italic text-[8.5px] text-[#ede6d4]/70 leading-none">Sun, 20 Dec</p>
                  </div>
                </div>

                {/* 6. Kashmiri Chai & Kehwa */}
                <div className="relative flex items-center w-full z-10">
                  {/* Left: Text */}
                  <div className="w-1/2 pr-4 text-right">
                    <p className="font-cormorant text-[8.5px] uppercase tracking-wider text-[#ede6d4]/80 leading-none mb-0.5">10:30 PM</p>
                    <p className="font-cormorant font-bold uppercase text-[10.5px] tracking-wider text-[#ede6d4] leading-tight">Kashmiri Chai</p>
                    <p className="font-cormorant italic text-[8.5px] text-[#ede6d4]/70 leading-none">Kehwa &amp; Sweets</p>
                  </div>
                  {/* Center Node */}
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#ede6d4] bg-[#531320] shrink-0" />
                  {/* Right: Icon */}
                  <div className="w-1/2 pl-4 flex items-center justify-start">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ede6d4]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4 9h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9zM17 11h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2M2 21h18" />
                        <path d="M7 3v3M11 2v4M15 3v3" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Countdown Timer Section ── */}
      <section className="relative w-full flex flex-col items-center mt-10 mb-12 text-center">
        <div className="relative w-[90%] max-w-[360px] flex flex-col items-center">

          {/* 19 — Gold wax seal floating top-right */}
          <img
            src="/19_gold_wax_seal_right.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute -top-3 right-[2%] w-13 h-auto z-10 drop-shadow-lg"
          />

          <h3 className="font-cormorant font-light uppercase text-[35px] tracking-[0.1  em] text-ink/85 mt-16 mb-5">
            COUNTDOWN
          </h3>

          {/* Unit-by-unit aligned numbers & labels */}
          <div className="flex items-start justify-center gap-2.5 sm:gap-4 text-ink">
            {/* Days */}
            <div className="flex flex-col items-center min-w-[50px]">
              <span className="font-cormorant text-[42px] sm:text-[46px] font-light leading-none tabular-nums tracking-wide text-ink">
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span className="font-cormorant font-bold uppercase text-[12px] tracking-[0.24em] text-ink/100 mt-2">
                DAYS
              </span>
            </div>

            {/* Separator */}
            <span className="font-cormorant text-[40px] text-ink/100">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center min-w-[50px]">
              <span className="font-cormorant text-[42px] sm:text-[46px] font-light leading-none tabular-nums tracking-wide text-ink">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="font-cormorant font-bold uppercase text-[12px] tracking-[0.24em] text-ink/100 mt-2">
                HOURS
              </span>
            </div>

            {/* Separator */}
            <span className="font-cormorant text-[40px] text-ink/100">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center min-w-[50px]">
              <span className="font-cormorant text-[42px] sm:text-[46px] font-light leading-none tabular-nums tracking-wide text-ink">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span className="font-cormorant font-bold uppercase text-[12px] tracking-[0.24em] text-ink/100 mt-2">
                MINS
              </span>
            </div>

            {/* Separator */}
            <span className="font-cormorant text-[40px] text-ink/100">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center min-w-[50px]">
              <span className="font-cormorant text-[42px] sm:text-[46px] font-light leading-none tabular-nums tracking-wide text-ink">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span className="font-cormorant font-bold uppercase text-[12px] tracking-[0.24em] text-ink/100 mt-2">
                SECS
              </span>
            </div>
          </div>

          {/* Gold dot ornament divider */}
          <div className="flex items-center gap-2.5 mt-8 w-32">
            <div className="flex-1 h-px bg-ink/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <div className="flex-1 h-px bg-ink/20" />
          </div>
        </div>
      </section>

      {/* ── 31 — Final RSVP / Attendance Component ── */}
      <section className="relative w-full flex justify-center mt-6 mb-10">
        <div className="relative w-[88%] max-w-[340px]">
          <img
            src="/31_envelope.webp"
            alt="RSVP Envelope"
            loading="lazy"
            decoding="async"
            className="w-full h-auto drop-shadow-2xl"
          />

          {/* Text overlay on the cream deckled card tucked into the pocket */}
          <div className="absolute top-[43%] inset-x-[12%] h-[31%] flex flex-col items-center justify-center text-center px-3 z-10">
            <p className="font-cormorant italic font-semibold text-[17px] sm:text-[13px] text-ink/75 leading-snug tracking-wide mb-2.5">
              We will be delighted by your presence as we celebrate our wedding.
            </p>
          </div>
        </div>
      </section>

      {/* ── 30 — Closing Blessings & Family Welcome (Pakistani Wedding) ── */}
      <section className="relative w-full flex justify-center mt-4 mb-20">
        <div className="relative w-[94%] max-w-[370px]">
          <img
            src="/30_multi.webp"
            alt="Closing Blessings Card"
            loading="lazy"
            decoding="async"
            className="w-full h-auto drop-shadow-2xl"
          />

          {/* 1. Burgundy top banner text */}
          <div className="absolute top-[3%] inset-x-[10%] h-[25%] flex flex-col items-center justify-center text-center px-4">
            <p className="font-cormorant font-bold uppercase text-[10px] sm:text-[11px] tracking-[0.25em] text-[#ede6d4]/90 mb-0.5">
              With Love &amp; Prayers
            </p>
            <p className="font-cormorant italic font-medium text-[11px] sm:text-[12px] text-[#ede6d4]/85 tracking-wide">
              "Barakallahu Lakuma wa Baraka Alaikuma"
            </p>
          </div>

          {/* 2. Separate Green Tassel Tag — overlapping top-left of the card */}
          <div
            className="absolute top-[22%] left-[-2%] w-[33%] z-20 pointer-events-none select-none"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.24))' }}
          >
            <div className="relative w-full">
              <img
                src="/24_green_tassel_tag.webp"
                alt="Blessing tag"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
              {/* Text overlay on the circular scalloped body */}
              <div className="absolute top-[18%] bottom-[33%] inset-x-0 flex flex-col items-center justify-center px-1 text-center">
                <p className="font-cormorant font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-[0.16em] text-[#ede6d4] leading-[1.25] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  With<br />Heartfelt<br />Dua
                </p>
              </div>
            </div>
          </div>

          {/* 3. Main cream deckled card text overlay */}
          <div className="absolute top-[34%] left-[29%] right-[8%] bottom-[12%] flex flex-col items-center justify-center text-center px-3 z-10">
            <h4 className="font-cormorant italic font-bold text-[18px] sm:text-[20px] text-ink leading-tight mb-1">
              A Warm Welcome
            </h4>

            <div className="flex items-center gap-1.5 w-16 mb-2">
              <div className="flex-1 h-px bg-ink/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <div className="flex-1 h-px bg-ink/20" />
            </div>

            <p className="font-cormorant italic font-semibold text-[11px] sm:text-[12px] text-ink/80 leading-relaxed tracking-wide mb-2.5">
              "Your gracious presence and heartfelt prayers are the greatest blessing as we begin this new chapter together."
            </p>

            <p className="font-cormorant font-bold uppercase text-[9px] sm:text-[9.5px] tracking-[0.18em] text-ink/70 leading-tight mb-0.5">
              Eagerly Awaiting You
            </p>
            <p className="font-cormorant italic font-semibold text-[10.5px] text-ink/85">
              Aslam &amp; Nadeem Families
            </p>

            <p className="font-cormorant italic text-[8.5px] sm:text-[9px] text-ink/55 tracking-wider mt-2">
              — Only your prayers &amp; blessings requested —
            </p>
          </div>

        </div>
      </section>

    </div>
    </>
  )
}

export default App
