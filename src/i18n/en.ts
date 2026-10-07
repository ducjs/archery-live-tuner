import { PARAMETERS } from '../models/parameters.ts'

export type ParameterText = {
  label: string
  hint?: string
  /** Labels of the choices, for parameters that have choices. */
  options?: Readonly<Record<string, string>>
}

// English labels live in the parameter table, next to the bounds and defaults.
const parameter: Record<string, ParameterText> = Object.fromEntries(
  PARAMETERS.map((entry) => [
    entry.key,
    {
      label: entry.label,
      hint: entry.hint,
      options: entry.kind === 'enum' ? entry.optionLabels : undefined,
    },
  ]),
)

export const en = {
  nav: {
    pages: 'Pages',
    simulator: 'Simulator',
    roadmap: 'Roadmap',
    previews: 'Previews',
    language: 'Language',
    units: 'Units',
  },

  simulator: {
    title: 'Recurve tuning simulator',
    intro: 'Change a value and watch how the arrow leaves the bow.',
    show: 'Show',
    flight: 'Flight',
    compare: 'Compare',
    explore: 'Explore',
    bow: 'Bow 3D',
    target: 'Target',
    sections: 'Part of the page',
    section: { setup: 'Setup', result: 'Result', advice: 'Suggestions' },
    disclaimer:
      'This simulator provides a simplified model of recurve bow and arrow behavior. Results are intended for tuning exploration and visualization, not as a substitute for real-world tuning, manufacturer specifications, or professional coaching.',
    modelOnly:
      'Everything on this page is a model result. None of it is an observation from real shooting.',
  },

  parameter,

  panels: {
    detail: 'Detail',
    simple: 'Simple',
    advanced: 'Advanced',
    size: 'Bow size',
    bowLength: (inches: number) => `${inches} in bow`,
    bow: 'Bow',
    arrow: 'Arrow',
    curve: 'Draw force, measured',
    advancedChanged: (count: number) =>
      count === 1
        ? '1 advanced value is changed and still affects the result.'
        : `${count} advanced values are changed and still affect the result.`,
    showThem: 'Show them',
    resetThem: 'Reset them',
    assumed: (count: number) => `Simple mode assumes ${count} more values`,
    assumedExamples: (examples: string[], rest: number) =>
      `${examples.join(', ')} and ${rest} more. If your equipment differs, the result shifts.`,
    assumedShow: 'See all of them',
    assumedHide: 'Hide the list',
    assumedEnter: 'Enter my own values',
    totalMass: 'Estimated total arrow mass',
    resetLabel: (label: string, value: string) => `Reset ${label} to ${value}`,
    resetTitle: (value: string) => `Reset to ${value}`,
    slider: (label: string) => `${label} slider`,
    decrease: (label: string) => `Decrease ${label}`,
    increase: (label: string) => `Increase ${label}`,
    changed: (count: number) => `${count} changed`,
    fold: (title: string) => `Hide ${title}`,
    unfold: (title: string) => `Show ${title}`,
  },

  rating: {
    WEAK: 'Weak',
    NEUTRAL: 'Neutral',
    STIFF: 'Stiff',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    LEFT: 'Left',
    RIGHT: 'Right',
    NOCK_LOW: 'Nock low',
    NOCK_HIGH: 'Nock high',
  },

  result: {
    heading: 'Model result',
    stiffness: 'Dynamic behavior',
    lateral: 'Lateral tendency',
    vertical: 'Vertical tendency',
    oscillation: 'Oscillation',
    clearance: 'Clearance sensitivity',
    short: {
      stiffness: 'Behavior',
      oscillation: 'Oscillation',
      lateral: 'Lateral',
      clearance: 'Clearance',
    },
    bareShaftHeading: 'Bare shaft test',
    bareShaftNote:
      'The bare shaft is weighted to match. Plunger and center shot move it sideways too, not only spine.',
    speed: 'Estimated speed',
    reaching: (metres: string) => `, reaching ${metres} m in`,
    grainsPerPound: 'Grains per pound',
    frontOfCenter: 'Front of center (FOC)',
    energy: 'Kinetic energy',
    braceOutside: (length: number, low: string, high: string) =>
      `Brace height is outside the range Easton gives for a ${length} in bow: ${low} to ${high} cm.`,
    limbsOff: (shift: string) =>
      `The limbs carry the string off line, which acts like ${shift} mm more of center shot.`,
    clearanceCycles: 'Bending cycles when the tail passes the bow',
    tooLight: (grainsPerPound: string, minimum: number) =>
      `This arrow is light for the draw weight: ${grainsPerPound} gr/lb, under the ${minimum} gr/lb that bow makers commonly ask for. A bow shot with too light an arrow is loaded almost as in a dry fire. Check the limit of your bow maker.`,
    belowMinimum: (arrow: string, minimum: string) =>
      `This arrow weighs ${arrow} gr, under the ${minimum} gr that the AMO chart gives as the least for a recurve of this draw weight and draw length. Shooting an arrow lighter than that can break the bow. Use a heavier arrow.`,
    note: 'A simplified model, not checked against real shooting. Test on your own bow before changing equipment.',
    showGauges: 'Show the gauges',
    hideGauges: 'Hide the gauges',
    reading: {
      matched: 'The arrow matches the bow.',
      little: { WEAK: 'The arrow reads a little weak.', STIFF: 'The arrow reads a little stiff.' },
      clearly: { WEAK: 'The arrow reads clearly weak.', STIFF: 'The arrow reads clearly stiff.' },
      nock: {
        NOCK_HIGH: 'The nocking point reads too high.',
        NOCK_LOW: 'The nocking point reads too low.',
      },
      clearance: 'It may touch the bow on the way out.',
      oscillation: 'It wobbles a lot before it settles.',
    },
  },

  curve: {
    marked: {
      open: 'I only know what is marked on the limbs',
      weight: 'Marked on the limbs, lb',
      bolts: 'Limb bolts',
      bolt: { OUT: 'All the way out', MIDDLE: 'Middle', IN: 'All the way in' },
      estimate: (weight: string, length: string) =>
        `About ${weight} on the fingers at your draw length of ${length}.`,
      outOfRange: 'That is outside the draw weights this app accepts.',
      use: 'Use as draw weight',
      note: 'An estimate: 5% per inch from 28 in, and 5% either way for the limb bolts. A bow scale at full draw is better. Draw length here is AMO: from the nocking point to the pivot point of the grip, plus 1.75 in.',
    },
    notMeasured: 'Not measured',
    compared: 'The solid line is the setup on screen; dashed lines are the saved ones.',
    heading: 'Draw force curve',
    chart: (weight: string, length: string) =>
      `Force on the fingers over the draw, reaching ${weight} at ${length}.`,
    drawAxis: (unit: string) => `Draw length, ${unit}`,
    forceAxis: (unit: string) => `Force, ${unit}`,
    clicker: 'Clicker',
    storedEnergy: 'Stored in the bow',
    gain: 'Force gain at the clicker',
    perLength: (value: string, force: string, length: string) => `${value} ${force} per ${length}`,
    reading: {
      USUAL: 'About what a recurve usually gains near full draw: 5% of the draw weight per inch.',
      GENTLER: 'Gentler than the 5% per inch a recurve usually gains near full draw.',
      STEEPER: 'Steeper than the 5% per inch a recurve usually gains near full draw.',
    },
    estimated:
      'Estimated from the bow size and the curve style. This is not the curve of your limbs.',
    measured: (points: number) =>
      points === 1
        ? 'Shaped by 1 force from your bow scale.'
        : `Shaped by ${points} forces from your bow scale.`,
    measureAgain:
      'A measured force belongs to one draw weight, draw length and brace height. Measure again after changing any of them.',
    notUsed:
      'The forces entered do not fit a draw force curve, so the estimate is shown. The force 2 in before full draw must be below the draw weight, and the one 8 in before it lower still; the second is used only together with the first.',
  },

  bareShaft: {
    together: 'The bare shaft lands with the fletched arrows.',
    matched: 'That reads as a matched setup.',
    above: 'above',
    below: 'below',
    left: 'to the left of',
    right: 'to the right of',
    landing: (where: string[]) =>
      `The bare shaft lands ${where.join(' and ')} the fletched arrows.`,
    weak: 'a weak arrow',
    stiff: 'a stiff arrow',
    nockHigh: 'a nocking point that is too high',
    nockLow: 'a nocking point that is too low',
    meaning: (conclusions: string[]) => `That reads as ${conclusions.join(' and ')}.`,
  },

  target: {
    heading: 'Reading the target',
    realWorld: 'From your own arrows in the target. Not a model result.',
    faceLabel: (cm: number, fletched: number, bare: number) =>
      `Target face of ${cm} cm, with ${fletched} fletched arrows and ${bare} bare shafts marked. Tap where an arrow landed to mark it.`,
    how: 'Shoot fletched arrows and bare shafts at the same spot, then tap where each one landed.',
    kind: 'Next arrow',
    fletched: 'Fletched',
    bare: 'Bare shaft',
    distance: 'Distance',
    face: 'Target face',
    end: (end: number, arrows: number) => `End ${end}: ${arrows} marked`,
    nextEnd: 'Next end',
    removeLast: 'Take back the last arrow',
    clear: 'Clear the target',
    need: (fletched: number, bare: number, haveFletched: number, haveBare: number) =>
      `A reading takes at least ${fletched} fletched arrows and ${bare} bare shaft. Marked so far: ${haveFletched} fletched, ${haveBare} bare.`,
    inconclusive: 'Nothing to conclude yet.',
    inconclusiveWhy:
      'The bare shafts are no further from the fletched group than the group is wide, or than a bare shaft strays on its own at this distance. Shoot more ends, or shoot from closer.',
    offset: 'Bare shafts from the fletched group',
    offsetValue: (cm: string, clock: number) => `${cm} cm, at ${clock} o'clock`,
    spread: 'Spread of the fletched group',
    counted: 'Arrows counted',
    countedValue: (fletched: number, bare: number) => `${fletched} fletched, ${bare} bare`,
    modelAgrees: 'The model reads the setup you entered the same way.',
    modelDiffers:
      'The model does not read the setup you entered this way. The difference can come from the release, or from a value on the bow that is not as entered. Adjust on the bow before thinking of other arrows.',
    stepsHeading: 'What to try, in this order',
    why: {
      centerShot:
        'The point is set to the side of the string line that sends a bare shaft where yours landed. Put it back before tuning anything else.',
      nockingPoint: 'Up and down comes first: it changes how left and right read.',
      plunger:
        'The plunger is the first adjustment for left and right. Go an eighth of a turn at a time.',
      point: (cm: string, meters: string) =>
        `More than about ${cm} cm to the side at ${meters} m is usually beyond what the plunger brings back.`,
      drawWeight:
        'If the point does not bring the bare shaft back. Turn both limb bolts by the same amount, half a turn to one turn.',
      shaft: (cm: string, meters: string) =>
        `If the bare shaft still lands more than ${cm} cm to the side at ${meters} m after all of the above, the Easton guide takes the shaft to be the wrong one for the bow.`,
    },
    save: 'Save as an observation',
    saveHint: 'Keeps this target with the values of the setup on screen.',
    saved: 'Saved with the setup on screen.',
    nowLive: 'In the simulator: choose "Target" under Show.',
  },

  paperTear: {
    heading: 'Paper tear test',
    clean: 'The point and the fletching go through one hole.',
    above: 'above',
    below: 'below',
    left: 'to the left of',
    right: 'to the right of',
    tearing: (where: string[]) =>
      `The fletching tears ${where.join(' and ')} the hole the point made.`,
    clearance:
      'Poor clearance tears the paper the same way, and the model rates it a risk here: the arrow may be touching the bow on its way out.',
    note: 'A fletched arrow through a sheet of paper from 1.2 to 1.8 m, seen from the shooting line. Once the hole is clean, step back another 1.8 m and shoot again.',
    figure: (tearing: string) => `The sheet of paper after the shot. ${tearing}`,
  },

  suggestions: {
    heading: 'Tuning suggestions',
    tuned: 'The model reads this setup as tuned. There is nothing to suggest.',
    tunedSlightlyOff:
      'The bare shaft lands a little low or a little to the stiff side of the fletched arrows. That is common on a well tuned bow, so the model leaves it alone.',
    none: 'No single change within reach improves this setup much. Try a different shaft or a larger change than one step.',
    intro:
      'Each group follows the order tuning guides work in: up and down first, then left and right with the plunger, the point and the draw weight, and a different shaft last. Each item is a single change from the setup as it is now, so try one, then look at the lists again.',
    groups: {
      adjust: { title: 'Adjust directly', about: 'Set on the bow itself. Nothing to buy.' },
      equipment: { title: 'Equipment', about: 'Change a part of the arrow, or the arrows.' },
    },
    emptyGroup: 'Nothing in this group helps much.',
    tryIt: 'Try it',
    tryLabel: (action: string) => `Try it: ${action}`,
    footnote: 'Suggestions come from the same simplified model, not from tested tuning advice.',
    actions: {
      'bow.nockingPointHeight': {
        increase: 'Raise the nocking point',
        decrease: 'Lower the nocking point',
      },
      'bow.plungerStiffness': { increase: 'Stiffen the plunger', decrease: 'Soften the plunger' },
      'bow.plungerPreload': { increase: 'Add plunger preload', decrease: 'Reduce plunger preload' },
      'bow.centerShot': {
        increase: 'Move the arrow point to the right',
        decrease: 'Move the arrow point to the left',
      },
      'bow.braceHeight': { increase: 'Raise the brace height', decrease: 'Lower the brace height' },
      'bow.tiller': { increase: 'Increase the tiller', decrease: 'Reduce the tiller' },
      'bow.drawWeight': {
        increase: 'Increase the draw weight',
        decrease: 'Reduce the draw weight',
      },
      'arrow.pointWeight': { increase: 'Use a heavier point', decrease: 'Use a lighter point' },
      'arrow.nockWeight': { increase: 'Use a heavier nock', decrease: 'Use a lighter nock' },
      'arrow.length': { increase: 'Use a longer arrow', decrease: 'Use a shorter arrow' },
      // A higher spine number is a weaker shaft.
      'arrow.spine': { increase: 'Use a weaker shaft', decrease: 'Use a stiffer shaft' },
    } as Record<string, { increase: string; decrease: string }>,
    effort: {
      bow: 'Adjust on the bow',
      arrowPart: 'Change an arrow part',
      newArrows: 'Needs new arrows',
    },
    value: (to: string, from: string) => `Try about ${to}. It is ${from} now.`,
    goes: (title: string, from: string, to: string) => `${title} goes from ${from} to ${to}.`,
    bareLands: (where: string) => `The bare shaft lands ${where}.`,
    bareHorizontal: {
      LEFT: 'left of the group',
      TOGETHER: 'with the group',
      RIGHT: 'right of the group',
    },
    bareVertical: {
      LOW: 'below the group',
      TOGETHER: 'level with the group',
      HIGH: 'above the group',
    },
    closer: 'Moves closer to neutral, without changing a rating.',
  },

  stage: {
    fletched: 'Fletched',
    bareShaft: 'Bare shaft',
    archerLeft: "Archer's left",
    archerRight: "Archer's right",
    high: 'High',
    low: 'Low',
    view: 'View',
    views: { top: 'Top', side: 'Side', both: 'Both' },
    viewNames: { top: 'Top view', side: 'Side view', both: 'Both views' },
    distance: 'Distance',
    impact: 'Impact',
    impacts: { one: 'One point', two: 'Two points' },
    speed: 'Speed',
    real: 'Real',
    bowAngle: (degrees: string) => `Bow raised ${degrees}°`,
    moment: 'Moment',
    momentText: (milliseconds: string, metres: string) =>
      `${milliseconds} milliseconds after leaving the string, ${metres} metres out`,
    momentOnString: (milliseconds: string) =>
      `On the string, ${milliseconds} milliseconds before the arrow leaves it`,
    play: 'Play',
    pause: 'Pause',
    restart: 'Restart',
    flyBare: 'Fly a bare shaft too',
    options: 'Display options',
    hideDrawing: 'Hide the drawing',
    showDrawing: 'Show the drawing',
    summary: (view: string, distance: number, impact: string) =>
      `${view}, ${distance} m, ${impact.toLowerCase()} of impact.`,
    notToScale: 'Not to scale.',
    about: 'About this drawing',
    amplify: 'Amplify',
    realSpeed: 'Real speed.',
    slowed: (times: number) => `Slowed ${times} times.`,
    amplified: {
      one: {
        top: 'Bending and the bare shaft offset are amplified.',
        side: 'The arrow angle and the bare shaft offset are amplified.',
        both: 'Bending, arrow angle and the bare shaft offset are amplified.',
      },
      two: {
        top: 'Bending and drift are amplified.',
        side: 'The arrow angle and drift are amplified.',
        both: 'Bending, arrow angle and drift are amplified.',
      },
    },
    landing: {
      one: 'Bow, arrow, distance and offsets each have a scale of their own. The fletched arrow is taken as sighted in on the center.',
      two: 'Bow, arrow, distance and drift each have a scale of their own. Each arrow lands where the model throws it, with the sight left alone.',
    },
    topViewLabel: (stiffness: string, oscillation: string, lateral: string) =>
      `Top view of the arrow flying from the bow to the target. The arrow is ${stiffness}, with ${oscillation} oscillation and a ${lateral} lateral tendency.`,
    sideViewLabel: (vertical: string) =>
      `Side view of the arrow flying from the bow to the target. The arrow leaves the bow ${vertical}.`,
    level: 'level',
  },

  viewer: {
    views: 'View',
    equipment: 'Equipment',
    focus: {
      bow: 'Whole bow',
      front: 'From the target',
      top: 'From above',
      alongString: 'Along the string',
    },
    part: {
      limbs: 'Limbs',
      string: 'String',
      nockingPoint: 'Nocking point',
      rest: 'Rest',
      plunger: 'Plunger',
      arrow: 'Arrow',
      stabilizer: 'Stabilizer',
    },
    goTo: (label: string) => `Press to set: ${label}`,
    amplify: (times: number) => `Draw offsets ${times} times larger`,
    drawn: 'At full draw',
    notDrawn:
      'Nothing to draw for draw weight, spine, shaft weight, plunger stiffness, string mass, nock fit, draw force curve, bow mass, or the weight of insert, nock and vanes: they change how the arrow flies, not where a part sits.',
    about:
      'The bow follows the setup. Change a value and the camera goes to the part it moves, with the value written there. Press a part of the bow, or the button of a piece of equipment, to go to its value. Drag to turn the bow, scroll or pinch to zoom. The dashed gold line is the string line from above and the line square to the string from the side. Offsets of a few millimetres are hard to see at true scale; the switch draws them larger. Labels always show real values. The bow is a simplified shape, not your equipment.',
    loading: 'Loading the 3D view.',
    failed:
      'The 3D view cannot run here: it needs WebGL, which this browser or device has turned off. These are the flat drawings instead.',
    sceneLabel: '3D model of the bow. Drag to turn it, scroll or pinch to zoom.',
    nockingPoint: 'Nocking point',
    centerShot: 'Center shot',
    /** Plain-words value of the center shot, in real millimetres. */
    centerShotValue: (centerShot: number) =>
      Math.abs(centerShot) < 0.05
        ? 'on the string line'
        : `${Math.abs(centerShot).toFixed(1)} mm ${centerShot < 0 ? 'left' : 'right'} of the string line`,
    /** Plain-words value of the nocking point height, in real millimetres. */
    nockingPointValue: (height: number) =>
      Math.abs(height) < 0.05
        ? 'square to the string'
        : `${Math.abs(height).toFixed(1)} mm ${height > 0 ? 'above' : 'below'} square`,
  },

  setups: {
    heading: 'Your setups',
    defaultName: 'My setup',
    name: 'Setup name',
    notSaved: 'Not saved yet',
    saved: 'Saved',
    changed: 'Unsaved changes',
    save: 'Save',
    saveAsNew: 'Save as new',
    startNew: 'New setup',
    copyName: (name: string) => `${name} (copy)`,
    list: (count: number) => `Saved setups (${count})`,
    empty: 'Nothing saved yet. Save this setup to keep it and to compare against it later.',
    open: 'Open',
    openNow: 'Open now',
    compare: 'Compare',
    rename: 'Rename',
    remove: 'Delete',
    rowAction: (action: string, name: string) => `${action}: ${name}`,
    newName: (name: string) => `New name for ${name}`,
    done: 'Done',
    cancel: 'Cancel',
    discardQuestion: 'Unsaved changes will be lost.',
    discard: 'Discard changes',
    removeQuestion: (name: string) => `Delete "${name}"? This cannot be undone.`,
    storageError: 'The browser storage could not be used. Setups are not being saved.',
    localOnly: 'Saved in this browser only.',
  },

  explore: {
    landscape: 'Which shaft and point suit this bow',
    landscapeIntro:
      'Every pair of spine and point weight, with the rest of the setup as it is. Press a cell to put that pair into the setup.',
    landscapeCaption: (unit: string) =>
      `Dynamic behavior by spine, in rows, and point weight in ${unit}, in columns`,
    axes: (unit: string) => `Spine \\ ${unit}`,
    cell: (spine: number, pointWeight: string, rating: string) =>
      `Spine ${spine}, point ${pointWeight}: ${rating}`,
    letter: { WEAK: 'W', NEUTRAL: 'N', STIFF: 'S' },
    sensitivity: 'What moves the result most',
    sensitivityIntro:
      'How far weak or stiff moves when a value goes up by a tenth of its range. The longest bar is what to look at first for this setup.',
    weaker: 'makes it weaker',
    stiffer: 'makes it stiffer',
    effect: (weaker: boolean, amount: string) => `${amount} ${weaker ? 'weaker' : 'stiffer'}`,
  },

  transfer: {
    heading: 'Share and back up',
    copyLink: 'Copy a link to this setup',
    link: 'Link to this setup',
    copied: 'Link copied.',
    copyByHand: 'The browser did not allow copying. Select the link and copy it by hand.',
    linkNote:
      'The link holds every value of the setup on screen, so it opens the same on any device. Nothing is sent to a server.',
    exportFile: 'Export to a file',
    importFile: 'Import from a file',
    chooseFile: 'File of setups to import',
    fileName: 'recurve-setups.json',
    exported: (count: number) =>
      count === 1 ? '1 setup written to the file.' : `${count} setups written to the file.`,
    imported: (added: number, known: number, invalid: number) =>
      [
        added === 1 ? '1 setup added.' : `${added} setups added.`,
        known > 0 ? `${known} already saved.` : '',
        invalid > 0 ? `${invalid} could not be read.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    notAFile: 'That file does not hold setups from this app.',
    fileNote:
      'The file holds the saved setups and the one on screen. Importing adds setups and never replaces a saved one.',
    offered: (name: string) => `This link carries a setup: ${name}`,
    replaces: 'Opening it replaces the setup on screen. Save yours first if you want to keep it.',
    openShared: 'Open it',
    notNow: 'Not now',
    unreadable: 'This link does not hold a setup that can be read.',
    dismiss: 'Close',
  },

  compare: {
    with: 'Compare with',
    empty: 'Save a setup first. Then change a value and come back here to see before and after.',
    saved: 'Saved',
    now: 'Now',
    openSetup: 'the setup on screen',
    differences: 'What differs',
    value: 'Value',
    upTo: (most: number) => `(up to ${most})`,
    same: 'Both setups have the same values.',
    sameAll: 'All of these setups have the same values.',
    note: 'Both columns are model results, not observations from real shooting.',
    noteAll: 'Every column is a model result, not an observation from real shooting.',
  },
}

export type Messages = typeof en
