import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
};

type Comet = {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  active: boolean;
};

type StarryCanvasProps = {
  isVisible: boolean;
};

export const StarryCanvas = ({ isVisible }: StarryCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const cometRef = useRef<Comet>({
    x: 0,
    y: 0,
    speed: 3,
    length: 100,
    opacity: 0,
    active: false,
  });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initStars();
    };

    // Initialize stars
    const initStars = () => {
      const starCount = 150;
      starsRef.current = [];

      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random(),
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Initialize comet spawn
    const spawnComet = () => {
      if (!cometRef.current.active && Math.random() < 0.3) {
        const comet = cometRef.current;
        comet.active = true;
        comet.opacity = 1;
        comet.x = Math.random() * canvas.width;
        comet.y = 0;
        comet.speed = Math.random() * 2 + 2;
        comet.length = Math.random() * 50 + 80;
      }
    };

    // Draw a star
    const drawStar = (star: Star) => {
      if (!ctx) return;

      // Twinkling effect
      star.twinklePhase += star.twinkleSpeed;
      const opacity = (Math.sin(star.twinklePhase) + 1) / 2;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
      ctx.fill();

      // Add glow effect for larger stars
      if (star.radius > 1) {
        const gradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          star.radius * 3
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw comet
    const drawComet = () => {
      if (!ctx || !cometRef.current.active) return;

      const comet = cometRef.current;

      // Update position
      comet.x += comet.speed * 0.7;
      comet.y += comet.speed;

      // Fade out as it moves
      comet.opacity -= 0.005;

      if (comet.opacity <= 0 || comet.y > canvas.height) {
        comet.active = false;

        return;
      }

      // Draw comet trail
      const gradient = ctx.createLinearGradient(
        comet.x,
        comet.y,
        comet.x - comet.length * 0.7,
        comet.y - comet.length
      );
      gradient.addColorStop(0, `rgba(200, 220, 255, ${comet.opacity})`);
      gradient.addColorStop(0.3, `rgba(150, 180, 255, ${comet.opacity * 0.6})`);
      gradient.addColorStop(1, "rgba(100, 150, 255, 0)");

      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(comet.x - comet.length * 0.7, comet.y - comet.length);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // Draw comet head
      const headGradient = ctx.createRadialGradient(
        comet.x,
        comet.y,
        0,
        comet.x,
        comet.y,
        8
      );
      headGradient.addColorStop(0, `rgba(255, 255, 255, ${comet.opacity})`);
      headGradient.addColorStop(
        0.5,
        `rgba(200, 220, 255, ${comet.opacity * 0.8})`
      );
      headGradient.addColorStop(1, "rgba(150, 180, 255, 0)");

      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = headGradient;
      ctx.fill();
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all stars
      starsRef.current.forEach(drawStar);

      // Draw comet
      drawComet();

      // Spawn comet randomly
      if (Math.random() < 0.002) {
        spawnComet();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (isVisible) {
      animate();
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    />
  );
};
