# Image Processing Integration

This workstream provides browser-compatible pixel utilities under `src/image`.
It does not own UI rendering, level generation, runtime movement, or app shell code.

Generation workstreams should call `evaluateImageFairness(image, { ringCount })`
before accepting candidate images. The input is an `RgbaImage` with raw RGBA
pixels. Browser adapters can obtain this shape from `ImageData` and pass it
directly because both use width, height, and `Uint8ClampedArray` RGBA data.

Renderer workstreams should consume `balancedRingRadii` and
`createRingMaskMetadata` for annulus metadata. Per-frame drawing should still
use canvas clipping and transforms rather than pre-rotated bitmap slices.

The current fairness thresholds are preliminary V1 constants exported as
`IMAGE_QUALITY_DEFAULTS` and should be tuned during fixture expansion and
playtesting.
