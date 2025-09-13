// graphics/fireball-renderer.js

export const fireballRenderer = {
    renderFireball: function(ctx, fireball, x, y, width, height, transformY, zBuffer) {
        const screenX = x + width / 2;
        // Simple Z-Buffer check
        if (zBuffer[Math.floor(screenX)] > transformY) {
            const radius = width / 2;
            let gradient = ctx.createRadialGradient(x + radius, y + radius, radius * 0.2, x + radius, y + radius, radius);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(0.2, 'yellow');
            gradient.addColorStop(0.6, 'orange');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};