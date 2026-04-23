export interface WorldObject {
  id: string;
  displayName: string;
  shortDescription: string;
  longDescription: string;
  attributes: Record<string, string | number | boolean>;
}

export interface ObjectRegistry {
  [id: string]: WorldObject;
}
