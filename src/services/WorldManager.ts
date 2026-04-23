import { WorldEntity, WorldState, Character, Location, WorldObject } from '../types/entities';

const initialObjects: Record<string, WorldObject> = {
  'lickra_brand': {
    id: 'lickra_brand',
    type: 'OBJECT',
    displayName: 'Lickra(TM)',
    shortDescription: 'A high-performance synthetic fabric often found in the most questionable of garments.',
    longDescription: 'Developed in the late fifties, Lickra(TM) was marketed as the "Fabric of the Future." It is known for its incredible elasticity and its uncanny ability to retain odors for decades. In Revachol, it is the primary component of low-end "athleisure" wear favored by the functionally destitute.',
    attributes: {
      'Elasticity': 'High',
      'Breathability': 'Zero'
    }
  },
  'horrific_necktie': {
    id: 'horrific_necktie',
    type: 'OBJECT',
    displayName: 'Horrific Necktie',
    shortDescription: 'A loud, silk-blend garment that seems to be screaming at your eyes.',
    longDescription: 'The patterns on this tie are not just tacky; they are aggressive. It feels like it\'s vibrating at a frequency specifically designed to annoy anyone with a shred of dignity. It has also, on occasion, claimed to be your best friend.',
    attributes: {
      'Style': 'Loud',
      'Sentience': 'Debatable'
    }
  }
};

const initialLocations: Record<string, Location> = {
  'whirling_in_rags': {
    id: 'whirling_in_rags',
    type: 'LOCATION',
    displayName: 'Whirling-in-Rags',
    shortDescription: 'A hostel and cafeteria in Martinaise.',
    longDescription: 'The primary social hub of the neighborhood. It smells of old grease, spilled beer, and the collective hopelessness of its patrons. The floorboards creak with the weight of forgotten dreams.',
    attributes: {
      'Social Class': 'Low',
      'Ambiance': 'Grimy'
    }
  }
};

const initialCharacters: Record<string, Character> = {
  'kim_kitsuragi': {
    id: 'kim_kitsuragi',
    type: 'CHARACTER',
    displayName: 'Kim Kitsuragi',
    shortDescription: 'A lieutenant from the 57th Precinct. Professional, patient, and stoic.',
    longDescription: 'Lieutenant Kim Kitsuragi is your partner in this investigation. He wears an orange bomber jacket and a constant expression of professional detachment. He seems to have an infinite capacity for tolerating your eccentricities.',
    stats: {
      'authority': 4,
      'logic': 5,
      'volition': 5
    },
    opinions: {
      'YOU': 'A complicated individual with a questionable grasp on reality, but a detective nonetheless.'
    },
    attributes: {
      'Rank': 'Lieutenant',
      'Precinct': '57th'
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
