import { WorldEntity, WorldState, Character, Location, WorldObject } from '../types/entities';

const initialObjects: Record<string, WorldObject> = {
  'rusted_coin': {
    id: 'rusted_coin',
    type: 'OBJECT',
    displayName: 'Rusted Iron Coin',
    shortDescription: 'A heavy, notched currency from the Old Duchy.',
    longDescription: 'The iron is pitted with rust, but the seal of the dead Duke is still visible. It smells of copper and damp earth. In a place like the Crimson Veil, it might buy you a half-measure of watered wine or a very short conversation.',
    attributes: {
      'Value': 'Near-worthless',
      'Origin': 'Duchy of Oros'
    }
  },
  'velvet_choker': {
    id: 'velvet_choker',
    type: 'OBJECT',
    displayName: 'Stained Velvet Choker',
    shortDescription: 'Once elegant, now frayed and smelling of heavy musk.',
    longDescription: 'The deep red fabric is stiff with age and sweat. It has a small, tarnished silver clasp that looks like a weeping eye. It belongs to Vespera, though she hasn\'t worn it since the plague years.',
    attributes: {
      'Scent': 'Musk and Decay',
      'Material': 'Velvet'
    }
  }
};

const initialLocations: Record<string, Location> = {
  'crimson_veil': {
    id: 'crimson_veil',
    type: 'LOCATION',
    displayName: 'The Crimson Veil',
    shortDescription: 'A sagging timber-frame structure in the lower district.',
    longDescription: 'The air inside is thick with the smoke of tallow candles and cheap hashish. The walls are draped in moth-eaten tapestries that attempt to hide the rot. It is a place where secrets are bought for coppers and dignity is the first thing checked at the door.',
    attributes: {
      'Atmosphere': 'Oppressive',
      'Patronage': 'Desperate'
    }
  }
};

const initialCharacters: Record<string, Character> = {
  'madam_vespera': {
    id: 'madam_vespera',
    type: 'CHARACTER',
    displayName: 'Madam Vespera',
    shortDescription: 'The iron-willed matron of the Crimson Veil.',
    longDescription: 'Vespera is a woman of indeterminate age, her face a map of hard decisions and cold winters. She wears a dress of faded brocade and carries a heavy ring of keys that jingles with every rhythmic step. Her eyes see not your face, but the weight of your coin purse.',
    stats: {
      'authority': 7,
      'logic': 4,
      'volition': 6
    },
    opinions: {
      'YOU': 'A stray dog with better boots than most. Potentially useful, likely trouble.'
    },
    attributes: {
      'Status': 'Matron',
      'Affiliation': 'The Veiled'
    }
  }
};

class WorldManager {
  private state: WorldState = {
    objects: initialObjects,
    locations: initialLocations,
    characters: initialCharacters
  };

  getEntity(id: string): WorldEntity | undefined {
    return this.state.objects[id] || this.state.locations[id] || this.state.characters[id];
  }

  updateEntity(entity: Partial<WorldEntity> & { id: string }) {
    const existing = this.getEntity(entity.id);
    if (!existing) return;

    if (existing.type === 'OBJECT') {
      this.state.objects[entity.id] = { ...this.state.objects[entity.id], ...entity } as WorldObject;
    } else if (existing.type === 'LOCATION') {
      this.state.locations[entity.id] = { ...this.state.locations[entity.id], ...entity } as Location;
    } else if (existing.type === 'CHARACTER') {
      this.state.characters[entity.id] = { ...this.state.characters[entity.id], ...entity } as Character;
    }
  }

  getState(): WorldState {
    return this.state;
  }

  getAllEntities(): WorldEntity[] {
    return [
      ...Object.values(this.state.objects),
      ...Object.values(this.state.locations),
      ...Object.values(this.state.characters)
    ];
  }
}

export const worldManager = new WorldManager();
