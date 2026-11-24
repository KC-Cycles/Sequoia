// Session library. Starting weights are generic first guesses; the app replaces them with
// targets worked out from the log on the phone.

export const GROUPS = {
  squat: { label: 'Lower body, squat-led', short: 'Legs: squat', tone: 'lower',
    about: 'Squat days bend mostly at the knee, so your quads and glutes do the work. They build the strength you push the pedals and climb with.',
    when: 'Your legs are fresh and your last leg day was a hinge day.' },
  hinge: { label: 'Lower body, hinge-led', short: 'Legs: hinge', tone: 'lower',
    about: 'Hinge days bend mostly at the hip, so your glutes and hamstrings do the work. They balance the squat days and protect your back.',
    when: 'Your legs are fresh and your last leg day was a squat day.' },
  pull: { label: 'Upper pull and core', short: 'Upper: pull', tone: 'upper',
    about: 'Pulling trains your back and biceps: every muscle that draws your hands toward you. It powers your swim stroke and holds your shoulders back at a desk.',
    when: 'Your legs need a day off, or your last upper-body day was a push day.' },
  push: { label: 'Upper push and arms', short: 'Upper: push', tone: 'upper',
    about: 'Pushing trains your chest, shoulders and triceps: every muscle that presses away from you. It balances the pulling you do in the pool.',
    when: 'Your legs need a day off, or your last upper-body day was a pull day.' },
  whole: { label: 'Whole body', short: 'Whole body', tone: 'whole',
    about: 'One squat or hinge, one push, one pull and a carry. Every major muscle gets work in a single session.',
    when: 'You have had four or more days off, or you will only lift twice this week.' },
  tone: { label: 'Toning circuits', short: 'Circuit', tone: 'light',
    about: 'Lighter weights, more reps, slower lowering and short rests. Circuits build muscular endurance and some definition without heavy loading.',
    when: 'You want to move and sweat without going heavy, usually as a third or fourth session in a week.' },
  pair: { label: 'Double days', short: 'Double day', tone: 'light',
    about: 'Thirty-minute sessions built to share a day with a swim, a run or a ride. Each one trains what the other workout leaves alone.',
    when: 'You are also swimming, running or riding today and still want to lift.' },
  thirty: { label: 'Thirty-minute strength', short: '30 min', tone: 'whole',
    about: 'A main lift and two quick supersets in half an hour. Each one is the short version of a squat, hinge, pull or push day and counts as that day in your rotation.',
    when: 'You want real strength work and only have thirty minutes.' },
  run: { label: 'Runs', short: 'Run', tone: 'lower',
    about: 'Guided runs with a timer that pings at halfway and at the end. Most are easy on purpose: easy running builds the engine, and a little speed keeps your legs quick.',
    when: 'It is a run day. Your watch and Strava keep the record; these tell you how long to go and how hard.' },
  bike: { label: 'Rides', short: 'Ride', tone: 'lower',
    about: 'Guided rides with a timer that pings at every change of effort. One easy, one long, and three that each build a different kind of speed.',
    when: 'It is a ride day and you want it to have a purpose. Use a quiet road, a path loop or an indoor trainer for the hard parts.' },
  swim: { label: 'Swims', short: 'Swim', tone: 'upper',
    about: 'Technique-first pool sessions that rebuild your freestyle from breathing and balance upward, with every drill explained step by step.',
    when: 'It is a swim day. Do them in order, and repeat one until it feels easy before moving on.' },
  mobility: { label: 'Mobility and core', short: 'Mobility', tone: 'light',
    about: 'Two timed mobility flows you can follow hands-free, and one session of nothing but core work.',
    when: 'You feel stiff, you have fifteen minutes, or the Coach page says your core needs sets.' },
  short: { label: 'Short and recovery', short: 'Short', tone: 'light',
    about: 'Twenty-five minutes. One is a compact strength session, the other is mobility and core with almost no load.',
    when: 'You are short on time, or you feel beat up and want to move anyway.' }
};

const walk = (rx = '5:00', sec = 300) => ({ id: 'walk', name: 'Fast walk', rx, sets: 1, timer: sec, note: 'Brisk enough that talking takes a little effort. On a treadmill, set the incline to 3 to 5 percent.' });
const stairs = { id: 'stairs', name: 'Stair climber', rx: '5:00', sets: 1, timer: 300, note: 'Steady pace, hands light on the rails. A fast walk works if the machine is taken.' };
const rower = { id: 'rower', name: 'Rowing machine', rx: '5:00', sets: 1, timer: 300, note: 'Easy pace. Push with your legs first, then lean back, then pull.' };
const bwsquat = { id: 'bwsquat', name: 'Bodyweight squat', rx: '10', sets: 1, note: 'Pause for two seconds at the bottom of each rep and push your knees out over your toes.' };
const bridge = { id: 'bridge', name: 'Glute bridge', rx: '12', sets: 1, note: 'Feet flat, ribs down. Squeeze for one second at the top.' };
const openbook = { id: 'openbook', name: 'Open book rotation', rx: '6 / side', sets: 1, note: 'Lie on your side with knees bent and stacked. Sweep the top arm open across your chest and follow it with your eyes.' };
const hinge = { id: 'hinge', name: 'Hip hinge drill', rx: '10', sets: 1, note: 'Hands on your hips, soft knees. Push your hips back until your hamstrings pull tight, then stand tall.' };
const rope = (sets) => ({ id: 'rope', name: 'Battle rope waves', rx: sets + ' x 20 sec', sets, timer: 20, note: 'Quarter squat, tall chest, fast alternating waves. Rest 40 seconds between efforts.' });

