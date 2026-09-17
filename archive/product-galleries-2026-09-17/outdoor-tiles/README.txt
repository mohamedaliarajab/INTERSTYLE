OUTDOOR TILES — product gallery images
======================================

Save the images into this folder as 01.jpg .. 05.jpg:

  01.jpg   Garden terrace, large-format pavers laid into lawn with grass
           joints, linear gas fire table, timber outdoor sofa
  02.jpg   Outdoor shower and plunge pool, mosaic feature wall,
           large-format slabs with white gravel margins
  03.jpg   Terrace in light grey pavers with a patterned decor-tile inset,
           black wire loungers, dining set on grass
  04.jpg   Waterside terrace, cream pavers set in gravel joints,
           round fire bowl, built-in sofa
  05.jpg   Pool surround in light stone-effect pavers, loungers, parasol

FILENAMES DO NOT NEED TO BE EXACT. Save them under whatever names they
arrive with -- 1.png, photo-3.webp, 04.jpeg -- as long as each has a number
in it, then run:

    python3 tools/optimise-images.py assets/img/products/outdoor-tiles

That renames to the zero-padded 01.jpg .. 05.jpg the gallery expects,
converts to real JPEG, resizes to 1800px max and flattens transparency.

Any slot without a file shows an "Image awaiting upload" placeholder rather
than a broken image.
