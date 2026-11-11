/**
 * Snake Game — Lógica principal
 * -----------------------------
 * Renderizado con Canvas 2D, game loop con requestAnimationFrame.
 * Estado del juego: READY → PLAYING → PAUSED / GAME_OVER → PLAYING ...
 */

(function () {
    'use strict';

    // ===== Configuración =====
    const GRID = 20;            // celdas por lado (20×20)
    const CELL = 20;            // px por celda (canvas 400×400)
    const INITIAL_SPEED = 140;  // ms entre movimientos al empezar
    const MIN_SPEED = 60;       // velocidad máxima (ms mínimos)
    const SPEED_STEP = 4;       // cuánto se acelera por comida
    const HS_KEY = 'snakeHighScore';

    // ===== Referencias al DOM =====
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayText = document.getElementById('overlay-text');
    const startButton = document.getElementById('start-button');

    // ===== Estado del juego =====
    let state = 'READY'; // READY | PLAYING | PAUSED | GAME_OVER
    let snake, dir, nextDir, food, score, highScore, speed, moveAccumulator;

    // ===== Inicialización =====
    highScore = parseInt(localStorage.getItem(HS_KEY), 10) || 0;
    highScoreEl.textContent = highScore;

    function resetGame() {
        // Serpiente inicial: 3 segmentos en el centro, moviéndose a la derecha
        snake = [
            { x: 10, y: 10 },
            { x: 9,  y: 10 },
            { x: 8,  y: 10 },
        ];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        speed = INITIAL_SPEED;
        moveAccumulator = 0;
        scoreEl.textContent = score;
        spawnFood();
    }

    /**
     * Coloca la comida en una celda aleatoria que no esté ocupada por la serpiente.
     */
    function spawnFood() {
        const occupied = new Set(snake.map(s => s.x + ',' + s.y));
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * GRID),
                y: Math.floor(Math.random() * GRID),
            };
        } while (occupied.has(pos.x + ',' + pos.y));
        food = pos;
    }

    // ===== Game loop =====
    let lastTime = 0;

    function loop(timestamp) {
        const delta = timestamp - lastTime;
        lastTime = timestamp;

        if (state === 'PLAYING') {
            moveAccumulator += delta;
            // Movemos la serpiente a intervalos fijos (speed ms)
            while (moveAccumulator >= speed) {
                moveAccumulator -= speed;
                step();
                if (state !== 'PLAYING') break; // game over dentro de step()
            }
        }

        render();
        requestAnimationFrame(loop);
    }

    /**
     * Avanza la serpiente una celda en la dirección actual.
     * Detecta colisiones con muros y consigo misma.
     */
    function step() {
        dir = nextDir;
        const head = snake[0];
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        // Colisión con muros
        if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
            gameOver();
            return;
        }

        // Colisión con el propio cuerpo (ignoramos la cola que se va a mover,
        // salvo que vayamos a crecer en este turno)
        const willEat = newHead.x === food.x && newHead.y === food.y;
        const bodyToCheck = willEat ? snake : snake.slice(0, -1);
        for (const seg of bodyToCheck) {
            if (seg.x === newHead.x && seg.y === newHead.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(newHead);

        if (willEat) {
            score++;
            scoreEl.textContent = score;
            // Acelera gradualmente, hasta un mínimo
            speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
            spawnFood();
        } else {
            snake.pop(); // no comió → la cola avanza
        }
    }

    function gameOver() {
        state = 'GAME_OVER';
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(HS_KEY, highScore);
            highScoreEl.textContent = highScore;
        }
        showOverlay('Game Over', `Puntuación: ${score}`, 'Reintentar');
    }

    // ===== Renderizado =====
    function render() {
        // Fondo
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rejilla sutil
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL, 0);
            ctx.lineTo(i * CELL, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL);
            ctx.lineTo(canvas.width, i * CELL);
            ctx.stroke();
        }

        // Comida (manzana con brillo)
        drawFood();

        // Serpiente
        drawSnake();
    }

    function drawFood() {
        const cx = food.x * CELL + CELL / 2;
        const cy = food.y * CELL + CELL / 2;
        const r = CELL / 2 - 3;

        // Resplandor
        const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL);
        glow.addColorStop(0, 'rgba(255,82,82,0.45)');
        glow.addColorStop(1, 'rgba(255,82,82,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo de la manzana
        ctx.fillStyle = '#ff5252';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Brillo superior
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSnake() {
        for (let i = snake.length - 1; i >= 0; i--) {
            const seg = snake[i];
            const x = seg.x * CELL;
            const y = seg.y * CELL;
            const isHead = i === 0;

            // Degradado verde: la cabeza más brillante, la cola más oscura
            const t = i / Math.max(snake.length - 1, 1);
            const lightness = 60 - t * 25; // 60% → 35%
            ctx.fillStyle = `hsl(140, 70%, ${lightness}%)`;

            // Segmentos redondeados
            const pad = isHead ? 1 : 2;
            roundRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5);
            ctx.fill();

            // Ojos en la cabeza
            if (isHead) {
                drawEyes(x, y);
            }
        }
    }

    function drawEyes(x, y) {
        const eyeSize = 3;
        const offset = 4;
        ctx.fillStyle = '#1a1a2e';

        // Posición de los ojos según la dirección
        let e1, e2;
        if (dir.x === 1) {       // derecha
            e1 = { x: x + CELL - offset, y: y + offset };
            e2 = { x: x + CELL - offset, y: y + CELL - offset - eyeSize };
        } else if (dir.x === -1) { // izquierda
            e1 = { x: x + offset - eyeSize, y: y + offset };
            e2 = { x: x + offset - eyeSize, y: y + CELL - offset - eyeSize };
        } else if (dir.y === -1) { // arriba
            e1 = { x: x + offset, y: y + offset - eyeSize };
            e2 = { x: x + CELL - offset - eyeSize, y: y + offset - eyeSize };
        } else {                   // abajo
            e1 = { x: x + offset, y: y + CELL - offset };
            e2 = { x: x + CELL - offset - eyeSize, y: y + CELL - offset };
        }

        ctx.fillRect(e1.x, e1.y, eyeSize, eyeSize);
        ctx.fillRect(e2.x, e2.y, eyeSize, eyeSize);
    }

    /** Dibuja un rectángulo con esquinas redondeadas. */
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // ===== Overlay =====
    function showOverlay(title, text, buttonText) {
        overlayTitle.textContent = title;
        overlayText.innerHTML = text;
        startButton.textContent = buttonText;
        overlay.classList.remove('hidden');
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    // ===== Control del juego =====
    function startGame() {
        resetGame();
        state = 'PLAYING';
        moveAccumulator = 0;
        lastTime = performance.now();
        hideOverlay();
    }

    function togglePause() {
        if (state === 'PLAYING') {
            state = 'PAUSED';
            showOverlay('Pausa', 'Pulsa para continuar', 'Continuar');
        } else if (state === 'PAUSED') {
            state = 'PLAYING';
            lastTime = performance.now();
            hideOverlay();
        }
    }

    // ===== Controles de teclado =====
    function handleKey(e) {
        const key = e.key.toLowerCase();

        // Espacio: pausar/reanudar (solo si está jugando o pausado)
        if (key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (state === 'PLAYING' || state === 'PAUSED') {
                togglePause();
            }
            return;
        }

        // Direcciones — ignoramos el intento de ir en sentido opuesto
        if (state !== 'PLAYING') return;

        const tryDir = { x: 0, y: 0 };
        switch (key) {
            case 'arrowup': case 'w':    tryDir.x = 0;  tryDir.y = -1; break;
            case 'arrowdown': case 's':  tryDir.x = 0;  tryDir.y = 1;  break;
            case 'arrowleft': case 'a':  tryDir.x = -1; tryDir.y = 0;  break;
            case 'arrowright': case 'd': tryDir.x = 1;  tryDir.y = 0;  break;
            default: return;
        }

        // Evita giro de 180° (chocar con el propio cuello)
        if (tryDir.x === -dir.x && tryDir.y === -dir.y) return;

        nextDir = tryDir;
    }

    document.addEventListener('keydown', handleKey);

    // ===== Controles táctiles (swipe) =====
    let touchStart = null;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!touchStart || state !== 'PLAYING') {
            touchStart = null;
            return;
        }

        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStart.x;
        const dy = touch.clientY - touchStart.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Umbral mínimo para no registrar toques accidentales
        if (absDx < 20 && absDy < 20) {
            touchStart = null;
            return;
        }

        let tryDir;
        if (absDx > absDy) {
            tryDir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
            tryDir = { x: 0, y: dy > 0 ? 1 : -1 };
        }

        if (tryDir.x === -dir.x && tryDir.y === -dir.y) {
            touchStart = null;
            return;
        }
        nextDir = tryDir;
        touchStart = null;
    }, { passive: false });

    // ===== Botón de inicio =====
    startButton.addEventListener('click', () => {
        if (state === 'PAUSED') {
            togglePause();
        } else {
            startGame();
        }
    });

    // ===== Arranque =====
    resetGame();
    render();
    requestAnimationFrame(loop);
})();
