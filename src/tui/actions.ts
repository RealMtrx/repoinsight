export interface PaletteItem {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface MenuItem extends PaletteItem {
  disabled?: boolean;
}
