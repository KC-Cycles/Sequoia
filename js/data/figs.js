// Figure poses. The drawing is 120 by 120, the floor is at y = 113 and an ankle on the floor sits at y = 110.
// a = start pose, b = finish pose (only the keys that change).
//   h  hip [x, y]            t  torso lean in degrees (0 upright, 90 flat and face down, -90 flat on the back)
//   f / fb   planted front / back foot [x, y]        l / lb   free leg as [thigh, shin] degrees
//   g / gb   planted front / back hand [x, y]        a / ab   free arm as [upper, fore] degrees
//   eb, ebb, kd  which way an elbow or knee bends for planted limbs (1 or -1)
// Angles: 0 up, 90 forward, 180 down, 270 back.

const STAND = { h: [56, 70], t: 0, f: [56, 110] };

export const FIGS = {
  squat: { a: { h: [56, 70], t: 3, f: [57, 110], a: [200, -10] }, b: { h: [45, 92], t: 36 }, props: [{ k: 'disc', at: 'sh', r: 7, dx: -6, dy: 1 }] },
  goblet: { a: { h: [56, 70], t: 2, f: [57, 110], a: [170, 40] }, b: { h: [45, 92], t: 30 }, props: [{ k: 'kb', hang: false }] },
  sumo: { a: { h: [56, 70], t: 0, f: [58, 110], a: [180, 180] }, b: { h: [49, 88], t: 22 }, props: [{ k: 'kb' }] },
  rdl: { a: { ...STAND, a: [180, 180] }, b: { h: [47, 72], t: 75 }, props: [{ k: 'db' }] },
  slrdl: { a: { ...STAND, lb: [180, 180], a: [180, 180] }, b: { h: [52, 71], t: 78, lb: [262, 262] }, props: [{ k: 'db' }] },
  trapdl: { a: { h: [44, 88], t: 45, f: [57, 110], a: [180, 180] }, b: { h: [56, 70], t: 0 }, props: [{ k: 'disc', at: 'haF', r: 7 }] },
  swing: { a: { h: [46, 76], t: 68, f: [57, 110], a: [205, 205] }, b: { h: [56, 70], t: 0, a: [96, 96] }, props: [{ k: 'kb' }] },
  stepup: { a: { h: [54, 71], t: 10, f: [68, 94], fb: [52, 110], a: [180, 180] }, b: { h: [68, 54], t: 0, fb: [64, 93.5] }, props: [{ k: 'box', x: 62, y: 94, w: 30 }, { k: 'db' }] },
  revlunge: { a: { h: [56, 70], t: 0, f: [58, 110], fb: [54, 110], a: [170, 40] }, b: { h: [48, 87], t: 8, fb: [27, 110] }, props: [{ k: 'kb', hang: false }] },
  hipthrust: { a: { h: [50, 103], t: -55, f: [72, 110], a: [125, 125] }, b: { h: [54, 89], t: -90, a: [92, 92] }, props: [{ k: 'bench', x: 8, y: 90, w: 24 }, { k: 'disc', at: 'haF', r: 4.5 }] },
  curl: { a: { h: [52, 80], t: 90, l: [270, 270], a: [90, 180] }, b: { l: [270, 20] }, props: [{ k: 'bench', x: 34, y: 84, w: 62 }, { k: 'pad', at: 'ftF' }] },
  carry: { a: { h: [56, 70.5], t: 0, f: [62, 110], fb: [50, 110], a: [180, 180] }, b: { f: [50, 110], fb: [62, 110] }, props: [{ k: 'kb' }] },
  press: { a: { ...STAND, a: [160, 5], ab: [180, 180] }, b: { a: [5, 0] }, props: [{ k: 'db' }] },
  hammer: { a: { ...STAND, a: [180, 180] }, b: { a: [172, 15] }, props: [{ k: 'db' }] },
  tri: { a: { ...STAND, a: [2, 2] }, b: { a: [8, -155] }, props: [{ k: 'db' }] },
  bench: { a: { h: [64, 84], t: -90, f: [80, 110], a: [120, 0] }, b: { a: [0, 0] }, props: [{ k: 'bench', x: 22, y: 88, w: 50 }, { k: 'db' }] },
  pushup: { a: { h: [49.7, 83.2], t: 48, f: [20, 110], g: [84, 86], eb: -1 }, b: { h: [53.9, 88.8], t: 58 }, props: [{ k: 'box', x: 80, y: 86, w: 24 }] },
  pullup: { a: { h: [59, 70], t: 0, g: [59, 17], eb: -1, l: [172, 192] }, b: { h: [56, 44] }, props: [{ k: 'bar', x: 59, y: 17 }] },
  ringrow: { a: { h: [51.8, 93.1], t: -65, f: [88, 110], g: [30, 56] }, b: { h: [57.4, 84.3], t: -50, g: [34, 58] }, props: [{ k: 'cable', from: [31, 3], to: 'haF' }] },
  row: { a: { h: [44, 74], t: 80, f: [50, 110], fb: [38, 110], gb: [80, 92], ebb: -1, a: [180, 180] }, b: { a: [285, 180] }, props: [{ k: 'box', x: 76, y: 92, w: 24 }, { k: 'db' }] },
  facepull: { a: { h: [50, 70.5], t: 0, f: [53, 110], fb: [46, 110], g: [75.5, 44] }, b: { g: [55, 37] }, props: [{ k: 'anchor', x: 112, y: 40 }, { k: 'cable', from: [112, 40], to: 'haF' }] },
  pulldown: { a: { h: [50, 70.5], t: 20, f: [54, 110], a: [42, 42] }, b: { a: [168, 168] }, props: [{ k: 'anchor', x: 108, y: 8 }, { k: 'cable', from: [108, 8], to: 'haF' }] },
  deadbug: { a: { h: [62, 104], t: -90, l: [0, 90], lb: [0, 90], a: [0, 0], ab: [0, 0] }, b: { lb: [80, 80], a: [-80, -80] } },
  sideplank: { a: { h: [57, 105.5], t: -72, f: [96, 110], a: [180, 90], ab: [101, 101] }, b: { h: [56.8, 102.2], t: -79 } },
  ytw: { a: { h: [48, 106], t: 90, l: [270, 270], a: [92, 92] }, b: { a: [62, 62] } },
  frontsquat: { a: { h: [56, 70], t: 2, f: [57, 110], a: [100, -30] }, b: { h: [47, 92], t: 22 }, props: [{ k: 'disc', at: 'sh', r: 7, dx: 5, dy: -1 }] },
  bulgarian: { a: { h: [53, 71], t: 5, f: [62, 110], fb: [30, 90], a: [180, 180] }, b: { h: [50, 88], t: 12 }, props: [{ k: 'bench', x: 10, y: 92, w: 26 }, { k: 'db' }] },
  kbdeadlift: { a: { h: [45, 86], t: 48, f: [57, 110], a: [180, 180] }, b: { h: [56, 70], t: 0 }, props: [{ k: 'kb' }] },
  cablerow: { a: { h: [46, 70.5], t: -6, f: [52, 110], fb: [42, 110], g: [68.5, 47], eb: -1 }, b: { g: [50, 52] }, props: [{ k: 'anchor', x: 112, y: 47 }, { k: 'cable', from: [112, 47], to: 'haF' }] },
  pushdown: { a: { h: [52, 70.5], t: 8, f: [55, 110], a: [175, 60] }, b: { a: [175, 172] }, props: [{ k: 'anchor', x: 78, y: 8 }, { k: 'cable', from: [78, 8], to: 'haF' }] },
  cablecurl: { a: { h: [50, 70.5], t: 0, f: [53, 110], a: [178, 170] }, b: { a: [176, 20] }, props: [{ k: 'anchor', x: 86, y: 107 }, { k: 'cable', from: [86, 107], to: 'haF' }] },
  kneeraise: { a: { h: [59, 70], t: 0, g: [59, 17], eb: -1, l: [178, 182] }, b: { l: [80, 170] }, props: [{ k: 'bar', x: 59, y: 17 }] },
  plank: { a: { h: [51.4, 101.4], t: 80.5, f: [12, 108], a: [180, 90] }, b: { h: [51.5, 100.9] } },
  // Swim drills: the swimmer faces right, just under the surface. The wavy line is the water.
  glide: { a: { h: [48, 52], t: 90, a: [90, 90], ab: [88, 88], l: [270, 270], lb: [272, 272] }, b: { h: [53, 52] }, props: [{ k: 'water', y: 46 }] },
  sidekick: { a: { h: [48, 52], t: 90, a: [90, 90], ab: [266, 266], l: [264, 274], lb: [276, 266] }, b: { l: [276, 266], lb: [264, 274] }, props: [{ k: 'water', y: 46 }] },
  sixkick: { a: { h: [48, 52], t: 90, a: [90, 90], ab: [270, 270], l: [264, 274], lb: [276, 266] }, b: { a: [268, 268], ab: [450, 450], l: [276, 266], lb: [264, 274] }, props: [{ k: 'water', y: 46 }] },
  catchup: { a: { h: [48, 52], t: 90, a: [90, 90], ab: [92, 92], l: [264, 274], lb: [276, 266] }, b: { a: [262, 266], l: [276, 266], lb: [264, 274] }, props: [{ k: 'water', y: 46 }] },
  fingertip: { a: { h: [48, 52], t: 90, a: [266, 266], ab: [90, 90], l: [264, 274], lb: [276, 266] }, b: { a: [330, 120], l: [276, 266], lb: [264, 274] }, props: [{ k: 'water', y: 46 }] },
  onearm: { a: { h: [48, 52], t: 90, a: [90, 90], ab: [92, 92], l: [264, 274], lb: [276, 266] }, b: { a: [190, 250], l: [276, 266], lb: [264, 274] }, props: [{ k: 'water', y: 46 }] },
  sight: { a: { h: [48, 52], t: 90, ht: 0, a: [90, 90], ab: [266, 266], l: [264, 274], lb: [276, 266] }, b: { ht: -40, a: [108, 100], l: [276, 266], lb: [264, 274] }, props: [{ k: 'water', y: 46 }] },
  bobs: { a: { h: [60, 74], t: 0, a: [185, 180], f: [57, 113], fb: [63, 113] }, b: { h: [60, 92] }, props: [{ k: 'water', y: 46 }] }
};
