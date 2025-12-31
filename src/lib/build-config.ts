/**
 * Build-time configuration
 * These values are set at build time and embedded into the static output
 */

/**
 * Copyright year - automatically set to current year at build time
 * This is a build-time constant, not a runtime value
 */
export const COPYRIGHT_YEAR = new Date().getFullYear();

/**
 * Build timestamp - when the site was last built
 */
export const BUILD_TIME = new Date().toISOString();
