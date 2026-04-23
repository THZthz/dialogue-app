import { WorldObject, ObjectRegistry } from '../types/worldObject';

// Initial registry with sample data
const registry: ObjectRegistry = {
  'lickra_brand': {
    id: 'lickra_brand',
    displayName: 'Lickra(TM)',
    shortDescription: 'A high-performance synthetic fabric often found in the most questionable of garments.',
    longDescription: 'Developed in the late fifties, Lickra(TM) was marketed as the "Fabric of the Future." It is known for its incredible elasticity and its uncanny ability to retain odors for decades. In Revachol, it is the primary component of low-end "athleisure" wear favored by the functionally destitute.',
    attributes: {
      'Elasticity': 'High',
      'Breathability': 'Zero',
      'Social Class': 'Functional Destitute',
      'Flammability': 'Caution required'
    }
  },
  'tequila_sunset': {
    id: 'tequila_sunset',
    displayName: 'Tequila Sunset',
    shortDescription: 'A cocktail of tragic proportions and a persona developed in the depths of a blackout.',
    longDescription: 'Not just a drink, but a state of mind. One part high-proof agave spirit, two parts absolute self-destruction, and a dash of forgotten history. It represents the moment when the party hasn\'t just ended, it has actively turned against you.',
    attributes: {
      'Components': 'Agave, Tragedy, Regret',
      'Alcohol Content': 'Worrying',
      'Flavor Profile': 'Bittersweet Nihilism',
      'Side Effects': 'Total Amnesia'
    }
  },
  'horrific_necktie': {
    id: 'horrific_necktie',
    displayName: 'Horrific Necktie',
    shortDescription: 'A loud, silk-blend garment that seems to be screaming at your eyes.',
    longDescription: 'The patterns on this tie are not just tacky; they are aggressive. It feels like it\'s vibrating at a frequency specifically designed to annoy anyone with a shred of dignity. It has also, on occasion, claimed to be your best friend.',
    attributes: {
      'Style': 'Loud',
      'Sentience': 'Debatable',
      'Colors': 'All of them, at once',
      'Odor': 'Faintly of bleach'
    }
  }
};

class ObjectManager {
  private objects: ObjectRegistry = registry;

  getObject(id: string): WorldObject | undefined {
    return this.objects[id];
  }

  registerObject(obj: WorldObject) {
    this.objects[obj.id] = obj;
  }

  getAllObjects(): WorldObject[] {
    return Object.values(this.objects);
  }
}

export const objectManager = new ObjectManager();
