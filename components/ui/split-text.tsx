import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Safely attempt to load GSAP's premium SplitText if available
let GSAPSplitText: any = null;
try {
  // Use require inside a try-catch to avoid compile-time module resolution errors
  const gsapSplit = require('gsap/SplitText');
  if (gsapSplit && gsapSplit.SplitText) {
    GSAPSplitText = gsapSplit.SplitText;
    gsap.registerPlugin(GSAPSplitText);
  }
} catch (e) {
  // Silent fallback to standard React splitting
}

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
  animateOnMount?: boolean;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
  animateOnMount = false
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current as HTMLElement & {
        _rbsplitInstance?: any;
      };

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      const triggerKeywordHighlight = (container: HTMLElement, startDelay: number) => {
        const keywords = ['chimera', 'labs', 'arjun', 'mehta', 'presence', 'crime', 'dead', 'killed', 'police', 'detective', 'sarah', 'khan', 'good', 'luck'];
        const highlights: Element[] = [];
        const wordElements = container.querySelectorAll('.split-word');
        
        wordElements.forEach(item => {
          const textVal = item.textContent?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
          if (keywords.includes(textVal)) {
            highlights.push(item);
          }
        });

        if (highlights.length > 0) {
          gsap.to(highlights, {
            color: '#ef4444', // Red-500
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.15,
            delay: startDelay
          });
        }
      };

      const scrollTriggerConfig = animateOnMount ? undefined : {
        trigger: el,
        start,
        once: true,
        fastScrollEnd: true,
        anticipatePin: 0.4
      };

      // 1. OFFICIAL PREMIUM GSAP SPLITTEXT ROUTE
      if (GSAPSplitText) {
        if (el._rbsplitInstance) {
          try {
            el._rbsplitInstance.revert();
          } catch (_) {}
          el._rbsplitInstance = undefined;
        }

        let targets: Element[] = [];
        const assignTargets = (self: any) => {
          if (splitType.includes('chars') && self.chars.length) targets = self.chars;
          if (!targets.length && splitType.includes('words') && self.words.length) targets = self.words;
          if (!targets.length && splitType.includes('lines') && self.lines.length) targets = self.lines;
          if (!targets.length) targets = self.chars || self.words || self.lines;
        };

        const splitInstance = new GSAPSplitText(el, {
          type: splitType,
          smartWrap: true,
          autoSplit: splitType === 'lines',
          linesClass: 'split-line',
          wordsClass: 'split-word',
          charsClass: 'split-char',
          reduceWhiteSpace: false,
          onSplit: (self: any) => {
            assignTargets(self);
            
            // Trigger color transition concurrently after 0.4 seconds
            triggerKeywordHighlight(el, 0.4);

            return gsap.fromTo(
              targets,
              { ...from },
              {
                ...to,
                duration,
                ease,
                stagger: delay / 1000,
                scrollTrigger: scrollTriggerConfig,
                onComplete: () => {
                  animationCompletedRef.current = true;
                  onCompleteRef.current?.();
                },
                willChange: 'transform, opacity',
                force3D: true
              }
            );
          }
        });
        el._rbsplitInstance = splitInstance;
        return () => {
          ScrollTrigger.getAll().forEach(st => {
            if (st.trigger === el) st.kill();
          });
          try {
            splitInstance.revert();
          } catch (_) {}
          el._rbsplitInstance = undefined;
        };
      } 
      
      // 2. STANDARD REACT/CSS DOM FALLBACK ROUTE
      else {
        let targets: Element[] = [];
        if (splitType.includes('chars')) {
          targets = Array.from(el.querySelectorAll('.split-char'));
        } else if (splitType.includes('words')) {
          targets = Array.from(el.querySelectorAll('.split-word'));
        } else {
          targets = [el];
        }

        if (targets.length === 0) return;

        const anim = gsap.fromTo(
          targets,
          { ...from },
          {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: scrollTriggerConfig,
            onComplete: () => {
              animationCompletedRef.current = true;
              onCompleteRef.current?.();
            },
            willChange: 'transform, opacity',
            force3D: true
          }
        );

        // Trigger color transition concurrently after 0.4 seconds
        triggerKeywordHighlight(el, 0.4);

        return () => {
          ScrollTrigger.getAll().forEach(st => {
            if (st.trigger === el) st.kill();
          });
          anim.kill();
        };
      }
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded
      ],
      scope: ref
    }
  );

  const renderFallbackContent = () => {
    // Split text into words and chars for custom React DOM rendering
    const words = text.split(' ');
    return words.map((word, wordIndex) => {
      const isLastWord = wordIndex === words.length - 1;
      
      // If we only split by words
      if (splitType === 'words') {
        return (
          <span 
            key={wordIndex} 
            className="split-word" 
            style={{ display: 'inline-block', whiteSpace: 'normal', willChange: 'transform, opacity' }}
          >
            {word}{!isLastWord && '\u00A0'}
          </span>
        );
      }

      // If we split by characters (or words + characters)
      const chars = Array.from(word);
      return (
        <span 
          key={wordIndex} 
          className="split-word" 
          style={{ display: 'inline-block', whiteSpace: 'normal', willChange: 'transform, opacity' }}
        >
          {chars.map((char, charIndex) => (
            <span 
              key={charIndex} 
              className="split-char" 
              style={{ display: 'inline-block', willChange: 'transform, opacity' }}
            >
              {char}
            </span>
          ))}
          {!isLastWord && <span className="split-space" style={{ display: 'inline-block' }}>{'\u00A0'}</span>}
        </span>
      );
    });
  };

  const renderTag = () => {
    const style: React.CSSProperties = {
      textAlign,
      overflow: 'hidden',
      display: 'inline-block',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      willChange: 'transform, opacity'
    };
    const classes = `split-parent ${className}`;
    const Tag = (tag || 'p') as any;

    return (
      <Tag ref={ref} style={style} className={classes}>
        {GSAPSplitText ? text : renderFallbackContent()}
      </Tag>
    );
  };

  return renderTag();
};

export default SplitText;
