// in: src/graphics/explosion-renderer.js
export const explosionRenderer = {
  /**
   * Renders a single explosion particle.
   * @param {object} ctx - The 2D drawing context of the canvas.
   * @param {object} particle - The particle object to render.
   * @param {number} x - The X coordinate of the particle on the screen.
   * @param {number} y - The Y coordinate of the particle on the screen.
   * @param {number} width - The width of the particle on the screen.
   * @param {number} height - The height of the particle on the screen.
   * @param {number} transformY - The depth of the particle in camera space.
   * @param {Array} zBuffer - The depth buffer.
   */
  renderExplosionParticle: function(ctx, particle, x, y, width, height, transformY, zBuffer) {
    // Perform Z-Buffer check to ensure particles are not drawn in front of walls
    const screenX = Math.floor(x + width / 2);
    if (screenX < 0 || screenX >= zBuffer.length || zBuffer[screenX] < transformY) {
      return; // If the particle is behind a wall or off-screen, do not render
    }

    // Calculate the current progress of the particle's lifecycle (from 1.0 down to 0.0)
    const lifeRatio = particle.life / particle.maxLife;

    // Linearly interpolate between start and end colors based on lifecycle to get the current color
    const r = particle.color.start.r * lifeRatio + particle.color.end.r * (1 - lifeRatio);
    const g = particle.color.start.g * lifeRatio + particle.color.end.g * (1 - lifeRatio);
    const b = particle.color.start.b * lifeRatio + particle.color.end.b * (1 - lifeRatio);
    
    // The closer the particle is to the end of its life, the more transparent it becomes
    const alpha = lifeRatio;

    // Simulate Z-axis (vertical) position
    const verticalOffset = (particle.vz / transformY) * 50; // 50 is an adjustable visual scaling factor

    const radius = width / 2;

    // Use a radial gradient to give the particle softer edges
    const gradient = ctx.createRadialGradient(
        x + radius, y + radius - verticalOffset, 0, 
        x + radius, y + radius - verticalOffset, radius
    );
    
    const currentColor = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`;
    const transparentColor = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0)`;
    
    gradient.addColorStop(0.3, currentColor); // Core is solid color
    gradient.addColorStop(1, transparentColor); // Edge is fully transparent

    ctx.fillStyle = gradient;
    
    // Draw a circle representing the particle
    ctx.beginPath();
    ctx.arc(x + radius, y + radius - verticalOffset, radius, 0, Math.PI * 2);
    ctx.fill();
  }
};