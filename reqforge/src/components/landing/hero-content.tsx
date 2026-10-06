"use client";

import { useEffect, useState } from "react";
import { HeroActions } from "@/components/landing/hero-actions";
import { heroCopy } from "@/config/navigation";

const secondLinePrefix = `${heroCopy.headlinePrefix} `;
const headlineLength =
  heroCopy.headlineLine1.length +
  secondLinePrefix.length +
  heroCopy.headlineAccent.length;

export function HeroContent() {
  const [typedCharacters, setTypedCharacters] = useState(0);
  const firstLineCharacters = Math.min(
    typedCharacters,
    heroCopy.headlineLine1.length,
  );
  const secondLineCharacters = Math.max(
    0,
    typedCharacters - heroCopy.headlineLine1.length,
  );
  const accentCharacters = Math.max(
    0,
    secondLineCharacters - secondLinePrefix.length,
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let animationTimeout = 0;

    const startTyping = () => {
      if (reducedMotion) {
        setTypedCharacters(headlineLength);
        return;
      }

      let currentCharacter = 0;

      const deleteHeadline = () => {
        currentCharacter -= 1;
        setTypedCharacters(currentCharacter);

        if (currentCharacter > 0) {
          animationTimeout = window.setTimeout(deleteHeadline, 26);
          return;
        }

        animationTimeout = window.setTimeout(startTyping, 700);
      };

      const typeHeadline = () => {
        currentCharacter += 1;
        setTypedCharacters(currentCharacter);

        if (currentCharacter < headlineLength) {
          animationTimeout = window.setTimeout(typeHeadline, 42);
          return;
        }

        animationTimeout = window.setTimeout(deleteHeadline, 1900);
      };

      typeHeadline();
    };

    animationTimeout = window.setTimeout(startTyping, reducedMotion ? 0 : 220);

    return () => {
      window.clearTimeout(animationTimeout);
    };
  }, []);

  return (
    <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-col items-center px-5 pt-8 text-center sm:pt-10 md:pt-12 lg:pt-14">
      <h1
        aria-label={`${heroCopy.headlineLine1} ${secondLinePrefix}${heroCopy.headlineAccent}`}
        className="min-h-[2.35em] max-w-3xl text-balance text-[2.25rem] font-light leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl md:text-[3.5rem] lg:text-[4rem]"
      >
        <span className="block" aria-hidden="true">
          {heroCopy.headlineLine1.slice(0, firstLineCharacters)}
          {typedCharacters < heroCopy.headlineLine1.length && <TypingCursor />}
        </span>
        <span className="mt-1 block sm:mt-1.5" aria-hidden="true">
          <span className="font-light text-white/95">
            {secondLinePrefix.slice(0, secondLineCharacters)}
          </span>
          <span className="text-gradient-cyan font-light">
            {heroCopy.headlineAccent.slice(0, accentCharacters)}
          </span>
          {typedCharacters >= heroCopy.headlineLine1.length && <TypingCursor />}
        </span>
      </h1>

      <p className="animate-rf-fade-up-delay-1 mt-4 max-w-lg text-pretty text-[0.95rem] font-normal leading-relaxed text-[#c5b8d6] sm:mt-5 sm:text-base md:max-w-xl md:text-[1.05rem] md:leading-7">
        {heroCopy.description}
      </p>

      
    </div>
  );
}

function TypingCursor() {
  return <span className="rf-type-cursor" />;
}