export const SESSIONS = [
  {
    id: 'legs-arms', group: 'squat', lean: 'lower', strength: true, minutes: 46,
    title: 'Squat day, plus arms',
    sub: 'A back squat, two leg supersets, an arm circuit and a quick finisher.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm, open your hips, then rehearse the squat with a light bar.', cheer: 'Warm and ready. The bar is waiting.',
        items: [walk(), bwsquat, bridge,
          { id: 'wgs', name: 'World\'s greatest stretch', rx: '4 / side', sets: 1, note: 'Long lunge, both hands inside the front foot, then rotate and reach the inside arm to the ceiling.' },
          { id: 'ramp', name: 'Ramp-up squats', rx: '2 sets', sets: 2, note: 'Empty bar for 8, then about three quarters of your working weight for 5. Practice reps, not work.' }] },
      { tag: 'A', name: 'Back squat', kind: 'Main lift · rest 90 sec', min: 9, rest: 90, how: 'Three working sets. Rest the full 90 seconds so every set is as good as the first.', cheer: 'Heavy part is behind you. Nice work.',
        items: [{ ex: 'squat', lab: 'A', sets: 3, reps: 8, start: 65, note: 'Reps 7 and 8 should be slow but clean.' }] },
      { tag: 'B', name: 'Hinge and step', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Hamstrings located. Two blocks of legs down.',
        items: [{ ex: 'rdl', lab: 'B1', sets: 3, reps: 10, start: 20, note: 'Your grip should notice by rep 10.' },
          { ex: 'stepup', lab: 'B2', sets: 3, reps: 8, per: 'side', start: 10, note: 'All 8 on one leg, then switch. Lower on a true count of three.' }] },
      { tag: 'C', name: 'Curl and sumo', kind: 'Superset · 3 rounds · rest 60 sec', min: 8, rest: 60, how: 'Do C1, walk to your kettlebell for C2, then rest 60 seconds.', cheer: 'Legs are done. Arms are next.',
        items: [{ ex: 'curl', lab: 'C1', sets: 3, reps: 12, start: 50, note: 'Hold the top for a full second on every rep.' },
          { ex: 'sumo', lab: 'C2', sets: 3, reps: 12, start: 25, note: 'Three seconds down on every rep.' }] },
      { tag: 'D', name: 'Arm circuit', kind: 'Tri-set · 3 rounds · rest 45 sec', min: 8, rest: 45, how: 'D1, D2, D3 back to back, then rest 45 seconds.', cheer: 'Sleeves optional from here.',
        items: [{ ex: 'press', lab: 'D1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Standing, one arm at a time.' },
          { ex: 'hammer', lab: 'D2', sets: 3, reps: 12, start: 10, note: 'Palms face each other the whole time.' },
          { ex: 'tri', lab: 'D3', sets: 3, reps: 12, start: 15, note: 'One dumbbell held in both hands.' }] },
      { tag: 'E', name: 'Finisher', kind: '2 sets · rest 30 sec', min: 3, rest: 30, how: 'Two quick sets to empty the tank. Short on time? Skip this block.', cheer: 'Finisher finished.',
        items: [{ ex: 'swing', lab: 'E', sets: 2, reps: 15, start: 25, note: 'Hips do the work. Your arms just hold on.' }] }
    ]
  },
  {
    id: 'trap-bar', group: 'hinge', lean: 'lower', strength: true, minutes: 45,
    title: 'Heavy things, picked up',
    sub: 'Trap-bar deadlift, then glutes, hamstrings and single-leg balance.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm, then rehearse the hinge before you load it.', cheer: 'Warm and ready. Time to pick things up.',
        items: [stairs, hinge, bridge,
          { id: 'rampdl', name: 'Ramp-up deadlifts', rx: '2 sets', sets: 2, note: 'Empty trap bar for 6, then about three quarters of your working weight for 3.' }] },
      { tag: 'A', name: 'Trap-bar deadlift', kind: 'Main lift · rest 2 min', min: 12, rest: 120, how: 'Four sets of five. Reset your position before every single rep and take the full two minutes.', cheer: 'That is the heaviest lifting of your week. Done.',
        items: [{ ex: 'trapdl', lab: 'A', sets: 4, reps: 5, start: 85, note: 'An empty trap bar weighs 45 to 60 lb. The last rep should be hard but never ugly.' }] },
      { tag: 'B', name: 'Thrust and curl', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Glutes and hamstrings, both spoken for.',
        items: [{ ex: 'hipthrust', lab: 'B1', sets: 3, reps: 10, start: 30, note: 'One-second squeeze at the top of every rep.' },
          { ex: 'curl', lab: 'B2', sets: 3, reps: 12, start: 50, note: 'Three seconds down.' }] },
      { tag: 'C', name: 'Balance and carry', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1 on both legs, then carry for C2, then rest 60 seconds.', cheer: 'Steady on one leg, steady under load.',
        items: [{ ex: 'slrdl', lab: 'C1', sets: 3, reps: 8, per: 'side', start: 15, note: 'Slow and square. Use a fingertip on the rack if you wobble.' },
          { ex: 'carry', lab: 'C2', sets: 3, reps: 20, per: 'steps / side', start: 25, note: 'Heavy enough that standing straight takes effort.' }] },
      { tag: 'D', name: 'Finisher', kind: '3 sets · rest 30 sec', min: 4, rest: 30, how: 'Three fast sets. Crisp hips, tall finish.', cheer: 'Finisher finished.',
        items: [{ ex: 'swing', lab: 'D', sets: 3, reps: 12, start: 25, note: 'Snap your hips. The bell floats to chest height.' }] }
    ]
  },
  {
    id: 'pull-core', group: 'pull', lean: 'upper', strength: true, minutes: 45,
    title: 'Pull day, with a side of core',
    sub: 'Pull-up practice, rows, cable work for swim shoulders, and a core circuit.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm and wake up your shoulder blades before you hang from anything.', cheer: 'Shoulders awake. To the bar.',
        items: [rower, openbook,
          { id: 'hang', name: 'Dead hang', rx: '2 x 15 sec', sets: 2, timer: 15, note: 'Hang from the pull-up bar with long arms and relaxed legs.' },
          { id: 'scap', name: 'Shoulder-blade pull', rx: '8', sets: 1, note: 'From a hang, pull your shoulders down away from your ears without bending your elbows.' }] },
      { tag: 'A', name: 'Pull-up practice', kind: 'Main lift · rest 90 sec', min: 9, rest: 90, how: 'Four sets of four slow lowers. Quality over quantity.', cheer: 'Every slow lower is a deposit toward a full pull-up.',
        items: [{ ex: 'pullup', lab: 'A', sets: 4, reps: 4, note: 'Five seconds down on each. Log how many you controlled.' }] },
      { tag: 'B', name: 'Row and face pull', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1 on both arms, go straight to B2, then rest 60 seconds.', cheer: 'Lats and rear shoulders, done.',
        items: [{ ex: 'row', lab: 'B1', sets: 3, reps: 10, per: 'side', start: 20, note: 'Elbow to your back pocket. Pause at the top.' },
          { ex: 'facepull', lab: 'B2', sets: 3, reps: 15, start: 15, note: 'Light and strict. Elbows high.' }] },
      { tag: 'C', name: 'Rings and pulldown', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do C1, go straight to C2, then rest 60 seconds.', cheer: 'That is the pulling. Core circuit left.',
        items: [{ ex: 'ringrow', lab: 'C1', sets: 3, reps: 8, note: 'Walk your feet forward to make it harder.' },
          { ex: 'pulldown', lab: 'C2', sets: 3, reps: 12, start: 20, note: 'Straight arms, slow return.' }] },
      { tag: 'D', name: 'Shoulders and core', kind: 'Tri-set · 2 rounds · rest 30 sec', min: 8, rest: 30, how: 'D1, D2, D3 back to back on the floor, then rest 30 seconds.', cheer: 'Posture muscles, switched on.',
        items: [{ ex: 'ytw', lab: 'D1', sets: 2, reps: 6, per: 'each letter', start: 0, note: 'No weight to start.' },
          { ex: 'deadbug', lab: 'D2', sets: 2, reps: 8, per: 'side', note: 'Slow and quiet. Lower back stays down.' },
          { ex: 'sideplank', lab: 'D3', sets: 2, reps: 20, per: 'sec / side', note: 'Hold for a slow count of 20 on each side.' }] }
    ]
  },
  {
    id: 'press-arms', group: 'push', lean: 'upper', strength: true, minutes: 45,
    title: 'Press on',
    sub: 'Single-arm overhead press, bench and push-ups, then arms and a carry.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and loosen your upper back so your arms can go fully overhead.', cheer: 'Shoulders ready. Press on.',
        items: [rower, openbook,
          { id: 'easypush', name: 'Easy incline push-ups', rx: '8', sets: 1, note: 'Hands on a tall box. Smooth reps to warm your elbows and shoulders.' },
          { id: 'ramppress', name: 'Ramp-up press', rx: '1 set', sets: 1, note: 'Six reps a side with about half your working weight.' }] },
      { tag: 'A', name: 'Overhead press', kind: 'Main lift · rest 75 sec', min: 10, rest: 75, how: 'Four sets of six on each arm. Rest after both arms are done.', cheer: 'Overhead strength, built one arm at a time.',
        items: [{ ex: 'press', lab: 'A', sets: 4, reps: 6, per: 'side', start: 12.5, note: 'Heavier than your 8-rep weight. Rep 6 should be a grind with a tall, still torso.' }] },
      { tag: 'B', name: 'Bench and push-up', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Chest and triceps, checked off.',
        items: [{ ex: 'bench', lab: 'B1', sets: 3, reps: 10, start: 15, note: 'Two to three seconds down on every rep.' },
          { ex: 'pushup', lab: 'B2', sets: 3, reps: 8, note: 'Pick a box height where rep 8 is hard and your body stays one line.' }] },
      { tag: 'C', name: 'Arms', kind: 'Superset · 3 rounds · rest 45 sec', min: 8, rest: 45, how: 'Do C1, go straight to C2, then rest 45 seconds.', cheer: 'Sleeves optional from here.',
        items: [{ ex: 'hammer', lab: 'C1', sets: 3, reps: 12, start: 10, note: 'Elbows pinned. Slow on the way down.' },
          { ex: 'tri', lab: 'C2', sets: 3, reps: 12, start: 15, note: 'Deep stretch at the bottom of every rep.' }] },
      { tag: 'D', name: 'Carry', kind: '3 sets · rest 45 sec', min: 7, rest: 45, how: 'One heavy bell, walked slowly. Switch hands at the turn.', cheer: 'Grip and trunk, both tested.',
        items: [{ ex: 'carry', lab: 'D', sets: 3, reps: 20, per: 'steps / side', start: 25, note: 'Shoulders level. Do not lean away from the weight.' }] },
      { tag: 'E', name: 'Finisher', kind: '3 efforts', min: 3, rest: 0, how: 'Three hard 20-second efforts on the rope.', cheer: 'Finisher finished.', items: [rope(3)] }
    ]
  },
  {
    id: 'whole-a', group: 'whole', lean: 'whole', strength: true, minutes: 47,
    title: 'The whole tree',
    sub: 'A heavy squat, a push and a pull, a hinge, then shoulders and a carry.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm, open your hips and upper back, then rehearse the squat.', cheer: 'Warm from roots to branches.',
        items: [walk(), bwsquat, openbook,
          { id: 'ramp', name: 'Ramp-up squats', rx: '2 sets', sets: 2, note: 'Empty bar for 8, then about three quarters of your working weight for 4.' }] },
      { tag: 'A', name: 'Back squat', kind: 'Main lift · rest 2 min', min: 10, rest: 120, how: 'Three sets of six, heavier than your 8-rep weight. Take the full two minutes.', cheer: 'Heavy squats, done.',
        items: [{ ex: 'squat', lab: 'A', sets: 3, reps: 6, start: 70, note: 'About 5 to 10 lb more than you use for sets of 8.' }] },
      { tag: 'B', name: 'Push and pull', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Front and back, balanced.',
        items: [{ ex: 'bench', lab: 'B1', sets: 3, reps: 8, start: 15, note: 'Heavier than your 10-rep weight.' },
          { ex: 'ringrow', lab: 'B2', sets: 3, reps: 10, note: 'Chest to the rings on every rep.' }] },
      { tag: 'C', name: 'Hinge and brace', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1, go straight to C2, then rest 60 seconds.', cheer: 'Back of the legs, and the trunk that holds it all up.',
        items: [{ ex: 'rdl', lab: 'C1', sets: 3, reps: 10, start: 20, note: 'Hips back, dumbbells close to your legs.' },
          { ex: 'deadbug', lab: 'C2', sets: 3, reps: 8, per: 'side', note: 'Exhale fully on every reach.' }] },
      { tag: 'D', name: 'Shoulders and carry', kind: 'Superset · 2 rounds · rest 45 sec', min: 6, rest: 45, how: 'Do D1, then carry for D2, then rest 45 seconds.', cheer: 'Small muscles, big payoff.',
        items: [{ ex: 'facepull', lab: 'D1', sets: 2, reps: 15, start: 15, note: 'Light and strict.' },
          { ex: 'carry', lab: 'D2', sets: 2, reps: 20, per: 'steps / side', start: 25, note: 'Slow steps, level shoulders.' }] },
      { tag: 'E', name: 'Finisher', kind: '4 efforts', min: 3, rest: 0, how: 'Four hard 20-second efforts on the rope.', cheer: 'Finisher finished.', items: [rope(4)] }
    ]
  },
  {
    id: 'kettlebell', group: 'whole', lean: 'whole', strength: true, minutes: 45,
    title: 'One bell, whole body',
    sub: 'Everything with kettlebells: squat, swing, row, lunge, press and carry.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm, rehearse the hinge, and loosen your shoulders with a light bell.', cheer: 'Warm. Grab your bell.',
        items: [stairs, hinge,
          { id: 'halo', name: 'Kettlebell halo', rx: '5 each way', sets: 1, note: 'Hold a light bell upside down by the horns and circle it slowly around your head.' }] },
      { tag: 'A', name: 'Goblet squat', kind: 'Main lift · rest 75 sec', min: 11, rest: 75, how: 'Four sets of eight with the heaviest bell you can keep tight to your chest.', cheer: 'Squats done. The fun part is next.',
        items: [{ ex: 'goblet', lab: 'A', sets: 4, reps: 8, start: 25, note: 'Three seconds down, strong drive up.' }] },
      { tag: 'B', name: 'Swing and row', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Hips and lats, both fired.',
        items: [{ ex: 'swing', lab: 'B1', sets: 3, reps: 15, start: 25, note: 'Snap your hips. Plank at the top.' },
          { ex: 'row', lab: 'B2', sets: 3, reps: 10, per: 'side', start: 20, note: 'Row the kettlebell with a hand on a box.' }] },
      { tag: 'C', name: 'Lunge and press', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1 on both legs, then C2 on both arms, then rest 60 seconds.', cheer: 'Legs and shoulders, one side at a time.',
        items: [{ ex: 'revlunge', lab: 'C1', sets: 3, reps: 8, per: 'side', start: 15, note: 'Bell at your chest. Back knee hovers above the floor.' },
          { ex: 'press', lab: 'C2', sets: 3, reps: 8, per: 'side', start: 10, note: 'Kettlebell resting on the back of your forearm, wrist straight.' }] },
      { tag: 'D', name: 'Carry', kind: '3 sets · rest 45 sec', min: 7, rest: 45, how: 'Your heaviest bell, walked slowly. Switch hands at the turn.', cheer: 'One bell, whole body, done.',
        items: [{ ex: 'carry', lab: 'D', sets: 3, reps: 20, per: 'steps / side', start: 25, note: 'Shoulders level, slow steps.' }] }
    ]
  },
  {
    id: 'tone-lower', group: 'tone', lean: 'lower', strength: false, minutes: 45,
    title: 'Slow burn: legs',
    sub: 'A five-move leg circuit at higher reps and slower tempo, then core.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and wake up your hips.', cheer: 'Warm. Settle in for the circuit.',
        items: [walk(), bwsquat, bridge] },
      { tag: 'A', name: 'Leg circuit', kind: 'Circuit · 3 rounds · rest 75 sec', min: 27, rest: 75, how: 'Five moves back to back with lighter weights and slow lowering. Rest 75 seconds after the fifth.', cheer: 'Three rounds of that is real work. Well done.',
        items: [{ ex: 'goblet', lab: 'A1', sets: 3, reps: 15, start: 20, note: 'Three seconds down on every rep.' },
          { ex: 'revlunge', lab: 'A2', sets: 3, reps: 12, per: 'side', start: 10, note: 'Light bell, smooth rhythm.' },
          { ex: 'hipthrust', lab: 'A3', sets: 3, reps: 15, start: 20, note: 'Two-second squeeze at the top.' },
          { ex: 'stepup', lab: 'A4', sets: 3, reps: 12, per: 'side', start: 5, note: 'Slow on the way down.' },
          { ex: 'curl', lab: 'A5', sets: 3, reps: 15, start: 40, note: 'No swinging. Full range.' }] },
      { tag: 'B', name: 'Core', kind: 'Superset · 2 rounds · rest 30 sec', min: 8, rest: 30, how: 'Do B1, go straight to B2, then rest 30 seconds.', cheer: 'Trunk work, done.',
        items: [{ ex: 'sideplank', lab: 'B1', sets: 2, reps: 25, per: 'sec / side', note: 'One straight line from head to heels.' },
          { ex: 'deadbug', lab: 'B2', sets: 2, reps: 10, per: 'side', note: 'Slow reaches, steady breathing.' }] },
      { tag: 'C', name: 'Finisher', kind: '3 minutes', min: 3, rest: 0, how: 'Three steady minutes on the stair climber to flush your legs.', cheer: 'Slow burn, complete.',
        items: [{ id: 'stairs3', name: 'Stair climber', rx: '3:00', sets: 1, timer: 180, note: 'Steady, not a sprint.' }] }
    ]
  },
  {
    id: 'express', group: 'short', lean: 'whole', strength: false, minutes: 25,
    title: 'Twenty-five and out',
    sub: 'One heavy lift, one push and pull superset, one carry. For the tight days.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Three brisk minutes and a rehearsal of the hinge.', cheer: 'Warm enough. Go.',
        items: [walk('3:00', 180), hinge,
          { id: 'rampdl', name: 'Ramp-up deadlift', rx: '1 set', sets: 1, note: 'Five reps with about two thirds of your working weight.' }] },
      { tag: 'A', name: 'Trap-bar deadlift', kind: 'Main lift · rest 90 sec', min: 9, rest: 90, how: 'Three sets of five. Reset before every rep.', cheer: 'The big lift is in the bank.',
        items: [{ ex: 'trapdl', lab: 'A', sets: 3, reps: 5, start: 85, note: 'Same weight as your full deadlift day.' }] },
      { tag: 'B', name: 'Push and pull', kind: 'Superset · 3 rounds · rest 45 sec', min: 8, rest: 45, how: 'Do B1, go straight to B2, then rest 45 seconds.', cheer: 'Front and back, done.',
        items: [{ ex: 'pushup', lab: 'B1', sets: 3, reps: 8, note: 'Hands on a box, body in one line.' },
          { ex: 'ringrow', lab: 'B2', sets: 3, reps: 8, note: 'Chest to the rings.' }] },
      { tag: 'C', name: 'Carry', kind: '2 sets · rest 30 sec', min: 4, rest: 30, how: 'Two heavy carries and you are out the door.', cheer: 'Twenty-five and out.',
        items: [{ ex: 'carry', lab: 'C', sets: 2, reps: 20, per: 'steps / side', start: 25, note: 'Tall and slow.' }] }
    ]
  }  ,
  {
    id: 'front-squat', group: 'squat', lean: 'lower', strength: true, minutes: 43,
    title: 'Front and center',
    sub: 'Front squat, split squats, hamstring curls and a plank.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm, open your hips, and practice holding the bar on the front of your shoulders.', cheer: 'Warm and ready. Elbows up.',
        items: [walk(), bwsquat, openbook,
          { id: 'rampfs', name: 'Ramp-up front squats', rx: '2 sets', sets: 2, note: 'Empty bar for 6, then about three quarters of your working weight for 4.' }] },
      { tag: 'A', name: 'Front squat', kind: 'Main lift · rest 2 min', min: 12, rest: 120, how: 'Four sets of six. The bar sits on your shoulders, not in your hands.', cheer: 'Front squats done. Your quads will remember this.',
        items: [{ ex: 'frontsquat', lab: 'A', sets: 4, reps: 6, start: 45, note: 'Start with the empty bar if this is new. Lighter than your back squat is normal.' }] },
      { tag: 'B', name: 'Split squat and curl', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1 on both legs, go straight to B2, then rest 60 seconds.', cheer: 'Front and back of the legs, both done.',
        items: [{ ex: 'bulgarian', lab: 'B1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Bodyweight is fine for round one.' },
          { ex: 'curl', lab: 'B2', sets: 3, reps: 12, start: 50, note: 'Pause at the top.' }] },
      { tag: 'C', name: 'Step and brace', kind: 'Superset · 3 rounds · rest 45 sec', min: 10, rest: 45, how: 'Do C1 on both legs, hold C2, then rest 45 seconds.', cheer: 'Legs and trunk, finished.',
        items: [{ ex: 'stepup', lab: 'C1', sets: 3, reps: 10, per: 'side', start: 10, note: 'Slow on the way down.' },
          { ex: 'plank', lab: 'C2', sets: 3, reps: 30, per: 'sec', note: 'Stop when your hips sag.' }] },
      { tag: 'D', name: 'Finisher', kind: '3 minutes', min: 3, rest: 0, how: 'Three steady minutes on the stair climber.', cheer: 'Finisher finished.',
        items: [{ id: 'stairs3', name: 'Stair climber', rx: '3:00', sets: 1, timer: 180, note: 'Steady, not a sprint.' }] }
    ]
  },
  {
    id: 'pause-squat', group: 'squat', lean: 'lower', strength: true, minutes: 45,
    title: 'Pause for effect',
    sub: 'Squats with a two-second stop at the bottom, then glutes, balance and a carry.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm and rehearse the bottom position you are about to sit in.', cheer: 'Warm and ready.',
        items: [walk(), bwsquat, bridge,
          { id: 'ramp', name: 'Ramp-up squats', rx: '2 sets', sets: 2, note: 'Empty bar for 8 with a pause on each, then about three quarters of your working weight for 3.' }] },
      { tag: 'A', name: 'Pause squat', kind: 'Main lift · rest 2 min', min: 12, rest: 120, how: 'Four sets of five. Stop dead at the bottom for a count of two on every rep.', cheer: 'The pause is the hard part, and it is done.',
        items: [{ ex: 'pausesquat', lab: 'A', sets: 4, reps: 5, start: 55, note: 'Use about 10 lb less than your regular squat. The pause makes it heavier than it looks.' }] },
      { tag: 'B', name: 'Sumo and balance', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, then B2 on both legs, then rest 60 seconds.', cheer: 'Inner thighs and hamstrings, done.',
        items: [{ ex: 'sumo', lab: 'B1', sets: 3, reps: 12, start: 25, note: 'Three seconds down.' },
          { ex: 'slrdl', lab: 'B2', sets: 3, reps: 8, per: 'side', start: 15, note: 'Hips square to the floor.' }] },
      { tag: 'C', name: 'Thrust and raise', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1, go straight to the bar for C2, then rest 60 seconds.', cheer: 'Glutes and abs, both worked.',
        items: [{ ex: 'hipthrust', lab: 'C1', sets: 3, reps: 12, start: 30, note: 'Squeeze for one second at the top.' },
          { ex: 'kneeraise', lab: 'C2', sets: 3, reps: 8, note: 'No swinging.' }] },
      { tag: 'D', name: 'Carry', kind: '3 sets · rest 45 sec', min: 5, rest: 45, how: 'Two heavy bells, walked slowly.', cheer: 'Carried it all. Done.',
        items: [{ ex: 'farmer', lab: 'D', sets: 3, reps: 30, per: 'steps', start: 25, note: 'Shoulders back, weights still.' }] }
    ]
  },
  {
    id: 'single-leg', group: 'squat', lean: 'lower', strength: true, minutes: 45,
    title: 'One leg at a time',
    sub: 'Four single-leg moves that build the balance and hip control running asks for.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm and wake up your hips and ankles.', cheer: 'Warm and steady.',
        items: [stairs, bwsquat, bridge,
          { id: 'wgs', name: 'World\'s greatest stretch', rx: '4 / side', sets: 1, note: 'Long lunge, both hands inside the front foot, then rotate and reach the inside arm to the ceiling.' }] },
      { tag: 'A', name: 'Split squat', kind: 'Main lift · rest 90 sec', min: 12, rest: 90, how: 'Four sets of eight on each leg. Rest after both legs are done.', cheer: 'The hardest block is behind you.',
        items: [{ ex: 'bulgarian', lab: 'A', sets: 4, reps: 8, per: 'side', start: 10, note: 'Heavier than you use in a superset. The last two reps should be slow.' }] },
      { tag: 'B', name: 'Step and hinge', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1 on both legs, then B2 on both legs, then rest 60 seconds.', cheer: 'Glutes and hamstrings, one side at a time.',
        items: [{ ex: 'stepup', lab: 'B1', sets: 3, reps: 10, per: 'side', start: 10, note: 'Stand all the way up on the box.' },
          { ex: 'slrdl', lab: 'B2', sets: 3, reps: 8, per: 'side', start: 15, note: 'Slow and square.' }] },
      { tag: 'C', name: 'Lunge and side plank', kind: 'Superset · 3 rounds · rest 45 sec', min: 10, rest: 45, how: 'Do C1 on both legs, hold C2 on both sides, then rest 45 seconds.', cheer: 'Hips steady in every direction.',
        items: [{ ex: 'revlunge', lab: 'C1', sets: 3, reps: 8, per: 'side', start: 15, note: 'Back knee hovers above the floor.' },
          { ex: 'sideplank', lab: 'C2', sets: 3, reps: 20, per: 'sec / side', note: 'One straight line.' }] },
      { tag: 'D', name: 'Curl', kind: '3 sets · rest 45 sec', min: 5, rest: 45, how: 'Three sets to finish your hamstrings.', cheer: 'One leg at a time, all done.',
        items: [{ ex: 'curl', lab: 'D', sets: 3, reps: 12, start: 50, note: 'Three seconds down.' }] }
    ]
  },
  {
    id: 'rdl-thrust', group: 'hinge', lean: 'lower', strength: true, minutes: 43,
    title: 'Hinge and squeeze',
    sub: 'Heavy Romanian deadlifts, hip thrusts, curls and swings.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm and rehearse pushing your hips back.', cheer: 'Hips warm. Time to hinge.',
        items: [walk(), hinge, bridge,
          { id: 'ramprdl', name: 'Ramp-up Romanian deadlifts', rx: '1 set', sets: 1, note: 'Eight reps with about half your working weight.' }] },
      { tag: 'A', name: 'Romanian deadlift', kind: 'Main lift · rest 90 sec', min: 11, rest: 90, how: 'Four sets of eight, heavier than you use in a superset.', cheer: 'Hamstrings loaded and done.',
        items: [{ ex: 'rdl', lab: 'A', sets: 4, reps: 8, start: 25, note: 'One dumbbell size up from your 10-rep weight. Three seconds down.' }] },
      { tag: 'B', name: 'Thrust and plank', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, hold B2, then rest 60 seconds.', cheer: 'Glutes and trunk, both done.',
        items: [{ ex: 'hipthrust', lab: 'B1', sets: 3, reps: 10, start: 30, note: 'One-second squeeze at the top.' },
          { ex: 'plank', lab: 'B2', sets: 3, reps: 30, per: 'sec', note: 'Glutes tight the whole hold.' }] },
      { tag: 'C', name: 'Curl and step', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1, go straight to C2, then rest 60 seconds.', cheer: 'Back of the legs, finished.',
        items: [{ ex: 'curl', lab: 'C1', sets: 3, reps: 12, start: 50, note: 'Pause at the top.' },
          { ex: 'stepup', lab: 'C2', sets: 3, reps: 8, per: 'side', start: 10, note: 'Slow on the way down.' }] },
      { tag: 'D', name: 'Finisher', kind: '3 sets · rest 30 sec', min: 4, rest: 30, how: 'Three fast sets of swings.', cheer: 'Finisher finished.',
        items: [{ ex: 'swing', lab: 'D', sets: 3, reps: 12, start: 25, note: 'Snap your hips.' }] }
    ]
  },
  {
    id: 'kb-hinge', group: 'hinge', lean: 'lower', strength: true, minutes: 42,
    title: 'Bell work',
    sub: 'A kettlebell hinge day: deadlifts, swings, single-leg work and carries.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and rehearse the hinge with no weight.', cheer: 'Warm. Grab a bell.',
        items: [stairs, hinge, bridge] },
      { tag: 'A', name: 'Kettlebell deadlift', kind: 'Main lift · rest 75 sec', min: 10, rest: 75, how: 'Four sets of eight with the heaviest bell in the rack that you can lift with a flat back.', cheer: 'The hinge pattern, grooved.',
        items: [{ ex: 'kbdeadlift', lab: 'A', sets: 4, reps: 8, start: 45, note: 'Reset your back before every rep.' }] },
      { tag: 'B', name: 'Swing and balance', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, then B2 on both legs, then rest 60 seconds.', cheer: 'Power and balance, both trained.',
        items: [{ ex: 'swing', lab: 'B1', sets: 3, reps: 15, start: 25, note: 'Same hinge as the deadlift, done fast.' },
          { ex: 'slrdl', lab: 'B2', sets: 3, reps: 8, per: 'side', start: 15, note: 'Slow and square.' }] },
      { tag: 'C', name: 'Squat and carry', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1, then carry for C2, then rest 60 seconds.', cheer: 'Legs and grip, done.',
        items: [{ ex: 'goblet', lab: 'C1', sets: 3, reps: 10, start: 25, note: 'Chest tall.' },
          { ex: 'farmer', lab: 'C2', sets: 3, reps: 30, per: 'steps', start: 25, note: 'Two bells, slow steps.' }] },
      { tag: 'D', name: 'Core', kind: '3 sets · rest 30 sec', min: 5, rest: 30, how: 'Three sets from the pull-up bar.', cheer: 'Bell work, complete.',
        items: [{ ex: 'kneeraise', lab: 'D', sets: 3, reps: 8, note: 'No swinging.' }] }
    ]
  },
  {
    id: 'hamstring', group: 'hinge', lean: 'lower', strength: true, minutes: 44,
    title: 'Back of the legs',
    sub: 'A shorter deadlift block, then hamstrings and glutes from three angles.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm, then rehearse the hinge before you load it.', cheer: 'Warm and ready.',
        items: [rower, hinge, bridge,
          { id: 'rampdl', name: 'Ramp-up deadlifts', rx: '2 sets', sets: 2, note: 'Empty trap bar for 6, then about three quarters of your working weight for 3.' }] },
      { tag: 'A', name: 'Trap-bar deadlift', kind: 'Main lift · rest 2 min', min: 10, rest: 120, how: 'Three sets of six, a little lighter than your sets of five.', cheer: 'Deadlifts done.',
        items: [{ ex: 'trapdl', lab: 'A', sets: 3, reps: 6, start: 85, note: 'About 10 lb under your five-rep weight.' }] },
      { tag: 'B', name: 'Slow curl and thrust', kind: 'Superset · 4 rounds · rest 60 sec', min: 13, rest: 60, how: 'Do B1 with a four-second lower, go straight to B2, then rest 60 seconds.', cheer: 'Four rounds of that is a lot of hamstring. Well done.',
        items: [{ ex: 'curl', lab: 'B1', sets: 4, reps: 10, start: 45, note: 'Four seconds down on every rep. Use a little less weight than usual.' },
          { ex: 'hipthrust', lab: 'B2', sets: 4, reps: 10, start: 30, note: 'Squeeze at the top.' }] },
      { tag: 'C', name: 'Balance and side plank', kind: 'Superset · 3 rounds · rest 45 sec', min: 10, rest: 45, how: 'Do C1 on both legs, hold C2 on both sides, then rest 45 seconds.', cheer: 'Steady on one leg.',
        items: [{ ex: 'slrdl', lab: 'C1', sets: 3, reps: 8, per: 'side', start: 15, note: 'Reach the back leg long.' },
          { ex: 'sideplank', lab: 'C2', sets: 3, reps: 20, per: 'sec / side', note: 'Hips high.' }] },
      { tag: 'D', name: 'Finisher', kind: '2 sets · rest 30 sec', min: 3, rest: 30, how: 'Two fast sets of swings.', cheer: 'Finisher finished.',
        items: [{ ex: 'swing', lab: 'D', sets: 2, reps: 15, start: 25, note: 'Crisp hips.' }] }
    ]
  },
  {
    id: 'rows-three', group: 'pull', lean: 'upper', strength: true, minutes: 44,
    title: 'Rows three ways',
    sub: 'Dumbbell, cable and ring rows, plus biceps and core.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm and wake up your shoulder blades.', cheer: 'Shoulders awake.',
        items: [rower, openbook,
          { id: 'hang', name: 'Dead hang', rx: '2 x 15 sec', sets: 2, timer: 15, note: 'Hang from the pull-up bar with long arms and relaxed legs.' }] },
      { tag: 'A', name: 'Dumbbell row', kind: 'Main lift · rest 75 sec', min: 11, rest: 75, how: 'Four sets of eight on each arm, heavier than you use in a superset.', cheer: 'Heavy rows done.',
        items: [{ ex: 'row', lab: 'A', sets: 4, reps: 8, per: 'side', start: 25, note: 'Pause at the top of every rep.' }] },
      { tag: 'B', name: 'Cable row and face pull', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2 on the same machine, then rest 60 seconds.', cheer: 'Mid-back and rear shoulders, done.',
        items: [{ ex: 'cablerow', lab: 'B1', sets: 3, reps: 12, start: 30, note: 'Squeeze for one second.' },
          { ex: 'facepull', lab: 'B2', sets: 3, reps: 15, start: 15, note: 'Light and strict.' }] },
      { tag: 'C', name: 'Rings and curls', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do C1, go straight to C2, then rest 60 seconds.', cheer: 'Three kinds of rows, complete.',
        items: [{ ex: 'ringrow', lab: 'C1', sets: 3, reps: 8, note: 'Chest to the rings.' },
          { ex: 'cablecurl', lab: 'C2', sets: 3, reps: 12, start: 20, note: 'Three seconds down.' }] },
      { tag: 'D', name: 'Core', kind: 'Superset · 2 rounds · rest 30 sec', min: 6, rest: 30, how: 'Do D1, hold D2, then rest 30 seconds.', cheer: 'Trunk work, done.',
        items: [{ ex: 'deadbug', lab: 'D1', sets: 2, reps: 8, per: 'side', note: 'Lower back stays down.' },
          { ex: 'plank', lab: 'D2', sets: 2, reps: 30, per: 'sec', note: 'Glutes tight.' }] }
    ]
  },
  {
    id: 'swim-shoulders', group: 'pull', lean: 'upper', strength: true, minutes: 45,
    title: 'Swim shoulders',
    sub: 'Chin-up practice and cable work for the muscles that pull you through the water.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm and loosen your upper back.', cheer: 'Shoulders ready.',
        items: [rower, openbook,
          { id: 'scap', name: 'Shoulder-blade pull', rx: '8', sets: 1, note: 'From a hang, pull your shoulders down away from your ears without bending your elbows.' }] },
      { tag: 'A', name: 'Chin-up practice', kind: 'Main lift · rest 90 sec', min: 9, rest: 90, how: 'Four sets of four slow lowers with your palms facing you.', cheer: 'Another deposit toward a full chin-up.',
        items: [{ ex: 'chinup', lab: 'A', sets: 4, reps: 4, note: 'Five seconds down on each.' }] },
      { tag: 'B', name: 'Pulldown and face pull', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2 on the same machine, then rest 60 seconds.', cheer: 'Lats and rear shoulders, done.',
        items: [{ ex: 'pulldown', lab: 'B1', sets: 3, reps: 12, start: 20, note: 'Straight arms. Think of the catch in your stroke.' },
          { ex: 'facepull', lab: 'B2', sets: 3, reps: 15, start: 15, note: 'Elbows high.' }] },
      { tag: 'C', name: 'Row and raise', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1, then C2 on the floor, then rest 60 seconds.', cheer: 'Shoulder blades, strong and steady.',
        items: [{ ex: 'cablerow', lab: 'C1', sets: 3, reps: 12, start: 30, note: 'Elbows straight back.' },
          { ex: 'ytw', lab: 'C2', sets: 3, reps: 6, per: 'each letter', start: 0, note: 'One-second hold on each.' }] },
      { tag: 'D', name: 'Core', kind: 'Superset · 3 rounds · rest 30 sec', min: 8, rest: 30, how: 'Do D1 on the bar, hold D2 on both sides, then rest 30 seconds.', cheer: 'A strong trunk makes a long stroke.',
        items: [{ ex: 'kneeraise', lab: 'D1', sets: 3, reps: 8, note: 'No swinging.' },
          { ex: 'sideplank', lab: 'D2', sets: 3, reps: 20, per: 'sec / side', note: 'One straight line.' }] }
    ]
  },
  {
    id: 'bench-arms', group: 'push', lean: 'upper', strength: true, minutes: 43,
    title: 'Bench and arms',
    sub: 'A heavy dumbbell bench press, then triceps, biceps and a carry.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and loosen your chest and upper back.', cheer: 'Warm and ready.',
        items: [rower, openbook,
          { id: 'easypush', name: 'Easy incline push-ups', rx: '8', sets: 1, note: 'Hands on a tall box. Smooth reps to warm your elbows and shoulders.' },
          { id: 'rampbench', name: 'Ramp-up bench press', rx: '1 set', sets: 1, note: 'Eight reps with about half your working weight.' }] },
      { tag: 'A', name: 'Bench press', kind: 'Main lift · rest 90 sec', min: 11, rest: 90, how: 'Four sets of six, heavier than your 10-rep weight.', cheer: 'Heavy pressing, done.',
        items: [{ ex: 'bench', lab: 'A', sets: 4, reps: 6, start: 20, note: 'One dumbbell size up from your sets of 10.' }] },
      { tag: 'B', name: 'Push-up and pushdown', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Triceps, thoroughly worked.',
        items: [{ ex: 'pushup', lab: 'B1', sets: 3, reps: 8, note: 'Body in one line.' },
          { ex: 'pushdown', lab: 'B2', sets: 3, reps: 12, start: 20, note: 'Lock out every rep.' }] },
      { tag: 'C', name: 'Curl and extension', kind: 'Superset · 3 rounds · rest 45 sec', min: 9, rest: 45, how: 'Do C1, go straight to C2, then rest 45 seconds.', cheer: 'Front and back of the arms, done.',
        items: [{ ex: 'cablecurl', lab: 'C1', sets: 3, reps: 12, start: 20, note: 'Three seconds down.' },
          { ex: 'tri', lab: 'C2', sets: 3, reps: 12, start: 15, note: 'Deep stretch at the bottom.' }] },
      { tag: 'D', name: 'Hammer and carry', kind: 'Superset · 2 rounds · rest 45 sec', min: 6, rest: 45, how: 'Do D1, then carry for D2, then rest 45 seconds.', cheer: 'Grip finished too.',
        items: [{ ex: 'hammer', lab: 'D1', sets: 2, reps: 12, start: 10, note: 'Elbows pinned.' },
          { ex: 'farmer', lab: 'D2', sets: 2, reps: 30, per: 'steps', start: 25, note: 'Tall and slow.' }] }
    ]
  },
  {
    id: 'push-pull', group: 'push', lean: 'upper', strength: true, minutes: 48,
    title: 'Push, pull, repeat',
    sub: 'Four supersets that pair a push with a pull, so one rests while the other works.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and loosen your shoulders.', cheer: 'Warm and ready.',
        items: [rower, openbook,
          { id: 'easypush', name: 'Easy incline push-ups', rx: '8', sets: 1, note: 'Hands on a tall box.' }] },
      { tag: 'A', name: 'Press and pulldown', kind: 'Superset · 3 rounds · rest 60 sec', min: 11, rest: 60, how: 'Do A1 on both arms, go straight to A2, then rest 60 seconds.', cheer: 'Overhead and back down. Done.',
        items: [{ ex: 'press', lab: 'A1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Tall, still torso.' },
          { ex: 'pulldown', lab: 'A2', sets: 3, reps: 12, start: 20, note: 'Straight arms.' }] },
      { tag: 'B', name: 'Bench and ring row', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Chest and back, balanced.',
        items: [{ ex: 'bench', lab: 'B1', sets: 3, reps: 10, start: 15, note: 'Two to three seconds down.' },
          { ex: 'ringrow', lab: 'B2', sets: 3, reps: 10, note: 'Chest to the rings.' }] },
      { tag: 'C', name: 'Push-up and cable row', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do C1, go straight to C2, then rest 60 seconds.', cheer: 'One more pairing to go.',
        items: [{ ex: 'pushup', lab: 'C1', sets: 3, reps: 8, note: 'Body in one line.' },
          { ex: 'cablerow', lab: 'C2', sets: 3, reps: 12, start: 30, note: 'Squeeze for one second.' }] },
      { tag: 'D', name: 'Triceps and biceps', kind: 'Superset · 3 rounds · rest 45 sec', min: 8, rest: 45, how: 'Do D1, go straight to D2 on the same machine, then rest 45 seconds.', cheer: 'Arms done.',
        items: [{ ex: 'pushdown', lab: 'D1', sets: 3, reps: 12, start: 20, note: 'Lock out every rep.' },
          { ex: 'cablecurl', lab: 'D2', sets: 3, reps: 12, start: 20, note: 'Elbows still.' }] },
      { tag: 'E', name: 'Plank', kind: '2 sets · rest 30 sec', min: 3, rest: 30, how: 'Two holds to finish.', cheer: 'Push, pull, repeat, complete.',
        items: [{ ex: 'plank', lab: 'E', sets: 2, reps: 30, per: 'sec', note: 'Stop when your hips sag.' }] }
    ]
  },
  {
    id: 'whole-b', group: 'whole', lean: 'whole', strength: true, minutes: 46,
    title: 'Roots to branches',
    sub: 'A deadlift, a press and a row, single-leg work, then a carry and core.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Get warm, then rehearse the hinge before you load it.', cheer: 'Warm from the ground up.',
        items: [stairs, hinge, openbook,
          { id: 'rampdl', name: 'Ramp-up deadlifts', rx: '2 sets', sets: 2, note: 'Empty trap bar for 6, then about three quarters of your working weight for 3.' }] },
      { tag: 'A', name: 'Trap-bar deadlift', kind: 'Main lift · rest 2 min', min: 10, rest: 120, how: 'Three sets of five. Reset before every rep.', cheer: 'The big lift is in the bank.',
        items: [{ ex: 'trapdl', lab: 'A', sets: 3, reps: 5, start: 85, note: 'Same weight as your full deadlift day.' }] },
      { tag: 'B', name: 'Press and row', kind: 'Superset · 3 rounds · rest 60 sec', min: 11, rest: 60, how: 'Do B1 on both arms, then B2 on both arms, then rest 60 seconds.', cheer: 'A push and a pull, done.',
        items: [{ ex: 'press', lab: 'B1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Tall, still torso.' },
          { ex: 'row', lab: 'B2', sets: 3, reps: 10, per: 'side', start: 20, note: 'Elbow to your back pocket.' }] },
      { tag: 'C', name: 'Split squat and push-up', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1 on both legs, go straight to C2, then rest 60 seconds.', cheer: 'Legs and chest, checked off.',
        items: [{ ex: 'bulgarian', lab: 'C1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Front shin about vertical at the bottom.' },
          { ex: 'pushup', lab: 'C2', sets: 3, reps: 8, note: 'Body in one line.' }] },
      { tag: 'D', name: 'Carry and raise', kind: 'Superset · 3 rounds · rest 45 sec', min: 7, rest: 45, how: 'Carry for D1, go to the bar for D2, then rest 45 seconds.', cheer: 'Roots to branches, all of it.',
        items: [{ ex: 'farmer', lab: 'D1', sets: 3, reps: 30, per: 'steps', start: 25, note: 'Tall and slow.' },
          { ex: 'kneeraise', lab: 'D2', sets: 3, reps: 8, note: 'No swinging.' }] }
    ]
  },
  {
    id: 'dumbbell-only', group: 'whole', lean: 'whole', strength: true, minutes: 45,
    title: 'Dumbbells only',
    sub: 'A full session from one spot on the gym floor with a bench and the dumbbell rack.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and open your hips and upper back.', cheer: 'Warm. Claim a bench.',
        items: [walk(), bwsquat, openbook] },
      { tag: 'A', name: 'Goblet squat', kind: 'Main lift · rest 75 sec', min: 10, rest: 75, how: 'Four sets of eight with one dumbbell held on end at your chest.', cheer: 'Squats done.',
        items: [{ ex: 'goblet', lab: 'A', sets: 4, reps: 8, start: 25, note: 'Three seconds down, strong drive up.' }] },
      { tag: 'B', name: 'Bench and row', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, then B2 on both arms with a hand on the bench, then rest 60 seconds.', cheer: 'Chest and back, balanced.',
        items: [{ ex: 'bench', lab: 'B1', sets: 3, reps: 10, start: 15, note: 'Two to three seconds down.' },
          { ex: 'row', lab: 'B2', sets: 3, reps: 10, per: 'side', start: 20, note: 'Pause at the top.' }] },
      { tag: 'C', name: 'Hinge and press', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do C1, then C2 on both arms, then rest 60 seconds.', cheer: 'Hamstrings and shoulders, done.',
        items: [{ ex: 'rdl', lab: 'C1', sets: 3, reps: 10, start: 20, note: 'Dumbbells close to your legs.' },
          { ex: 'press', lab: 'C2', sets: 3, reps: 8, per: 'side', start: 10, note: 'Tall, still torso.' }] },
      { tag: 'D', name: 'Arms', kind: 'Superset · 3 rounds · rest 45 sec', min: 8, rest: 45, how: 'Do D1, go straight to D2, then rest 45 seconds.', cheer: 'Dumbbells only, and that was plenty.',
        items: [{ ex: 'hammer', lab: 'D1', sets: 3, reps: 12, start: 10, note: 'Elbows pinned.' },
          { ex: 'tri', lab: 'D2', sets: 3, reps: 12, start: 15, note: 'Deep stretch at the bottom.' }] }
    ]
  },
  {
    id: 'tone-upper', group: 'tone', lean: 'upper', strength: false, minutes: 45,
    title: 'Slow burn: arms and core',
    sub: 'A five-move upper-body circuit at higher reps and slower tempo, then core.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 7, rest: 0, how: 'Get warm and loosen your shoulders.', cheer: 'Warm. Settle in for the circuit.',
        items: [rower, openbook,
          { id: 'easypush', name: 'Easy incline push-ups', rx: '8', sets: 1, note: 'Hands on a tall box.' }] },
      { tag: 'A', name: 'Upper circuit', kind: 'Circuit · 3 rounds · rest 75 sec', min: 27, rest: 75, how: 'Five moves back to back with lighter weights and slow lowering. Rest 75 seconds after the fifth.', cheer: 'Three rounds of that is real work. Well done.',
        items: [{ ex: 'pushup', lab: 'A1', sets: 3, reps: 10, note: 'Three seconds down.' },
          { ex: 'ringrow', lab: 'A2', sets: 3, reps: 10, note: 'Pause at the top.' },
          { ex: 'press', lab: 'A3', sets: 3, reps: 12, per: 'side', start: 7.5, note: 'Lighter than usual, smooth reps.' },
          { ex: 'hammer', lab: 'A4', sets: 3, reps: 15, start: 7.5, note: 'No swinging.' },
          { ex: 'pushdown', lab: 'A5', sets: 3, reps: 15, start: 15, note: 'Lock out every rep.' }] },
      { tag: 'B', name: 'Core', kind: 'Superset · 2 rounds · rest 30 sec', min: 8, rest: 30, how: 'Hold B1, go straight to B2, then rest 30 seconds.', cheer: 'Trunk work, done.',
        items: [{ ex: 'plank', lab: 'B1', sets: 2, reps: 30, per: 'sec', note: 'Glutes tight.' },
          { ex: 'deadbug', lab: 'B2', sets: 2, reps: 10, per: 'side', note: 'Slow reaches.' }] },
      { tag: 'C', name: 'Finisher', kind: '3 efforts', min: 3, rest: 0, how: 'Three hard 20-second efforts on the rope.', cheer: 'Slow burn, complete.', items: [rope(3)] }
    ]
  },
  {
    id: 'reset', group: 'short', lean: 'whole', strength: false, recovery: true, minutes: 25,
    title: 'Reset',
    sub: 'Mobility, shoulders and core with almost no load. For the days after a hard ride or run.',
    blocks: [
      { tag: 'W', name: 'Loosen up', kind: 'Check off as you go', min: 5, rest: 0, how: 'Three easy minutes, then open your hips and upper back.', cheer: 'Loose. Now the gentle work.',
        items: [walk('3:00', 180), openbook,
          { id: 'wgs', name: 'World\'s greatest stretch', rx: '4 / side', sets: 1, note: 'Long lunge, both hands inside the front foot, then rotate and reach the inside arm to the ceiling.' }] },
      { tag: 'A', name: 'Core', kind: 'Tri-set · 2 rounds · rest 30 sec', min: 8, rest: 30, how: 'A1, A2, A3 back to back on the floor, then rest 30 seconds.', cheer: 'Trunk switched on.',
        items: [{ ex: 'deadbug', lab: 'A1', sets: 2, reps: 8, per: 'side', note: 'Slow and quiet.' },
          { ex: 'sideplank', lab: 'A2', sets: 2, reps: 20, per: 'sec / side', note: 'One straight line.' },
          { ex: 'plank', lab: 'A3', sets: 2, reps: 30, per: 'sec', note: 'Glutes tight.' }] },
      { tag: 'B', name: 'Shoulders', kind: 'Superset · 2 rounds · rest 30 sec', min: 7, rest: 30, how: 'Do B1 on the floor, go to the cable for B2, then rest 30 seconds.', cheer: 'Shoulder blades moving well.',
        items: [{ ex: 'ytw', lab: 'B1', sets: 2, reps: 6, per: 'each letter', start: 0, note: 'No weight.' },
          { ex: 'facepull', lab: 'B2', sets: 2, reps: 15, start: 10, note: 'Light and strict.' }] },
      { tag: 'C', name: 'Carry and hang', kind: 'Superset · 2 rounds · rest 30 sec', min: 5, rest: 30, how: 'Carry for C1, go to the bar for C2, then rest 30 seconds.', cheer: 'Reset complete. Better than when you walked in.',
        items: [{ ex: 'farmer', lab: 'C1', sets: 2, reps: 30, per: 'steps', start: 20, note: 'Moderate bells, tall posture.' },
          { ex: 'kneeraise', lab: 'C2', sets: 2, reps: 6, note: 'Slow and controlled.' }] }
    ]
  }  ,
  {
    id: 'swim-day', group: 'pair', pair: 'swim', lean: 'lower', strength: false, minutes: 30,
    title: 'Swim-day strength',
    sub: 'Legs and trunk only, so your shoulders are fresh for the pool.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Three brisk minutes, then wake up your hips.', cheer: 'Warm. Legs only today.',
        items: [walk('3:00', 180), bwsquat, bridge] },
      { tag: 'A', name: 'Goblet squat', kind: 'Main lift · rest 75 sec', min: 10, rest: 75, how: 'Four sets of eight. The bell sits in your hands, not on your shoulders.', cheer: 'Squats done, shoulders untouched.',
        items: [{ ex: 'goblet', lab: 'A', sets: 4, reps: 8, start: 25, note: 'Three seconds down, strong drive up.' }] },
      { tag: 'B', name: 'Hinge and step', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do B1, then B2 on both legs, then rest 60 seconds.', cheer: 'Back of the legs, done.',
        items: [{ ex: 'rdl', lab: 'B1', sets: 3, reps: 10, start: 20, note: 'Hips back, dumbbells close.' },
          { ex: 'stepup', lab: 'B2', sets: 3, reps: 8, per: 'side', start: 10, note: 'Slow on the way down.' }] },
      { tag: 'C', name: 'Glutes and trunk', kind: 'Superset · 3 rounds · rest 45 sec', min: 7, rest: 45, how: 'Do C1, go straight to C2, then rest 45 seconds.', cheer: 'Done. Go swim.',
        items: [{ ex: 'hipthrust', lab: 'C1', sets: 3, reps: 12, start: 30, note: 'Squeeze at the top.' },
          { ex: 'deadbug', lab: 'C2', sets: 3, reps: 8, per: 'side', note: 'Lower back stays down.' }] }
    ]
  },
  {
    id: 'run-day', group: 'pair', pair: 'run', lean: 'upper', strength: false, minutes: 30,
    title: 'Run-day strength',
    sub: 'Upper body and trunk only, so your legs are fresh for the run.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Loosen your upper back and shoulders. Your run is the leg warm-up.', cheer: 'Warm. No legs today.',
        items: [openbook,
          { id: 'easypush', name: 'Easy incline push-ups', rx: '8', sets: 1, note: 'Hands on a tall box.' },
          { id: 'hang', name: 'Dead hang', rx: '2 x 15 sec', sets: 2, timer: 15, note: 'Hang from the pull-up bar with long arms and relaxed legs.' }] },
      { tag: 'A', name: 'Press and ring row', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do A1 on both arms, go straight to A2, then rest 60 seconds.', cheer: 'A push and a pull, done.',
        items: [{ ex: 'press', lab: 'A1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Tall, still torso.' },
          { ex: 'ringrow', lab: 'A2', sets: 3, reps: 10, note: 'Chest to the rings.' }] },
      { tag: 'B', name: 'Bench and row', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do B1, then B2 on both arms, then rest 60 seconds.', cheer: 'Chest and back, balanced.',
        items: [{ ex: 'bench', lab: 'B1', sets: 3, reps: 10, start: 15, note: 'Two to three seconds down.' },
          { ex: 'row', lab: 'B2', sets: 3, reps: 10, per: 'side', start: 20, note: 'Pause at the top.' }] },
      { tag: 'C', name: 'Trunk', kind: 'Superset · 3 rounds · rest 30 sec', min: 8, rest: 30, how: 'Hold C1 on both sides, go to the bar for C2, then rest 30 seconds.', cheer: 'Done. A strong trunk holds your form late in a run.',
        items: [{ ex: 'sideplank', lab: 'C1', sets: 3, reps: 20, per: 'sec / side', note: 'One straight line.' },
          { ex: 'kneeraise', lab: 'C2', sets: 3, reps: 8, note: 'No swinging.' }] }
    ]
  },
  {
    id: 'ride-day', group: 'pair', pair: 'ride', lean: 'upper', strength: false, minutes: 30,
    title: 'Ride-day strength',
    sub: 'Opens up what the bike closes down: upper back, shoulders and trunk. No heavy legs.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Undo the riding position before you load anything.', cheer: 'Unfolded. Now the work.',
        items: [openbook,
          { id: 'wgs', name: 'World\'s greatest stretch', rx: '4 / side', sets: 1, note: 'Long lunge, both hands inside the front foot, then rotate and reach the inside arm to the ceiling.' }] },
      { tag: 'A', name: 'Cable row and face pull', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do A1, go straight to A2 on the same machine, then rest 60 seconds.', cheer: 'Upper back, pulled open.',
        items: [{ ex: 'cablerow', lab: 'A1', sets: 3, reps: 12, start: 30, note: 'Squeeze your shoulder blades for one second.' },
          { ex: 'facepull', lab: 'A2', sets: 3, reps: 15, start: 15, note: 'Elbows high.' }] },
      { tag: 'B', name: 'Pulldown and push-up', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do B1, go straight to B2, then rest 60 seconds.', cheer: 'Lats and chest, done.',
        items: [{ ex: 'pulldown', lab: 'B1', sets: 3, reps: 12, start: 20, note: 'Straight arms, slow return.' },
          { ex: 'pushup', lab: 'B2', sets: 3, reps: 8, note: 'Body in one line.' }] },
      { tag: 'C', name: 'Posture and carry', kind: 'Tri-set · 2 rounds · rest 30 sec', min: 8, rest: 30, how: 'C1, C2, C3 back to back, then rest 30 seconds.', cheer: 'Done. Taller than when you got off the bike.',
        items: [{ ex: 'ytw', lab: 'C1', sets: 2, reps: 6, per: 'each letter', start: 0, note: 'One-second hold on each.' },
          { ex: 'plank', lab: 'C2', sets: 2, reps: 30, per: 'sec', note: 'Glutes tight.' },
          { ex: 'farmer', lab: 'C3', sets: 2, reps: 30, per: 'steps', start: 25, note: 'Tall and slow.' }] }
    ]
  }  ,
  {
    id: 'squat-30', group: 'thirty', kind: 'squat', lean: 'lower', strength: false, minutes: 30,
    title: 'Squat day in thirty',
    sub: 'Back squat, then split squats and leg curls, then a plank.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Three brisk minutes, then rehearse the squat.', cheer: 'Warm. Straight to the bar.',
        items: [walk('3:00', 180), bwsquat] },
      { tag: 'A', name: 'Back squat', kind: 'Main lift · rest 90 sec', min: 11, rest: 90, how: 'Three sets of six. Use your first set as the last warm-up if you need it.', cheer: 'The main lift is done.',
        items: [{ ex: 'squat', lab: 'A', sets: 3, reps: 6, start: 65, note: 'Three seconds down, drive up.' }] },
      { tag: 'B', name: 'Split squat and leg curl', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1 on both legs, go straight to B2, then rest 60 seconds.', cheer: 'Front and back of the legs, covered.',
        items: [{ ex: 'bulgarian', lab: 'B1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Back foot on the bench, torso tall.' },
          { ex: 'curl', lab: 'B2', sets: 3, reps: 12, start: 50, note: 'Slow on the way back.' }] },
      { tag: 'C', name: 'Plank', kind: '2 sets · rest 30 sec', min: 4, rest: 30, how: 'Two honest holds and you are done.', cheer: 'Thirty minutes, a full squat day.',
        items: [{ ex: 'plank', lab: 'C', sets: 2, reps: 30, per: 'sec', note: 'Glutes tight, ribs down.' }] }
    ]
  },
  {
    id: 'hinge-30', group: 'thirty', kind: 'hinge', lean: 'lower', strength: false, minutes: 30,
    title: 'Hinge day in thirty',
    sub: 'Trap-bar deadlift, then hip thrusts and single-leg deadlifts, then swings.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Three brisk minutes, then rehearse the hinge.', cheer: 'Hips are awake.',
        items: [walk('3:00', 180), hinge] },
      { tag: 'A', name: 'Trap-bar deadlift', kind: 'Main lift · rest 90 sec', min: 10, rest: 90, how: 'Three sets of five. Reset before every rep.', cheer: 'The heavy part is done.',
        items: [{ ex: 'trapdl', lab: 'A', sets: 3, reps: 5, start: 85, note: 'Push the floor away.' }] },
      { tag: 'B', name: 'Hip thrust and single-leg deadlift', kind: 'Superset · 3 rounds · rest 60 sec', min: 10, rest: 60, how: 'Do B1, then B2 on both legs, then rest 60 seconds.', cheer: 'Glutes and hamstrings, done.',
        items: [{ ex: 'hipthrust', lab: 'B1', sets: 3, reps: 10, start: 30, note: 'Squeeze for one second at the top.' },
          { ex: 'slrdl', lab: 'B2', sets: 3, reps: 8, per: 'side', start: 15, note: 'Hips square to the floor.' }] },
      { tag: 'C', name: 'Kettlebell swing', kind: '3 sets · rest 45 sec', min: 5, rest: 45, how: 'Three crisp sets to finish.', cheer: 'Thirty minutes, a full hinge day.',
        items: [{ ex: 'swing', lab: 'C', sets: 3, reps: 12, start: 25, note: 'Snap the hips. The arms only guide.' }] }
    ]
  },
  {
    id: 'pull-30', group: 'thirty', kind: 'pull', lean: 'upper', strength: false, minutes: 30,
    title: 'Pull day in thirty',
    sub: 'Rows two ways, face pulls, curls and a dead bug.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Open your upper back, then hang.', cheer: 'Shoulder blades are moving.',
        items: [openbook,
          { id: 'hang', name: 'Dead hang', rx: '2 x 15 sec', sets: 2, timer: 15, note: 'Hang from the pull-up bar with long arms and relaxed legs.' }] },
      { tag: 'A', name: 'Dumbbell row and ring row', kind: 'Superset · 3 rounds · rest 75 sec', min: 11, rest: 75, how: 'Do A1 on both arms, go straight to A2, then rest 75 seconds.', cheer: 'The heavy pulling is done.',
        items: [{ ex: 'row', lab: 'A1', sets: 3, reps: 8, per: 'side', start: 20, note: 'Pause at the top.' },
          { ex: 'ringrow', lab: 'A2', sets: 3, reps: 8, note: 'Chest to the rings.' }] },
      { tag: 'B', name: 'Cable row and face pull', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do B1, go straight to B2 on the same machine, then rest 60 seconds.', cheer: 'Upper back, worked from two angles.',
        items: [{ ex: 'cablerow', lab: 'B1', sets: 3, reps: 12, start: 30, note: 'Squeeze your shoulder blades for one second.' },
          { ex: 'facepull', lab: 'B2', sets: 3, reps: 15, start: 15, note: 'Elbows high.' }] },
      { tag: 'C', name: 'Curl and dead bug', kind: 'Superset · 2 rounds · rest 30 sec', min: 6, rest: 30, how: 'Do C1, go straight to C2, then rest 30 seconds.', cheer: 'Thirty minutes, a full pull day.',
        items: [{ ex: 'cablecurl', lab: 'C1', sets: 2, reps: 12, start: 15, note: 'Elbows stay at your sides.' },
          { ex: 'deadbug', lab: 'C2', sets: 2, reps: 8, per: 'side', note: 'Lower back stays down.' }] }
    ]
  },
  {
    id: 'push-30', group: 'thirty', kind: 'push', lean: 'upper', strength: false, minutes: 30,
    title: 'Push day in thirty',
    sub: 'Dumbbell bench, then overhead press and push-ups, then triceps and a plank.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Open your upper back and warm your elbows.', cheer: 'Shoulders are ready.',
        items: [openbook,
          { id: 'easypush', name: 'Easy incline push-ups', rx: '8', sets: 1, note: 'Hands on a tall box. Smooth reps to warm your elbows and shoulders.' }] },
      { tag: 'A', name: 'Dumbbell bench press', kind: 'Main lift · rest 90 sec', min: 10, rest: 90, how: 'Three sets of eight.', cheer: 'The main lift is done.',
        items: [{ ex: 'bench', lab: 'A', sets: 3, reps: 8, start: 15, note: 'Two to three seconds down.' }] },
      { tag: 'B', name: 'Overhead press and push-up', kind: 'Superset · 3 rounds · rest 60 sec', min: 9, rest: 60, how: 'Do B1 on both arms, go straight to B2, then rest 60 seconds.', cheer: 'Shoulders and chest, done.',
        items: [{ ex: 'press', lab: 'B1', sets: 3, reps: 8, per: 'side', start: 10, note: 'Tall, still torso.' },
          { ex: 'pushup', lab: 'B2', sets: 3, reps: 8, note: 'Body in one line.' }] },
      { tag: 'C', name: 'Triceps and plank', kind: 'Superset · 3 rounds · rest 45 sec', min: 7, rest: 45, how: 'Do C1, go straight to C2, then rest 45 seconds.', cheer: 'Thirty minutes, a full push day.',
        items: [{ ex: 'pushdown', lab: 'C1', sets: 3, reps: 12, start: 20, note: 'Elbows pinned to your sides.' },
          { ex: 'plank', lab: 'C2', sets: 3, reps: 30, per: 'sec', note: 'Glutes tight.' }] }
    ]
  }  ,
  {
    id: 'run-easy', group: 'run', lean: 'lower', strength: false, cardio: true, minutes: 30,
    title: 'Easy run, zone 2',
    sub: '30 minutes in all: a 22-minute easy run between a warm-up walk and a cool-down.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 5, rest: 0, how: 'Walk first. Cold legs do not like being asked to run.', cheer: 'Warm. Start slower than you think.',
        items: [{ id: 'walk', name: 'Brisk walk', rx: '3:00', sets: 1, timer: 180, note: 'Fast enough that your arms want to swing.' },
          { id: 'swings', name: 'Leg swings', rx: '10 / side', sets: 1, note: 'Hold something and swing one leg forward and back, loose and easy.' }] },
      { tag: 'A', name: 'Easy run', kind: 'One timer · pings at halfway and at the end', min: 22, rest: 0, how: 'Start the timer and run away from home. Turn around when it pings.', cheer: 'That is an aerobic deposit in the bank.',
        items: [{ id: 'easy', name: 'Easy run', rx: '22:00', sets: 1, timer: 1320, half: true, note: 'Zone 2: you could speak in full sentences. If you cannot, slow down, and walk for a minute if you need to.',
          how: ['Zone 2 is the effort where breathing is deeper than at rest but under control. The talk test is the simplest gauge: full sentences, no gasping.',
            'On a heart-rate watch it is the second of five zones. Your own range is on the Coach page once Strava is connected.',
            'It will feel almost too slow. That is the point: easy running builds the blood supply and energy systems everything else sits on, with little wear.',
            'No sprints today. About four of every five runs should be this easy.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 3, rest: 0, how: 'Walk it out, then stretch your calves while they are warm.', cheer: 'Done. Easy days are what make hard days possible.',
        items: [{ id: 'walkdown', name: 'Walk', rx: '2:00', sets: 1, timer: 120, note: 'Let your breathing settle.' },
          { id: 'calf', name: 'Calf stretch', rx: '30 sec / side', sets: 1, note: 'Heel down, knee straight, lean into a wall. Mild tension, no bouncing.' }] }
    ]
  },
  {
    id: 'run-strides', group: 'run', lean: 'lower', strength: false, cardio: true, minutes: 35,
    title: 'Easy run with strides',
    sub: 'About 35 minutes in all: an 18-minute easy run, then six short, quick pick-ups. This is your speed work for the week.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 5, rest: 0, how: 'Walk, then loosen your hips.', cheer: 'Warm.',
        items: [{ id: 'walk', name: 'Brisk walk', rx: '3:00', sets: 1, timer: 180, note: 'Fast enough that your arms want to swing.' },
          { id: 'swings', name: 'Leg swings', rx: '10 / side', sets: 1, note: 'Loose and easy.' }] },
      { tag: 'A', name: 'Easy run', kind: 'One timer · pings at halfway and at the end', min: 18, rest: 0, how: 'Zone 2 again. Turn around at the ping.', cheer: 'Legs are warm. Now the fun part.',
        items: [{ id: 'easy', name: 'Easy run', rx: '18:00', sets: 1, timer: 1080, half: true, note: 'Full-sentence effort.' }] },
      { tag: 'B', name: 'Strides', kind: 'One timer · 6 rounds · pings at every change', min: 12, rest: 0, how: 'One timer runs all six. It pings when to go fast and when to ease off.', cheer: 'Six strides. Your legs remember how to move quickly.',
        items: [{ id: 'strides', name: 'Strides: 20 sec quick, 100 sec easy', rx: '6 rounds', sets: 1, timer: 720,
          pings: [[20, 'Easy'], [120, 'Quick'], [140, 'Easy'], [240, 'Quick'], [260, 'Easy'], [360, 'Quick'], [380, 'Easy'], [480, 'Quick'], [500, 'Easy'], [600, 'Quick'], [620, 'Easy']],
          note: 'Start quick as soon as you press the button. Smooth and fast, never straining.',
          how: ['A stride is about 20 seconds of fast, relaxed running: build up for five seconds, hold a quick pace, then ease off.',
            'Aim for the speed you could hold for about a mile, not an all-out sprint. You should finish each one feeling you could do it again at once.',
            'Jog or walk very easily until the next ping. Full recovery is the point.',
            'Strides teach quick, tidy leg turnover without the fatigue of hard intervals. Once a week is plenty.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 2, rest: 0, how: 'Walk until your breathing is quiet.', cheer: 'Done.',
        items: [{ id: 'walkdown', name: 'Walk', rx: '2:00', sets: 1, timer: 120, note: 'Easy.' }] }
    ]
  },
  {
    id: 'run-steady', group: 'run', lean: 'lower', strength: false, cardio: true, minutes: 40,
    title: 'Steady middle',
    sub: '40 minutes in all: easy running around three five-minute blocks at a comfortably hard effort.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 13, rest: 0, how: 'Walk, then ten easy minutes of running before anything faster.', cheer: 'Properly warm.',
        items: [{ id: 'walk', name: 'Brisk walk', rx: '3:00', sets: 1, timer: 180, note: 'Arms swinging.' },
          { id: 'easy', name: 'Easy run', rx: '10:00', sets: 1, timer: 600, half: true, note: 'Zone 2.' }] },
      { tag: 'A', name: 'Steady blocks', kind: 'One timer · 3 rounds · pings at every change', min: 21, rest: 0, how: 'One timer runs all three blocks: five minutes steady, two minutes easy.', cheer: 'That is the hard part done.',
        items: [{ id: 'steady', name: 'Steady: 5 min on, 2 min easy', rx: '3 rounds', sets: 1, timer: 1260,
          pings: [[300, 'Easy'], [420, 'Steady'], [720, 'Easy'], [840, 'Steady'], [1140, 'Easy']],
          note: 'Steady means you can say a short phrase, not a sentence. Zone 3 on a watch.',
          how: ['Steady is one notch above easy: breathing is clearly working, and you could keep it up for half an hour if you had to.',
            'Hold the same effort for all three blocks. If the third is much harder than the first, you started too fast.',
            'Jog very gently for the two easy minutes. Do not stop.',
            'Do this at most once a week, and only once easy runs feel routine again.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 6, rest: 0, how: 'Jog down, then walk.', cheer: 'Done. Strong work.',
        items: [{ id: 'down', name: 'Very easy jog', rx: '4:00', sets: 1, timer: 240, note: 'Slower than your warm-up.' },
          { id: 'walkdown', name: 'Walk', rx: '2:00', sets: 1, timer: 120, note: 'Easy.' }] }
    ]
  },
  {
    id: 'run-long', group: 'run', lean: 'lower', strength: false, cardio: true, minutes: 50,
    title: 'Long easy run',
    sub: '50 minutes in all: a 40-minute easy run with a walk at each end. The week\'s endurance builder.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 5, rest: 0, how: 'Walk, then loosen your hips.', cheer: 'Warm. Settle in.',
        items: [{ id: 'walk', name: 'Brisk walk', rx: '3:00', sets: 1, timer: 180, note: 'Arms swinging.' },
          { id: 'swings', name: 'Leg swings', rx: '10 / side', sets: 1, note: 'Loose and easy.' }] },
      { tag: 'A', name: 'Long run', kind: 'One timer · pings at halfway and at the end', min: 40, rest: 0, how: 'Head out for twenty minutes and turn around at the ping.', cheer: 'Forty minutes on your feet.',
        items: [{ id: 'long', name: 'Easy run', rx: '40:00', sets: 1, timer: 2400, half: true, note: 'Zone 2 the whole way. Walk breaks are fine and still count.',
          how: ['The long run is about time on your feet, not pace. Run it slower than you think you need to.',
            'If your breathing climbs on a hill, shorten your stride and slow down instead of pushing over it.',
            'Add five minutes every week or two. Longer runs are built by small steps.',
            'Take water if it is warm or you will be out more than 45 minutes.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 5, rest: 0, how: 'Walk, then stretch calves and hips.', cheer: 'Done. Eat something with protein in the next couple of hours.',
        items: [{ id: 'walkdown', name: 'Walk', rx: '3:00', sets: 1, timer: 180, note: 'Easy.' },
          { id: 'calf', name: 'Calf stretch', rx: '30 sec / side', sets: 1, note: 'Heel down, knee straight, lean into a wall.' },
          { id: 'hipflex', name: 'Hip flexor stretch', rx: '30 sec / side', sets: 1, note: 'Half kneeling, tuck your tailbone under and shift forward until the front of the back hip opens.' }] }
    ]
  },
  {
    id: 'run-brick', group: 'run', lean: 'lower', strength: false, cardio: true, minutes: 15,
    title: 'Run off the bike',
    sub: '15 minutes in all: a 12-minute run straight off the bike, then a walk.',
    blocks: [
      { tag: 'A', name: 'Brick run', kind: 'One timer · pings at halfway and at the end', min: 12, rest: 0, how: 'Rack the bike, change shoes and go within a few minutes.', cheer: 'Bike legs to run legs. That gets easier every time.',
        items: [{ id: 'brick', name: 'Run off the bike', rx: '12:00', sets: 1, timer: 720, half: true, note: 'Short, quick steps for the first three minutes while the heavy feeling passes.',
          how: ['Your legs will feel wooden at first. That is normal: blood and nerves are still set up for pedaling.',
            'Do not fight it with long strides. Take short, light, quick steps and let your pace come to you.',
            'By about minute three it eases. Then settle into zone 2.',
            'Once a week or two after a ride is enough practice.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 3, rest: 0, how: 'Walk it out.', cheer: 'Done.',
        items: [{ id: 'walkdown', name: 'Walk', rx: '3:00', sets: 1, timer: 180, note: 'Easy.' }] }
    ]
  },
  {
    id: 'swim-1', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 25,
    title: 'Swim 1: breathing and balance',
    sub: 'About 450 yards. Learn to breathe out underwater and to float flat. Everything else is built on these two.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 4, rest: 0, how: 'Any stroke, as slowly as you like.', cheer: 'Wet and warm.',
        items: [{ id: 'easy100', name: 'Easy swim', rx: '100 yd', sets: 1, note: 'Any stroke. Stop at the wall whenever you want.' }] },
      { tag: 'A', name: 'Breathing', kind: 'Drills · rest as needed', min: 8, rest: 0, how: 'Most swimmers who feel breathless are holding their breath. These fix that first.', cheer: 'Air out underwater, air in above. That is the whole trick.',
        items: [{ id: 'bobs', name: 'Bobs', rx: '10', sets: 1, note: 'Stand in chest-deep water. Breathe out under, breathe in above.',
            how: ['Take a normal breath in through your mouth.', 'Sink until your head is under and hum or blow a steady stream of bubbles through your nose and mouth.', 'Keep exhaling until you feel nearly empty, then stand up and take one calm breath in.', 'Go straight back down. Find a slow rhythm: long breath out below, quick breath in above.', 'Common fault: holding your breath underwater and trying to breathe out and in during the moment your mouth is clear. There is no time for both.'] },
          { id: 'blow25', name: 'Bubble 25s', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Swim easy freestyle and breathe out the whole time your face is in the water.',
            how: ['Push off and start exhaling as soon as your face goes in.', 'Let the air trickle out steadily through your nose. You should see or feel bubbles the whole time.', 'When you turn to breathe your lungs are already empty, so you only need to breathe in.', 'Common fault: a big explosive exhale right before the breath. Aim for a steady leak instead.'] }] },
      { tag: 'B', name: 'Balance', kind: 'Drills · rest as needed', min: 8, rest: 0, how: 'Legs that sink are the main brake in freestyle. Balance fixes them more than kicking does.', cheer: 'Flat body, easy speed.',
        items: [{ id: 'glide', name: 'Push and glide', rx: '6', sets: 1, note: 'Push off the wall in a tight streamline and glide until you stop.',
            how: ['Stack one hand on the other and squeeze your arms against your ears.', 'Push off on your front just under the surface and look straight down at the bottom, not forward.', 'Hold still and glide. Notice whether your hips and heels stay near the surface.', 'If your legs sink, press your chest down slightly, as if leaning on a float. Your hips will rise.', 'Common fault: lifting your eyes to look where you are going. The head goes up and the legs go down.'] },
          { id: 'sidekick', name: 'Side kick', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Kick along on your side with the bottom arm reaching forward. Switch sides each length.',
            how: ['Lie on your side with the lower arm stretched out in front and the upper arm resting on your hip.', 'Rest your head on the outstretched shoulder with your face looking down and slightly to the side.', 'Kick gently from the hips with loose ankles. Small, quick kicks.', 'To breathe, roll your face up without lifting your head, take a breath, and roll it back down.', 'Common fault: lifting the head to breathe, which drops the hips. Keep one goggle in the water.'] }] },
      { tag: 'C', name: 'Put it together', kind: 'Easy swimming', min: 5, rest: 0, how: 'Slow freestyle with two thoughts only: bubbles, and eyes down.', cheer: 'Session one done. Repeat it until it feels calm.',
        items: [{ id: 'swim25', name: 'Easy freestyle', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Steady bubbles. Eyes on the bottom. Nothing else matters today.' }] }
    ]
  },
  {
    id: 'swim-2', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 30,
    title: 'Swim 2: rotate to breathe',
    sub: 'About 700 yards. Breathing in freestyle comes from rolling your body, not lifting your head.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 5, rest: 0, how: 'Loosen up, then remind yourself to exhale.', cheer: 'Ready.',
        items: [{ id: 'easy100', name: 'Easy swim', rx: '100 yd', sets: 1, note: 'Any stroke.' },
          { id: 'bobs', name: 'Bobs', rx: '6', sets: 1, note: 'Long breath out under, quick breath in above.' }] },
      { tag: 'A', name: 'Rotation drills', kind: 'Drills · rest as needed', min: 12, rest: 0, how: 'Each drill adds one piece of the roll.', cheer: 'That roll is your breath and your reach.',
        items: [{ id: 'sidekick', name: 'Side kick', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Lower arm forward, face down, small kicks. Switch sides each length.',
            how: ['Lie on your side with the lower arm stretched forward and the upper arm on your hip.', 'Face down, head resting on your shoulder. Kick gently from the hips.', 'Roll your face up to breathe without lifting your head, then roll it back.', 'Common fault: rolling onto your back. Stay on your side, belly button pointing at the wall.'] },
          { id: 'sixkick', name: 'Six-kick switch', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Six kicks on one side, one stroke to change sides, six kicks on the other.',
            how: ['Start in the side-kick position and count six kicks.', 'Take one smooth stroke: the back arm comes over and reaches forward as the front arm pulls through.', 'Let your hips and shoulders roll together so you land on the other side. Count six more kicks.', 'Breathe during the six kicks, by rolling your face up, never during the switch.', 'Common fault: rushing the switch with flat shoulders. Roll like a log, all in one piece.'] },
          { id: 'threeswim', name: 'Three strokes, then glide on your side', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Take three normal strokes, pause on your side for a count of two, and repeat.',
            how: ['Swim three strokes of freestyle.', 'On the third, stay stretched out on your side with the front arm long, as in side kick, for two counts.', 'Breathe in that pause if you need to, with one goggle still in the water.', 'Three strokes means the pause lands on alternate sides, which is how you learn to breathe both ways.', 'Common fault: pulling with the front arm while you breathe. Leave it out in front until your face is back down.'] }] },
      { tag: 'B', name: 'Swim', kind: 'Easy swimming', min: 9, rest: 0, how: 'Freestyle, breathing every three strokes if you can and every two if you cannot.', cheer: 'Rolling, not lifting.',
        items: [{ id: 'swim50', name: 'Freestyle', rx: '4 × 50 yd, rest 30 sec', sets: 4, note: 'Turn your head with your body. One goggle stays in the water.' }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 4, rest: 0, how: 'Slow and loose.', cheer: 'Session two done.',
        items: [{ id: 'down100', name: 'Easy swim', rx: '100 yd', sets: 1, note: 'Any stroke, very easy.' }] }
    ]
  },
  {
    id: 'swim-3', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 35,
    title: 'Swim 3: catch and pull',
    sub: 'About 1,000 yards. A long, patient stroke that holds the water instead of slipping through it.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 6, rest: 0, how: 'Easy, with a few bobs to set your breathing.', cheer: 'Ready.',
        items: [{ id: 'easy200', name: 'Easy swim', rx: '200 yd', sets: 1, note: 'Any stroke. Rest at the walls if you like.' },
          { id: 'bobs', name: 'Bobs', rx: '4', sets: 1, note: 'Long breath out under.' }] },
      { tag: 'A', name: 'Stroke drills', kind: 'Drills · rest as needed', min: 13, rest: 0, how: 'Slow these right down. Drills done fast teach nothing.', cheer: 'Longer strokes, fewer of them.',
        items: [{ id: 'catchup', name: 'Catch-up', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'One arm waits out front until the other hand arrives next to it.',
            how: ['Start with both arms stretched in front.', 'Pull with one arm while the other stays out front, pointing where you are going.', 'Bring the pulling arm over and touch it down beside the waiting hand before the next arm starts.', 'Keep a light kick going so you do not stall.', 'Common fault: the waiting arm drifting down or across. Keep it straight ahead of its own shoulder.'] },
          { id: 'fingertip', name: 'Fingertip drag', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'As your arm comes forward over the water, trail your fingertips along the surface.',
            how: ['Swim normal freestyle.', 'On each recovery, lead with your elbow and let your fingertips skim the water from hip to shoulder.', 'Keep your hand relaxed and close to your body, with the elbow as the highest point.', 'Slide the hand into the water in front of your shoulder, fingers first.', 'Common fault: swinging a straight arm wide. That pulls your hips sideways.'] },
          { id: 'onearm', name: 'Single-arm freestyle', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Stroke with one arm only and keep the other stretched in front. Change arms each length.',
            how: ['Stretch the resting arm out in front and leave it there.', 'With the working arm, reach forward, tip your fingertips down and bend your elbow so your forearm points at the bottom.', 'Press back past your hip with your hand and forearm together, like pulling yourself over a barrel.', 'Breathe to the side of the working arm.', 'Common fault: pushing down on the water with a straight arm. That lifts your chest and sinks your legs.'] }] },
      { tag: 'B', name: 'Swim', kind: 'Steady swimming', min: 12, rest: 0, how: 'Count your strokes on one length of each 50 and try to match or beat it.', cheer: 'Holding water.',
        items: [{ id: 'swim50', name: 'Freestyle', rx: '6 × 50 yd, rest 20 sec', sets: 5, note: 'Long and smooth. Fewer strokes per length is the goal, not speed. Tick five boxes; the sixth is a bonus.' }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 4, rest: 0, how: 'Slow and loose.', cheer: 'Session three done.',
        items: [{ id: 'down100', name: 'Easy swim', rx: '100 yd', sets: 1, note: 'Any stroke.' }] }
    ]
  },
  {
    id: 'swim-4', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 40,
    title: 'Swim 4: steady swimming and sighting',
    sub: 'About 1,300 yards. Hold your form for longer and practice looking where you are going.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 8, rest: 0, how: 'Easy swim, then your choice of drill from the earlier sessions.', cheer: 'Ready.',
        items: [{ id: 'easy200', name: 'Easy swim', rx: '200 yd', sets: 1, note: 'Any stroke.' },
          { id: 'drill', name: 'Drill of your choice', rx: '4 × 25 yd, rest 20 sec', sets: 4, note: 'Pick the one that felt hardest last time: side kick, six-kick switch, catch-up or fingertip drag.',
            how: ['Choose one drill and do all four lengths of it.', 'Go slowly enough to feel what the drill is teaching.', 'On the last length, swim normally and try to keep that feeling.'] }] },
      { tag: 'A', name: 'Steady hundreds', kind: 'Steady swimming', min: 12, rest: 0, how: 'The same easy pace on every one. If the fourth is slower, the first was too fast.', cheer: 'Four hundred yards of steady swimming.',
        items: [{ id: 'hundreds', name: 'Freestyle', rx: '4 × 100 yd, rest 30 sec', sets: 4, note: 'Breathe out underwater, roll to breathe, eyes down.',
            how: ['Start slower than feels necessary.', 'Pick one thought per hundred: bubbles, then eyes down, then roll to breathe, then long reach.', 'Use the 30 seconds to let your breathing come back before you push off.'] }] },
      { tag: 'B', name: 'Sighting', kind: 'Open-water skill', min: 8, rest: 0, how: 'In open water nobody paints a line on the bottom. This is how you swim straight.', cheer: 'Now you can see where you are going.',
        items: [{ id: 'sight', name: 'Sighting 50s', rx: '4 × 50 yd, rest 30 sec', sets: 4, note: 'Twice each length, lift just your eyes forward, then turn to breathe as usual.',
            how: ['Pick a target at the end of the lane, such as a clock or a cone.', 'As one arm reaches forward, press down on it lightly and lift only your eyes above the surface, like a crocodile.', 'Glance at the target, then roll your head to the side for your normal breath as that arm pulls.', 'Drop your head straight back down. Kick a little harder for those two strokes so your legs stay up.', 'Common fault: lifting your whole head and breathing forward. Look first, breathe to the side.'] }] },
      { tag: 'C', name: 'Finish', kind: 'Continuous swim', min: 12, rest: 0, how: 'One unbroken swim, then loosen off.', cheer: 'Session four done. That is a real swim workout.',
        items: [{ id: 'cont200', name: 'Continuous freestyle', rx: '200 yd', sets: 1, note: 'No stopping at the walls. As slow as it takes to stay relaxed.' },
          { id: 'down100', name: 'Easy swim', rx: '100 yd', sets: 1, note: 'Any stroke.' }] }
    ]
  }  ,
  {
    id: 'bike-easy', group: 'bike', lean: 'lower', strength: false, cardio: true, minutes: 45,
    title: 'Easy spin, zone 2',
    sub: '45 minutes in all: 40 at a conversational effort with light, quick pedaling.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 3, rest: 0, how: 'Roll out gently in an easy gear.', cheer: 'Rolling.',
        items: [{ id: 'roll', name: 'Very easy pedaling', rx: '3:00', sets: 1, timer: 180, note: 'An easy gear, legs turning freely.' }] },
      { tag: 'A', name: 'Zone 2 ride', kind: 'One timer · pings at halfway and at the end', min: 40, rest: 0, how: 'Start the timer and ride out. Turn for home when it pings.', cheer: 'Forty easy minutes. This is where endurance comes from.',
        items: [{ id: 'easy', name: 'Easy ride', rx: '40:00', sets: 1, timer: 2400, half: true, note: 'Zone 2: full sentences, light pressure on the pedals, about 85 to 95 turns a minute.',
          how: ['Pick a gear that lets your legs spin quickly with light pressure, rather than pushing a big gear slowly.', 'Keep the effort where you could chat. On hills, shift down early and let your speed drop instead of your breathing climb.', 'Relax your grip, drop your shoulders and bend your elbows a little.', 'Most of your riding should be at this effort. It builds the engine with very little wear.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 2, rest: 0, how: 'Spin the last couple of minutes very lightly.', cheer: 'Done.',
        items: [{ id: 'spin', name: 'Very easy pedaling', rx: '2:00', sets: 1, timer: 120, note: 'Easiest gear.' }] }
    ]
  },
  {
    id: 'bike-short', group: 'bike', lean: 'lower', strength: false, cardio: true, minutes: 20,
    title: 'Short ride with sprints',
    sub: '20 minutes in all, with four 20-second bursts. Turns a short trip into training.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 5, rest: 0, how: 'Five easy minutes before anything hard.', cheer: 'Warm.',
        items: [{ id: 'roll', name: 'Easy pedaling', rx: '5:00', sets: 1, timer: 300, note: 'Build from very easy to conversational.' }] },
      { tag: 'A', name: 'Sprints', kind: 'One timer · 4 rounds · pings at every change', min: 12, rest: 0, how: 'One timer runs all four. Sprint when it says Sprint, soft-pedal when it says Easy.', cheer: 'Four sprints. Short, sharp and done.',
        items: [{ id: 'sprints', name: 'Sprints: 20 sec hard, 2 min 40 sec easy', rx: '4 rounds', sets: 1, timer: 720,
          pings: [[20, 'Easy'], [180, 'Sprint'], [200, 'Easy'], [360, 'Sprint'], [380, 'Easy'], [540, 'Sprint'], [560, 'Easy']],
          note: 'The first sprint starts when you press the button. Only sprint where the road ahead is clear.',
          how: ['Pick a clear, straight stretch with no junctions, or use a trainer.', 'Stay seated, shift to a slightly harder gear and wind your legs up as fast as they will go for 20 seconds.', 'Then shift down and pedal very lightly until the next ping. You should be fully recovered each time.', 'Sprints this short build leg speed and power with almost no fatigue, which is why they fit into a short ride.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 3, rest: 0, how: 'Easy to the end.', cheer: 'Done.',
        items: [{ id: 'spin', name: 'Easy pedaling', rx: '3:00', sets: 1, timer: 180, note: 'Light and relaxed.' }] }
    ]
  },
  {
    id: 'bike-cadence', group: 'bike', lean: 'lower', strength: false, cardio: true, minutes: 40,
    title: 'Cadence drills',
    sub: '40 minutes in all, with six one-minute fast-spin efforts that teach your legs to pedal smoothly.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 10, rest: 0, how: 'Ten easy minutes.', cheer: 'Warm.',
        items: [{ id: 'roll', name: 'Easy ride', rx: '10:00', sets: 1, timer: 600, half: true, note: 'Zone 2.' }] },
      { tag: 'A', name: 'Fast spins', kind: 'One timer · 6 rounds · pings at every change', min: 18, rest: 0, how: 'One minute spinning fast in an easy gear, two minutes at your normal rhythm.', cheer: 'Smoother already.',
        items: [{ id: 'spins', name: 'Spin-ups: 1 min fast, 2 min normal', rx: '6 rounds', sets: 1, timer: 1080,
          pings: [[60, 'Normal'], [180, 'Fast'], [240, 'Normal'], [360, 'Fast'], [420, 'Normal'], [540, 'Fast'], [600, 'Normal'], [720, 'Fast'], [780, 'Normal'], [900, 'Fast'], [960, 'Normal']],
          note: 'Easy gear, legs as fast as you can turn them without bouncing on the saddle.',
          how: ['Shift to an easy gear so there is little resistance.', 'Speed your legs up until you start to bounce on the saddle, then back off just enough to sit still. That is your target.', 'Keep your upper body quiet and think of pedaling in circles, not stamping down.', 'This is about coordination, not effort. Your breathing should stay close to easy.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 10, rest: 0, how: 'Easy riding home.', cheer: 'Done.',
        items: [{ id: 'spin', name: 'Easy ride', rx: '10:00', sets: 1, timer: 600, note: 'Zone 2 or easier.' }] }
    ]
  },
  {
    id: 'bike-steady', group: 'bike', lean: 'lower', strength: false, cardio: true, minutes: 50,
    title: 'Steady efforts, 3 by 8',
    sub: '50 minutes in all, with three eight-minute blocks at a comfortably hard effort. The best single workout for holding speed longer.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 10, rest: 0, how: 'Ten minutes, building from easy to conversational.', cheer: 'Warm.',
        items: [{ id: 'roll', name: 'Easy ride', rx: '10:00', sets: 1, timer: 600, half: true, note: 'Zone 2 by the end.' }] },
      { tag: 'A', name: 'Steady blocks', kind: 'One timer · 3 rounds · pings at every change', min: 34, rest: 0, how: 'Eight minutes steady, four minutes easy, three times. The last easy part is your ride home.', cheer: 'Twenty-four minutes of real work.',
        items: [{ id: 'steady', name: 'Steady: 8 min on, 4 min easy', rx: '3 rounds', sets: 1, timer: 2040,
          pings: [[480, 'Easy'], [720, 'Steady'], [1200, 'Easy'], [1440, 'Steady'], [1920, 'Easy']],
          note: 'Steady means short phrases only. Upper zone 3 to low zone 4 on a heart-rate watch.',
          how: ['Use a flat road, a long gentle climb or a trainer, so nothing interrupts the eight minutes.', 'Settle into an effort that is clearly hard but that you could hold for 20 minutes if you had to. Breathing deep and regular.', 'Hold the same effort for all three blocks. If the third falls apart, start the first one easier next time.', 'Pedal very lightly in the easy minutes and take a drink.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 6, rest: 0, how: 'Spin down.', cheer: 'Done. Strong riding.',
        items: [{ id: 'spin', name: 'Very easy pedaling', rx: '6:00', sets: 1, timer: 360, note: 'Easiest gear.' }] }
    ]
  },
  {
    id: 'bike-long', group: 'bike', lean: 'lower', strength: false, cardio: true, minutes: 90,
    title: 'Long endurance ride',
    sub: '90 minutes in all, nearly all of it easy. Eat and drink on the way.',
    blocks: [
      { tag: 'A', name: 'Long ride', kind: 'One timer · pings at halfway and at the end', min: 85, rest: 0, how: 'Ride out for about 42 minutes and turn for home at the ping.', cheer: 'An hour and a half in the saddle.',
        items: [{ id: 'long', name: 'Easy ride', rx: '85:00', sets: 1, timer: 5100, half: true, note: 'Zone 2 throughout. Let hills slow you down.',
          how: ['Start easier than you think you need to. The goal is to finish feeling you could keep going.', 'Drink every 15 minutes. On rides over an hour, eat something with carbohydrate every 30 to 45 minutes.', 'Change hand positions and stand for a few pedal strokes now and then to rest your back and neck.', 'Add ten to fifteen minutes every week or two when you want to go longer.'] }] },
      { tag: 'C', name: 'Cool-down', kind: 'Check off as you go', min: 5, rest: 0, how: 'Spin easily, then stretch your hips.', cheer: 'Done. Eat a proper meal in the next hour or two.',
        items: [{ id: 'spin', name: 'Very easy pedaling', rx: '3:00', sets: 1, timer: 180, note: 'Easiest gear.' },
          { id: 'hipflex', name: 'Hip flexor stretch', rx: '30 sec / side', sets: 1, note: 'Half kneeling, tuck your tailbone under and shift forward until the front of the back hip opens.' }] }
    ]
  }
  ,
  {
    id: 'mob-hips', group: 'mobility', lean: 'whole', strength: false, cardio: true, minutes: 15,
    title: "Hips and ankles",
    sub: "A 15-minute timed flow for the joints that riding and sitting tighten most.",
    blocks: [
      { tag: 'A', name: "Hips and ankles", kind: 'One tap runs the whole flow', min: 15, rest: 0, how: "Press Start and run it all. Each stretch is timed and called out, with a ping to switch sides.", cheer: "Hips open, ankles moving.",
        items: [{ id: "ninety", name: "90/90 hip switches", rx: "2:00", sets: 1, timer: 120, note: "Sit with both knees bent to 90 degrees and windshield-wiper them side to side.",
            how: ["Sit tall with one shin in front of you and one out to the side, both knees at about 90 degrees.", "Keeping your heels down, rotate both knees over to the other side.", "Move slowly and sit as tall as you can at each end. Use your hands behind you if you need them."] },
          { id: "couch", name: "Half-kneeling hip flexor stretch", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "Back knee down, tailbone tucked, shift forward.",
            how: ["Kneel on one knee with the other foot in front.", "Tuck your tailbone under and squeeze the glute of the back leg. That alone should start the stretch.", "Shift your hips forward a little without arching your back. Switch sides at the ping."] },
          { id: "wgs", name: "World's greatest stretch", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "Long lunge, elbow toward the floor, then reach to the ceiling.",
            how: ["Step into a long lunge and put both hands on the floor inside the front foot.", "Drop the inside elbow toward the floor, then rotate and reach that arm to the ceiling, following it with your eyes.", "Repeat slowly. Switch sides at the ping."] },
          { id: "squat", name: "Deep squat hold", rx: "1:30", sets: 1, timer: 90, note: "Sit in the bottom of a squat and gently push your knees out with your elbows.",
            how: ["Stand a little wider than your hips and sink into the deepest squat you can with your heels down.", "Hold on to something in front of you if you tip backward.", "Press your knees out with your elbows, keep your chest tall, and rock slowly side to side."] },
          { id: "ankle", name: "Knee-to-wall ankle rocks", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "Foot a hand-width from a wall, drive the knee to touch it with the heel down.",
            how: ["Face a wall with one foot about a hand-width away.", "Keeping the heel down, drive your knee forward over your toes to touch the wall.", "Ease back and repeat. Move the foot back if it is easy. Switch sides at the ping."] },
          { id: "ham", name: "Lying hamstring floss", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "On your back, hold behind one thigh and straighten and bend the knee.",
            how: ["Lie on your back and hold behind one thigh so the hip is at 90 degrees.", "Slowly straighten that knee until you feel the back of the thigh, then bend it again.", "Keep the other leg long on the floor. Switch sides at the ping."] },
          { id: "figure4", name: "Figure-four glute stretch", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "On your back, ankle over the opposite knee, pull the legs toward you.",
            how: ["Lie on your back and cross one ankle over the opposite knee.", "Reach through and pull the back of the lower thigh toward your chest.", "Keep your head and shoulders down. Switch sides at the ping."] }] }
    ]
  }  ,
  {
    id: 'mob-upper', group: 'mobility', lean: 'whole', strength: false, cardio: true, minutes: 15,
    title: "Upper back and shoulders",
    sub: "A 15-minute timed flow that undoes the folded-forward position of the bike and the desk.",
    blocks: [
      { tag: 'A', name: "Upper back and shoulders", kind: 'One tap runs the whole flow', min: 15, rest: 0, how: "Press Start and run it all. Each stretch is timed and called out, with a ping to switch sides.", cheer: "Taller than when you started.",
        items: [{ id: "catcow", name: "Cat-cow", rx: "1:00", sets: 1, timer: 60, note: "On hands and knees, round your back up, then let it sink.",
            how: ["Start on hands and knees with hands under shoulders.", "Breathe out and round your whole spine toward the ceiling, tucking your chin and tailbone.", "Breathe in and let your chest sink and your tailbone lift. Move one segment at a time."] },
          { id: "book", name: "Open book", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "On your side with knees bent, open the top arm across to the other side.",
            how: ["Lie on your side with knees stacked and bent to 90 degrees, arms together in front.", "Lift the top arm and open it across your body like a book, following your hand with your eyes.", "Keep your knees together and on the floor. Switch sides at the ping."] },
          { id: "thread", name: "Thread the needle", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "On hands and knees, slide one arm under the other and then reach it up.",
            how: ["From hands and knees, slide one arm palm up along the floor under the other arm until that shoulder rests down.", "Pause, then pull it back and reach the same arm to the ceiling.", "Keep your hips over your knees. Switch sides at the ping."] },
          { id: "wall", name: "Wall slides", rx: "1:30", sets: 1, timer: 90, note: "Back against a wall, slide your arms up and down like a slow snow angel.",
            how: ["Stand with your back, head and hips against a wall, feet a step away from it.", "Put your elbows and the backs of your hands on the wall in a goalpost shape.", "Slide your arms up as far as you can keep them touching, then back down. Keep your ribs down."] },
          { id: "lat", name: "Child's pose with a side reach", rx: "1:00 / side", sets: 1, timer: 120, pings: [[60, "Switch sides"]], note: "Sit back on your heels and walk both hands to one side.",
            how: ["Kneel, sit back toward your heels and reach both arms long in front.", "Walk both hands over to one side until you feel the stretch along the opposite side of your back.", "Breathe into that side. Switch sides at the ping."] },
          { id: "pec", name: "Doorway chest stretch", rx: "0:45 / side", sets: 1, timer: 90, pings: [[45, "Switch sides"]], note: "Forearm on a door frame, step through and turn away.",
            how: ["Put one forearm on a door frame with the elbow at shoulder height.", "Step through with the same-side foot and turn your chest gently away from that arm.", "Keep your shoulder down, away from your ear. Switch sides at the ping."] },
          { id: "hang", name: "Dead hang", rx: "2 \u00d7 30 sec", sets: 1, timer: 90, pings: [[30, "Rest"], [60, "Hang again"]], note: "Hang from a bar with long arms, rest, and hang again.",
            how: ["Hang from a pull-up bar with a shoulder-width grip and let your body be heavy.", "Rest when the ping says so, then go again at the next one.", "If hanging hurts a shoulder, keep your toes on a box and take some weight off."] },
          { id: "chin", name: "Chin tucks", rx: "1:00", sets: 1, timer: 60, note: "Glide your head straight back to make a double chin, hold two seconds, release.",
            how: ["Sit or stand tall and look straight ahead.", "Without tilting, draw your head straight back as if making a double chin.", "Hold for two seconds, release, and repeat slowly."] }] }
    ]
  }  ,
  {
    id: 'core-20', group: 'mobility', lean: 'whole', strength: false, minutes: 20,
    title: 'Core, start to finish',
    sub: 'Twenty minutes of nothing but trunk work: holding still, resisting a lean, and lifting the legs.',
    blocks: [
      { tag: 'W', name: 'Warm-up', kind: 'Check off as you go', min: 3, rest: 0, how: 'Open your upper back and wake up your hips.', cheer: 'Ready.',
        items: [openbook, bridge] },
      { tag: 'A', name: 'Hold still', kind: 'Tri-set · 3 rounds · rest 30 sec', min: 9, rest: 30, how: 'A1, A2, A3 back to back on the floor, then rest 30 seconds.', cheer: 'Trunk switched on.',
        items: [{ ex: 'deadbug', lab: 'A1', sets: 3, reps: 8, per: 'side', note: 'Lower back stays down. Slow and quiet.' },
          { ex: 'sideplank', lab: 'A2', sets: 3, reps: 20, per: 'sec / side', note: 'One straight line from head to heel.' },
          { ex: 'plank', lab: 'A3', sets: 3, reps: 30, per: 'sec', note: 'Glutes tight, ribs down.' }] },
      { tag: 'B', name: 'Lift and carry', kind: 'Superset · 3 rounds · rest 45 sec', min: 8, rest: 45, how: 'Do B1 at the bar, go straight to B2, then rest 45 seconds.', cheer: 'Done. That is a week of core work in one go.',
        items: [{ ex: 'kneeraise', lab: 'B1', sets: 3, reps: 8, note: 'No swinging. Curl your hips up at the top.' },
          { ex: 'farmer', lab: 'B2', sets: 3, reps: 30, per: 'steps', start: 25, note: 'Tall and slow. Do not let the weights pull you sideways.' }] }
    ]
  }  ,
  {
    id: 'swim-1600', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 45,
    title: "1,600 m: steady 200s",
    sub: "A full 1,600 metres built from five relaxed 200s. In a yard pool, swim the same numbers in yards.",
    blocks: [
      { tag: 'W', name: "Warm-up", kind: "Check off as you go", min: 8, rest: 0, how: "Easy swimming, then one drill to set your stroke.", cheer: "Ready.",
        items: [{ id: "wu", name: "Easy swim", rx: "200 m", metres: 200, sets: 1, note: "Any stroke. Rest at the walls if you like." },
          { id: "wudrill", name: "Drill of your choice", rx: "4 × 25 m, rest 15 sec", metres: 100, sets: 4, note: "Side kick, six-kick switch, catch-up or fingertip drag.",
            how: ["Pick the drill that felt hardest last time and do all four lengths of it.", "Go slowly enough to feel what the drill is teaching.", "On the last length, swim normally and try to keep that feeling."] }] },
      { tag: 'A', name: "Main set", kind: "Steady swimming", min: 26, rest: 0, how: "Five 200s at the same relaxed pace. This is the heart of the session.", cheer: "A thousand metres of steady swimming.",
        items: [{ id: "main", name: "Steady 200s", rx: "5 × 200 m, rest 30 sec", metres: 1000, sets: 5, note: "Start slower than feels necessary. The fifth should look like the first.",
            how: ["Give each 200 one thought: bubbles out, eyes down, roll to breathe, long front arm, quiet kick.", "Glance at the clock on each one. Even times matter more than fast ones.", "If your breathing gets ragged, take the full 30 seconds and slow the next one down rather than stopping the set."] }] },
      { tag: 'B', name: "Form 50s", kind: "Technique under a little tiredness", min: 7, rest: 0, how: "Short swims to finish with good habits.", cheer: "Form held to the end.",
        items: [{ id: "form", name: "Breathe every three strokes", rx: "4 × 50 m, rest 20 sec", metres: 200, sets: 4, note: "Breathing every third stroke puts you on both sides and evens out your stroke.",
            how: ["Count one, two, breathe.", "If three is too long, breathe every two for one length and every three on the next.", "Keep one goggle in the water on both sides."] }] },
      { tag: 'C', name: "Cool-down", kind: "Check off as you go", min: 3, rest: 0, how: "Slow and loose.", cheer: "1,600 metres done.",
        items: [{ id: "cd", name: "Easy swim", rx: "100 m", metres: 100, sets: 1, note: "Any stroke, very easy." }] }
    ]
  }  ,
  {
    id: 'swim-1800', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 50,
    title: "1,800 m: up and down the ladder",
    sub: "A pyramid of 100, 200, 300, 200 and 100, then four steady 100s. In a yard pool, swim the same numbers in yards.",
    blocks: [
      { tag: 'W', name: "Warm-up", kind: "Check off as you go", min: 8, rest: 0, how: "Easy swimming, then one drill.", cheer: "Ready.",
        items: [{ id: "wu", name: "Easy swim", rx: "200 m", metres: 200, sets: 1, note: "Any stroke." },
          { id: "wudrill", name: "Drill of your choice", rx: "4 × 25 m, rest 15 sec", metres: 100, sets: 4, note: "Side kick, six-kick switch, catch-up or fingertip drag.",
            how: ["Pick the drill that felt hardest last time and do all four lengths of it.", "Go slowly enough to feel what the drill is teaching.", "On the last length, swim normally and try to keep that feeling."] }] },
      { tag: 'A', name: "Pyramid", kind: "Steady swimming", min: 24, rest: 0, how: "Climb to 300 and come back down. Rest 30 seconds after each swim.", cheer: "Nine hundred metres, up and over.",
        items: [{ id: "pyr", name: "Pyramid: 100, 200, 300, 200, 100", rx: "5 swims, rest 30 sec", metres: 900, sets: 5, note: "Hold one pace all the way through. Tick a box after each swim.",
            how: ["Swim the first 100 easier than you want to. The 300 in the middle is the test.", "On the way back down, keep the same effort and let the shorter swims feel easy.", "Use the 300 to practice staying relaxed when you would like to stop."] }] },
      { tag: 'B', name: "Steady 100s", kind: "Steady swimming", min: 12, rest: 0, how: "Four more at the same pace as the pyramid.", cheer: "Pace held.",
        items: [{ id: "hundreds", name: "Steady 100s", rx: "4 × 100 m, rest 20 sec", metres: 400, sets: 4, note: "Same pace as the pyramid, with a shorter rest.",
            how: ["The shorter rest is the challenge, not the speed.", "Push off on time even if you would like longer.", "If the pace slips by more than a few seconds, take 30 seconds before the next one."] }] },
      { tag: 'C', name: "Cool-down", kind: "Check off as you go", min: 6, rest: 0, how: "Slow and loose.", cheer: "1,800 metres done.",
        items: [{ id: "cd", name: "Easy swim", rx: "200 m", metres: 200, sets: 1, note: "Any stroke, very easy." }] }
    ]
  }  ,
  {
    id: 'swim-2000', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 55,
    title: "2,000 m: three long 400s",
    sub: "Three 400s, each with a different job, then four strong 50s. In a yard pool, swim the same numbers in yards.",
    blocks: [
      { tag: 'W', name: "Warm-up", kind: "Check off as you go", min: 10, rest: 0, how: "A longer easy swim, then one drill.", cheer: "Ready.",
        items: [{ id: "wu", name: "Easy swim", rx: "300 m", metres: 300, sets: 1, note: "Any stroke." },
          { id: "wudrill", name: "Drill of your choice", rx: "4 × 25 m, rest 15 sec", metres: 100, sets: 4, note: "Side kick, six-kick switch, catch-up or fingertip drag.",
            how: ["Pick the drill that felt hardest last time and do all four lengths of it.", "Go slowly enough to feel what the drill is teaching.", "On the last length, swim normally and try to keep that feeling."] }] },
      { tag: 'A', name: "Long 400s", kind: "Race-distance swimming", min: 30, rest: 0, how: "Three 400s with 45 seconds of rest. Each one has a different focus.", cheer: "Twelve hundred metres in three pieces.",
        items: [{ id: "long", name: "400s: easy, sighting, steady", rx: "3 × 400 m, rest 45 sec", metres: 1200, sets: 3, note: "First easy. Second with a sighting look every six strokes. Third at a steady effort you could hold for longer.",
            how: ["First 400: as relaxed as you can make it. Count your strokes on one length.", "Second 400: lift your eyes forward every six strokes, then breathe to the side as usual. This is open-water practice.", "Third 400: a little firmer, with the same stroke count as the first. If the count climbs, your form is slipping."] }] },
      { tag: 'B', name: "Strong 50s", kind: "A little speed", min: 8, rest: 0, how: "Four quicker swims on tired arms.", cheer: "Speed with form.",
        items: [{ id: "strong", name: "Strong 50s", rx: "4 × 50 m, rest 20 sec", metres: 200, sets: 4, note: "Quicker than your 400 pace, with the same long stroke.",
            how: ["Go faster by pressing harder on each stroke, not by spinning your arms.", "Keep breathing every two or three strokes. Do not hold your breath to go fast.", "Stop the set if your stroke turns into a thrash."] }] },
      { tag: 'C', name: "Cool-down", kind: "Check off as you go", min: 6, rest: 0, how: "Slow and loose.", cheer: "2,000 metres done.",
        items: [{ id: "cd", name: "Easy swim", rx: "200 m", metres: 200, sets: 1, note: "Any stroke, very easy." }] }
    ]
  }  ,
  {
    id: 'swim-drills', group: 'swim', lean: 'upper', strength: false, cardio: true, minutes: 30,
    title: "Drills only, with pictures",
    sub: "About 700 metres of nothing but drills, each with a moving stick figure. Go slowly: these are for feel, not fitness.",
    blocks: [
      { tag: 'A', name: "Breath and balance", kind: "Drills \u00b7 rest as needed", min: 12, rest: 0, how: "Start with air and body position. The breathing drill here is the one for swallowing water.", cheer: "Air out, body flat, breath low.",
        items: [{ id: "bobs", name: "Bobs", rx: "10", sets: 1, fig: "bobs", note: "Stand in chest-deep water. Breathe out under, breathe in above.",
            how: ["Take a normal breath in through your mouth.", "Sink until your head is under and hum or blow a steady stream of bubbles through your nose and mouth.", "Stand up when you feel nearly empty and take one calm breath in. Go straight back down.", "Common fault: holding your breath underwater, so there is no time to breathe out and in at the surface."] },
          { id: "glide", name: "Push and glide", rx: "6", sets: 1, fig: "glide", note: "Push off the wall in a tight streamline and glide until you stop.",
            how: ["Stack one hand on the other and squeeze your arms against your ears.", "Push off just under the surface and look straight down at the bottom.", "If your legs sink, press your chest down slightly and your hips will rise.", "Common fault: looking forward. The head goes up and the legs go down."] },
          { id: "sidekick", name: "Side kick", rx: "4 × 25 m, rest 20 sec", sets: 4, fig: "sidekick", note: "Kick along on your side with the bottom arm reaching forward. Switch sides each length.",
            how: ["Lie on your side with the lower arm stretched forward and the upper arm on your hip.", "Rest your head on the outstretched shoulder, face down, and kick gently from the hips.", "Roll your face up to breathe without lifting your head, then roll it back down.", "Common fault: lifting the head to breathe, which drops the hips."] },
          { id: "pocket", name: "Breathing in the pocket", rx: "4 × 25 m, rest 30 sec", sets: 4, fig: "sidekick", note: "The fix for swallowing water: breathe low, in the dip behind your head, with the front arm staying long.",
            how: ["Breathe out fully underwater first, so the turn is only for breathing in.", "Turn your head with your body roll, not by lifting it. The top of your head keeps pointing down the lane and one goggle stays in the water.", "Your head pushes a small wave ahead of it, and just behind that wave the surface dips. Breathe in that dip, mouth pulled a little to the side, like talking out of the corner of your mouth.", "Keep the front arm long and near the surface while you breathe. If it presses down, your head sinks and water comes in.", "Look to the side and a touch back toward the lane rope, never up at the ceiling.", "Common fault: lifting the head to find air. That flattens the wave and puts your mouth below the waterline. Swim this one slowly, and use fins if you have them so your legs stay up."] }] },
      { tag: 'B', name: "Rotation and stroke", kind: "Drills \u00b7 rest as needed", min: 15, rest: 0, how: "Now the roll and the arms.", cheer: "Rolling and reaching.",
        items: [{ id: "sixkick", name: "Six-kick switch", rx: "4 × 25 m, rest 20 sec", sets: 4, fig: "sixkick", note: "Six kicks on one side, one stroke to change sides, six kicks on the other.",
            how: ["Start in the side-kick position and count six kicks.", "Take one smooth stroke: the back arm comes over the top as the front arm pulls underneath.", "Roll your hips and shoulders together so you land on the other side.", "Common fault: rushing the switch with flat shoulders. Roll like a log."] },
          { id: "catchup", name: "Catch-up", rx: "4 × 25 m, rest 20 sec", sets: 4, fig: "catchup", note: "One arm waits out front until the other hand arrives next to it.",
            how: ["Start with both arms stretched in front.", "Pull with one arm while the other stays out front.", "Touch down beside the waiting hand before the next arm starts.", "Common fault: the waiting arm drifting down or across your body."] },
          { id: "fingertip", name: "Fingertip drag", rx: "4 × 25 m, rest 20 sec", sets: 4, fig: "fingertip", note: "As your arm comes forward over the water, trail your fingertips along the surface.",
            how: ["Lead the recovery with your elbow and let your fingertips skim the water from hip to shoulder.", "Keep your hand relaxed and close to your body, with the elbow as the highest point.", "Slide the hand in ahead of your shoulder, fingers first.", "Common fault: swinging a straight arm wide, which pulls your hips sideways."] },
          { id: "onearm", name: "Single-arm freestyle", rx: "4 × 25 m, rest 20 sec", sets: 4, fig: "onearm", note: "Stroke with one arm only and keep the other stretched in front. Change arms each length.",
            how: ["Leave the resting arm stretched in front.", "Reach forward, tip your fingertips down and bend your elbow so your forearm points at the bottom.", "Press back past your hip with hand and forearm together.", "Common fault: pushing down on the water with a straight arm, which lifts your chest and sinks your legs."] }] },
      { tag: 'C', name: "Open water", kind: "Drill", min: 3, rest: 0, how: "One skill for the lake.", cheer: "Drills done. Swim an easy 100 to finish if you like.",
        items: [{ id: "sight", name: "Sighting", rx: "2 × 25 m, rest 20 sec", sets: 2, fig: "sight", note: "Twice each length, lift just your eyes forward, then turn to breathe as usual.",
            how: ["As one arm reaches forward, press on it lightly and lift only your eyes above the surface.", "Glance at a target, then roll your head to the side for your normal breath.", "Drop your head straight back down and kick a little harder for two strokes.", "Common fault: lifting your whole head and breathing forward."] }] }
    ]
  }
];

// Every step gets a stick figure. Lifts take theirs from the exercise; other steps are matched here,
// first by what the step is and then by the kind of session it belongs to.
const STEP_FIG = { walk: 'walk', walkdown: 'walk', bwsquat: 'bwsquat', bridge: 'bridge', wgs: 'wgs', stairs: 'stepup', stairs3: 'stepup', hinge: 'hingedrill',
  ramp: 'squat', rampdl: 'trapdl', rampfs: 'frontsquat', ramprdl: 'rdl', rampbench: 'bench', ramppress: 'press', rower: 'rower', openbook: 'book', book: 'book',
  hang: 'hang', scap: 'scap', easypush: 'pushup', rope: 'rope', halo: 'halo', swings: 'swings', calf: 'calf', hipflex: 'hipflex', couch: 'hipflex', ninety: 'ninety',
  squat: 'deepsquat', ankle: 'ankle', ham: 'ham', figure4: 'figure4', catcow: 'catcow', thread: 'thread', wall: 'wall', lat: 'lat', pec: 'pec', chin: 'chin',
  bobs: 'bobs', glide: 'glide', sidekick: 'sidekick', sixkick: 'sixkick', catchup: 'catchup', fingertip: 'fingertip', onearm: 'onearm', sight: 'sight', drill: 'sidekick', wudrill: 'sidekick' };
const KIND_FIG = { run: 'run', bike: 'ride', swim: 'freestyle' };
for (const s of SESSIONS) for (const b of s.blocks) for (const i of b.items) if (!i.ex && !i.fig) i.fig = STEP_FIG[i.id] || KIND_FIG[s.group];
