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
    flight: 'Arrow flight',
    compare: 'Compare',
    bow: 'Bow in 3D (preview)',
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
    bow: 'Bow',
    arrow: 'Arrow',
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
    note: 'These are tendencies from a simplified model that has not been checked against real shooting. Test on your own bow before changing equipment.',
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

  suggestions: {
    heading: 'Tuning suggestions',
    tuned: 'The model reads this setup as tuned. There is nothing to suggest.',
    none: 'No single change within reach improves this setup much. Try a different shaft or a larger change than one step.',
    intro:
      'Each group is in order of priority: what helps most for the least effort. Each item is a single change from the setup as it is now, so try one, then look at the lists again.',
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
    distance: 'Distance',
    speed: 'Speed',
    real: 'Real',
    moment: 'Moment',
    momentText: (milliseconds: string, metres: string) =>
      `${milliseconds} milliseconds after release, ${metres} metres out`,
    play: 'Play',
    pause: 'Pause',
    restart: 'Restart',
    flyBare: 'Fly a bare shaft too',
    amplify: 'Amplify',
    realSpeed: 'Real speed.',
    slowed: (times: number) => `Slowed ${times} times.`,
    amplified: {
      top: 'Bending and drift are amplified, and the drawing is not to scale.',
      side: 'The arrow angle is amplified, and the drawing is not to scale.',
      both: 'Bending, drift and arrow angle are amplified, and the drawing is not to scale.',
    },
    topViewLabel: (stiffness: string, oscillation: string, lateral: string) =>
      `Top view of the arrow flying from the bow to the target. The arrow is ${stiffness}, with ${oscillation} oscillation and a ${lateral} lateral tendency.`,
    sideViewLabel: (vertical: string) =>
      `Side view of the arrow flying from the bow to the target. The arrow leaves the bow ${vertical}.`,
    level: 'level',
  },

  viewer: {
    lookAt: 'Look at',
    focus: { bow: 'Whole bow', centerShot: 'Center shot', nockingPoint: 'Nocking point' },
    amplify: (times: number) => `Draw offsets ${times} times larger`,
    about:
      'Preview: only center shot and nocking point height move the model so far. Change either one and the camera goes to it. Drag to turn the bow, scroll or pinch to zoom. The dashed gold line is the string line from above and the line square to the string from the side. Labels show real values; the bow is a simplified shape, not your equipment.',
    loading: 'Loading the 3D view.',
    failed:
      'The 3D view could not start. It needs WebGL, which this browser or device has turned off. The arrow flight views work without it.',
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

  compare: {
    with: 'Compare with',
    empty: 'Save a setup first. Then change a value and come back here to see before and after.',
    saved: 'Saved',
    now: 'Now',
    openSetup: 'the setup on screen',
    differences: 'What differs',
    value: 'Value',
    same: 'Both setups have the same values.',
    note: 'Both columns are model results, not observations from real shooting.',
  },
}

export type Messages = typeof en
