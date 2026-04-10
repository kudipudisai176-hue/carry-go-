import { useEffect, useRef } from "react";

export default function BusTravelAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Bus state
        let busX = -200;
        const busY = canvas.height - 80;
        const busSpeed = 1.2;

        // Road dashes
        const dashes: { x: number }[] = [];
        for (let i = 0; i < 10; i++) {
            dashes.push({ x: i * 160 });
        }

        // Stars / sparkles behind bus
        const sparkles: { x: number; y: number; life: number; maxLife: number; size: number }[] = [];

        const drawBus = (x: number, y: number) => {
            // Bus body
            const bodyGrad = ctx.createLinearGradient(x, y, x, y + 50);
            bodyGrad.addColorStop(0, "hsl(28 100% 60%)");
            bodyGrad.addColorStop(1, "hsl(28 100% 40%)");

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.roundRect(x, y, 130, 50, [8, 8, 0, 0]);
            ctx.fill();

            // Roof
            const roofGrad = ctx.createLinearGradient(x, y - 14, x, y);
            roofGrad.addColorStop(0, "hsl(222 60% 25%)");
            roofGrad.addColorStop(1, "hsl(222 60% 18%)");
            ctx.fillStyle = roofGrad;
            ctx.beginPath();
            ctx.roundRect(x + 10, y - 14, 110, 18, [5, 5, 0, 0]);
            ctx.fill();

            // Windows
            const winColors = ["rgba(180,220,255,0.8)", "rgba(180,220,255,0.8)", "rgba(180,220,255,0.8)"];
            [x + 8, x + 44, x + 80].forEach((wx, i) => {
                ctx.fillStyle = winColors[i];
                ctx.beginPath();
                ctx.roundRect(wx, y + 8, 28, 22, 3);
                ctx.fill();
                // window shine
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.fillRect(wx + 3, y + 10, 6, 8);
            });

            // Door
            ctx.fillStyle = "hsl(222 60% 15%)";
            ctx.beginPath();
            ctx.roundRect(x + 108, y + 10, 18, 30, 2);
            ctx.fill();

            // Headlights
            const hGrad = ctx.createRadialGradient(x + 126, y + 40, 0, x + 126, y + 40, 14);
            hGrad.addColorStop(0, "rgba(255,240,150,0.9)");
            hGrad.addColorStop(1, "rgba(255,240,150,0)");
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.arc(x + 126, y + 40, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255,240,100,1)";
            ctx.beginPath();
            ctx.arc(x + 130, y + 40, 4, 0, Math.PI * 2);
            ctx.fill();

            // Wheels
            [x + 20, x + 90].forEach((wx) => {
                // Wheel shadow
                ctx.fillStyle = "rgba(0,0,0,0.3)";
                ctx.beginPath();
                ctx.ellipse(wx + 15, y + 52, 16, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tire
                ctx.fillStyle = "#1a1a2e";
                ctx.beginPath();
                ctx.arc(wx + 15, y + 50, 16, 0, Math.PI * 2);
                ctx.fill();

                // Rim
                const rimGrad = ctx.createRadialGradient(wx + 15, y + 50, 0, wx + 15, y + 50, 10);
                rimGrad.addColorStop(0, "#888");
                rimGrad.addColorStop(0.6, "#555");
                rimGrad.addColorStop(1, "#333");
                ctx.fillStyle = rimGrad;
                ctx.beginPath();
                ctx.arc(wx + 15, y + 50, 10, 0, Math.PI * 2);
                ctx.fill();

                // Spokes
                for (let a = 0; a < 5; a++) {
                    const angle = (a / 5) * Math.PI * 2;
                    ctx.strokeStyle = "#aaa";
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(wx + 15, y + 50);
                    ctx.lineTo(wx + 15 + Math.cos(angle) * 8, y + 50 + Math.sin(angle) * 8);
                    ctx.stroke();
                }
            });

            // Exhaust puff
            const puffOpacity = Math.random() * 0.3 + 0.1;
            ctx.fillStyle = `rgba(200,200,200,${puffOpacity})`;
            ctx.beginPath();
            ctx.arc(x - 8, y + 44, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x - 18, y + 40, 4, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawRoad = () => {
            const rY = canvas.height - 30;
            // Road base
            const roadGrad = ctx.createLinearGradient(0, rY - 2, 0, canvas.height);
            roadGrad.addColorStop(0, "rgba(30,35,60,0.95)");
            roadGrad.addColorStop(1, "rgba(20,25,45,0.8)");
            ctx.fillStyle = roadGrad;
            ctx.fillRect(0, rY - 2, canvas.width, 32);

            // Road edge lines
            ctx.strokeStyle = "rgba(255,165,50,0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, rY - 2);
            ctx.lineTo(canvas.width, rY - 2);
            ctx.stroke();

            ctx.strokeStyle = "rgba(255,165,50,0.3)";
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.stroke();

            // Center dashes
            dashes.forEach((d) => {
                ctx.fillStyle = "rgba(255,255,255,0.6)";
                ctx.fillRect(d.x, rY + 10, 60, 4);
                d.x -= busSpeed * 1.5;
                if (d.x + 60 < 0) d.x = canvas.width;
            });
        };

        let frame = 0;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawRoad();

            // Add sparkles behind bus
            if (frame % 3 === 0) {
                sparkles.push({
                    x: busX - 5,
                    y: busY + 20 + Math.random() * 20,
                    life: 0,
                    maxLife: 40 + Math.random() * 20,
                    size: Math.random() * 3 + 1,
                });
            }

            // Draw sparkles
            sparkles.forEach((s, i) => {
                s.life++;
                s.x -= busSpeed * 0.5;
                const progress = s.life / s.maxLife;
                const alpha = (1 - progress) * 0.8;
                ctx.fillStyle = `rgba(255,165,50,${alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * (1 - progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
                if (s.life >= s.maxLife) sparkles.splice(i, 1);
            });

            drawBus(busX, busY - 18);

            // Speed lines
            for (let i = 0; i < 5; i++) {
                const lineY = busY - 30 + i * 10;
                const lineLen = 30 + i * 8;
                const lineAlpha = 0.15 + i * 0.04;
                ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(busX - 20, lineY);
                ctx.lineTo(busX - 20 - lineLen, lineY);
                ctx.stroke();
            }

            busX += busSpeed;
            if (busX > canvas.width + 200) busX = -200;

            frame++;
            animId = requestAnimationFrame(draw);
        };

        // Initialize busX with proper Y based on canvas height
        busX = -200;

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
            style={{ height: "90px" }}
        />
    );
}
