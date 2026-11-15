/** Visual and audio mood of each level (spec sections 9–11). Ramps go dark → light. */
export type ThemeId = 'overgrown' | 'cistern' | 'bells' | 'dark' | 'frozen';
export type ParticleStyle = 'fireflies' | 'drips' | 'motes' | 'wisps' | 'snow';

export interface Theme {
  id: ThemeId;
  numeral: string;
  title: string;
  /** Sky gradient stops, top → bottom of the view. */
  sky: string[];
  /** Brick ramp: [mortar/rim, deep, dark, mid, light, highlight]. */
  stone: string[];
  /** Back wall ramp, dark → light. */
  back: string[];
  /** Accent ramp (moss, algae, dust, fungus, snow), dark → light. */
  accent: string[];
  /** Secondary accent (flowers, water, bronze, bone, ice). */
  accent2: string[];
  /** Parallax silhouettes, each dark → light. */
  far: string[];
  mid: string[];
  near: string[];
  fog: string;
  /** 0..1, how thick the fog layers are. */
  fogDensity: number;
  /** 0..1, ambient light level (1 = fully lit, 0 = black without light sources). */
  ambient: number;
  /** Color of ambient light and grading. */
  tint: string;
  particles: ParticleStyle;
}

export const THEMES: Record<ThemeId, Theme> = {
  overgrown: {
    id: 'overgrown',
    numeral: 'I',
    title: 'The Overgrown Base',
    sky: ['#1d1f3a', '#2e2b4f', '#53395e', '#8a4c5e', '#c66e5c', '#eba062', '#f6cf86'],
    stone: ['#17141c', '#2a2730', '#3d3a40', '#55524f', '#726d62', '#968e78'],
    back: ['#121017', '#1b1920', '#24212a', '#2e2b34'],
    accent: ['#1c2a1a', '#2e4422', '#47652a', '#6c8c32', '#a2b84a'],
    accent2: ['#f2e2a0', '#e88a6a', '#f6f0d8', '#c8a0e0'],
    far: ['#5a4a6e', '#7a5f7a', '#9a7484'],
    mid: ['#2c2a42', '#36374e', '#424558'],
    near: ['#1a1822', '#23212c', '#2e2b36'],
    fog: '#d8a090',
    fogDensity: 0.32,
    ambient: 1,
    tint: '#ffd8a0',
    particles: 'fireflies',
  },
  cistern: {
    id: 'cistern',
    numeral: 'II',
    title: 'The Drowned Cistern',
    sky: ['#06121a', '#0b1e28', '#10303a', '#17434a', '#225a5c'],
    stone: ['#0b1216', '#18252a', '#243840', '#344e54', '#4a6a6a', '#6a8c84'],
    back: ['#0a1418', '#11202a', '#182c34', '#203840'],
    accent: ['#10261e', '#1a3c2c', '#2a5a3a', '#3e7a48', '#6aa25a'],
    accent2: ['#1a4a5a', '#2a7a8a', '#5ab0b0', '#a8e8e0'],
    far: ['#14303a', '#1a3c44', '#22484e'],
    mid: ['#0e2228', '#132a30', '#183238'],
    near: ['#0a171c', '#0e1d22', '#122228'],
    fog: '#5a9a98',
    fogDensity: 0.42,
    ambient: 0.8,
    tint: '#a0e0d8',
    particles: 'drips',
  },
  bells: {
    id: 'bells',
    numeral: 'III',
    title: 'The Bell Hall',
    sky: ['#2a1a2a', '#4a2a34', '#7a3e3a', '#b05a3a', '#e08a46', '#f6c46a'],
    stone: ['#1a120e', '#33241c', '#4e3828', '#6e5034', '#94704a', '#bc9a66'],
    back: ['#1a120f', '#251a15', '#30221b', '#3c2b22'],
    accent: ['#3a2a1a', '#5a4228', '#7a5a34', '#a07a44', '#d0b070'],
    accent2: ['#5a3a12', '#8a5a1a', '#c08a2a', '#f0c050', '#fff0a0'],
    far: ['#7a4a4a', '#9a5e50', '#ba7a5a'],
    mid: ['#3a2228', '#46282c', '#523036'],
    near: ['#22161a', '#2a1c20', '#342228'],
    fog: '#e8a878',
    fogDensity: 0.28,
    ambient: 0.95,
    tint: '#ffcf90',
    particles: 'motes',
  },
  dark: {
    id: 'dark',
    numeral: 'IV',
    title: 'The Lightless Floors',
    sky: ['#05040a', '#08060f', '#0c0a16', '#110e1e'],
    stone: ['#050408', '#100c16', '#1a1524', '#262034', '#352d46', '#4a4060'],
    back: ['#060509', '#0b0910', '#100d17', '#15121e'],
    accent: ['#0a2a2a', '#0e4a48', '#16807a', '#2ad0b8', '#9affe6'],
    accent2: ['#5a5248', '#8a8070', '#c0b8a0'],
    far: ['#0c0a14', '#100e1a', '#141220'],
    mid: ['#09080f', '#0c0a14', '#100e18'],
    near: ['#07060b', '#09080e', '#0c0a12'],
    fog: '#3a2a5a',
    fogDensity: 0.35,
    ambient: 0.06,
    tint: '#8070c0',
    particles: 'wisps',
  },
  frozen: {
    id: 'frozen',
    numeral: 'V',
    title: 'The Frozen Spire',
    sky: ['#04081a', '#081230', '#0e1c44', '#182a58', '#26406e', '#3a5a86'],
    stone: ['#0a0e1a', '#1a2236', '#2a3650', '#3e4e6c', '#5a6e8e', '#8098b8'],
    back: ['#0a0f1c', '#111a2c', '#18233a', '#202e48'],
    accent: ['#5a6e8e', '#8aa0c0', '#b8cce4', '#dce8f6', '#ffffff'],
    accent2: ['#2a6a9a', '#4aa0d0', '#8ad8f0', '#d0f6ff'],
    far: ['#1a2a4a', '#2a3e62', '#3e567e'],
    mid: ['#101a30', '#142038', '#182642'],
    near: ['#0a1222', '#0e162a', '#121c32'],
    fog: '#8aa8d0',
    fogDensity: 0.35,
    ambient: 0.55,
    tint: '#a8c8ff',
    particles: 'snow',
  },
};
