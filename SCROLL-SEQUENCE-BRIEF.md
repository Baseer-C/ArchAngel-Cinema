# Scroll sequence implementation brief

These are the relevant steps from the supplied transcript, adapted for the existing ArchAngel Cinema footage.

1. Choose one strong opening frame that establishes the visual direction. Approve this before building the rest of the sequence because every later state inherits its composition and tone.
2. Use a coherent video sequence whose motion naturally develops from that opening frame. ArchAngel already has this asset, so no image or video generation is required.
3. Map the video timeline to normalized page scroll progress. A sticky viewport holds the scene while the surrounding section provides the scroll distance.
4. Smooth the requested progress before updating the media timeline. Render updates inside `requestAnimationFrame`, limit seek requests to useful frame intervals, and avoid a new expensive update for every raw scroll event.
5. Break the journey into a small number of narrative beats. Four beats are enough here: positioning, attention, proof, and response.
6. Keep transitions continuous. Do not hard-cut between unrelated scenes or layouts; expand the opening image into the full viewport and let the supplied footage carry the motion.
7. Layer functional copy and calls to action over the sequence. The spectacle must still lead to the free review and intro offer.
8. Use the supplied still image as a lightweight poster and loading fallback. Crossfade to the video only after the browser has decoded it.
9. Build a mobile-safe composition with controlled cropping, shorter scroll distance, readable type, and persistent access to the CTA.
10. Respect reduced-motion preferences by presenting the opening poster and primary CTA without scroll scrubbing.
11. Optimize for the real website: preload only the poster, keep the video payload modest, include a skip link, use semantic heading order, and avoid autoplay audio.
12. Test the beginning, every narrative threshold, the final frame, resize behavior, mobile layout, media loading, console errors, and the reduced-motion fallback.

The transcript's image/video generation, paid generation budget, Higgsfield setup, and multi-scene connector generation are intentionally omitted because the source video already exists.
