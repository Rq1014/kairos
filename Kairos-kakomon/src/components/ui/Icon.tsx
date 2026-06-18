import { Feather, Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];
type IoniconName = ComponentProps<typeof Ionicons>['name'];

type IconEntry =
  | { family: 'feather'; name: FeatherName }
  | { family: 'ionicons'; name: IoniconName };

const ICON_MAP: Record<string, IconEntry> = {
  home:          { family: 'feather',   name: 'home' },
  book:          { family: 'feather',   name: 'book-open' },
  forum:         { family: 'feather',   name: 'message-square' },
  user:          { family: 'feather',   name: 'user' },
  back:          { family: 'feather',   name: 'chevron-left' },
  forward:       { family: 'feather',   name: 'chevron-right' },
  more:          { family: 'feather',   name: 'more-horizontal' },
  search:        { family: 'feather',   name: 'search' },
  filter:        { family: 'feather',   name: 'sliders' },
  close:         { family: 'feather',   name: 'x' },
  check:         { family: 'feather',   name: 'check' },
  bookmark:      { family: 'feather',   name: 'bookmark' },
  bookmarkFill:  { family: 'ionicons',  name: 'bookmark' },
  star:          { family: 'feather',   name: 'star' },
  heart:         { family: 'feather',   name: 'heart' },
  lock:          { family: 'feather',   name: 'lock' },
  sparkles:      { family: 'ionicons',  name: 'sparkles' },
  zap:           { family: 'feather',   name: 'zap' },
  coin:          { family: 'feather',   name: 'dollar-sign' },
  crown:         { family: 'ionicons',  name: 'trophy' },
  chevronRight:  { family: 'feather',   name: 'chevron-right' },
  chevronDown:   { family: 'feather',   name: 'chevron-down' },
  chevronUp:     { family: 'feather',   name: 'chevron-up' },
  chevronLeft:   { family: 'feather',   name: 'chevron-left' },
  plus:          { family: 'feather',   name: 'plus' },
  edit:          { family: 'feather',   name: 'edit-2' },
  copy:          { family: 'feather',   name: 'copy' },
  send:          { family: 'feather',   name: 'send' },
  upload:        { family: 'feather',   name: 'upload' },
  download:      { family: 'feather',   name: 'download' },
  graph:         { family: 'feather',   name: 'bar-chart-2' },
  brain:         { family: 'feather',   name: 'cpu' },
  flame:         { family: 'ionicons',  name: 'flame' },
  bell:          { family: 'feather',   name: 'bell' },
  settings:      { family: 'feather',   name: 'settings' },
  pageRef:       { family: 'feather',   name: 'file-text' },
  link:          { family: 'feather',   name: 'link' },
  flag:          { family: 'feather',   name: 'flag' },
  trophy:        { family: 'feather',   name: 'award' },
  globe:         { family: 'feather',   name: 'globe' },
  eye:           { family: 'feather',   name: 'eye' },
  eyeOff:        { family: 'feather',   name: 'eye-off' },
  message:       { family: 'feather',   name: 'message-circle' },
  refresh:       { family: 'feather',   name: 'refresh-cw' },
  thumbsUp:      { family: 'feather',   name: 'thumbs-up' },
  trending:      { family: 'feather',   name: 'trending-up' },
  zapOff:        { family: 'feather',   name: 'zap-off' },
  alert:         { family: 'feather',   name: 'alert-triangle' },
  arrow_right:   { family: 'feather',   name: 'arrow-right' },
  calendar:      { family: 'feather',   name: 'calendar' },
  clock:         { family: 'feather',   name: 'clock' },
  target:        { family: 'feather',   name: 'crosshair' },
  map:           { family: 'feather',   name: 'map-pin' },
  layers:        { family: 'feather',   name: 'layers' },
  list:          { family: 'feather',   name: 'list' },
  grid:          { family: 'feather',   name: 'grid' },
  percent:       { family: 'feather',   name: 'percent' },
  users:         { family: 'feather',   name: 'users' },
  trash:         { family: 'feather',   name: 'trash-2' },
  share:         { family: 'feather',   name: 'share-2' },
  image:         { family: 'feather',   name: 'image' },
  info:          { family: 'feather',   name: 'info' },
  helpCircle:    { family: 'feather',   name: 'help-circle' },
  checkCircle:   { family: 'feather',   name: 'check-circle' },
  xCircle:       { family: 'feather',   name: 'x-circle' },
};

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 18, color = 'currentColor' }: IconProps) {
  const entry = ICON_MAP[name];
  if (!entry) return null;

  if (entry.family === 'feather') {
    return <Feather name={entry.name} size={size} color={color} />;
  }
  return <Ionicons name={entry.name} size={size} color={color} />;
}
