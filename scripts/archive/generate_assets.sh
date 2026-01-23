#!/bin/bash

# Script to generate PNG assets from SVGs using Inkscape
# Usage: ./generate_assets.sh

PUBLIC_DIR="./public"
FAVICON_SVG="$PUBLIC_DIR/favicon.svg"
OG_SVG="$PUBLIC_DIR/og-image.svg"

echo "🚀 Generating favicon assets from $FAVICON_SVG..."

# Favicon sizes
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/apple-touch-icon.png" --export-width=180 --export-height=180
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/favicon-144x144.png" --export-width=144 --export-height=144
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/favicon-16x16.png" --export-width=16 --export-height=16
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/favicon-32x32.png" --export-width=32 --export-height=32
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/favicon-48x48.png" --export-width=48 --export-height=48
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/favicon-96x96.png" --export-width=96 --export-height=96
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/favicon.png" --export-width=48 --export-height=48
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/icon-192.png" --export-width=192 --export-height=192
inkscape "$FAVICON_SVG" --export-type=png --export-filename="$PUBLIC_DIR/icon-512.png" --export-width=512 --export-height=512

echo "🖼️ Generating OG image from $OG_SVG..."

# OG Image size
inkscape "$OG_SVG" --export-type=png --export-filename="$PUBLIC_DIR/og-image.png" --export-width=1200 --export-height=630

# Next.js App Router auto-icons
inkscape "$FAVICON_SVG" --export-type=png --export-filename="src/app/icon.png" --export-width=512 --export-height=512

echo "✅ Done! All assets generated in $PUBLIC_DIR and src/app/"
